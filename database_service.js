// =================================================================
// SERVICE LAYER - MIGRASI DARI GOOGLE APPS SCRIPT
// =================================================================

const DatabaseConnection = require('./database_connection');
const { v4: uuidv4 } = require('uuid');

class DatabaseService {
  constructor() {
    this.db = new DatabaseConnection();
    this.sessions = new Map(); // Simple session storage
  }

  // =================================================================
  // KONFIGURASI GLOBAL
  // =================================================================
  get CONFIG() {
    return {
      ADMIN_NIP: '400199',
      QUOTA: {
        LIBUR: 3,
        CUTI: 12,
        HARIAN: 5,
        CUTILAIN: 3
      }
    };
  }

  // =================================================================
  // FUNGSI UTILITAS
  // =================================================================

  async getNipFromToken(token) {
    // Simple session lookup; fallback: if token looks like NIP (digits), use it
    const fromSession = this.sessions.get(token);
    if (fromSession) return fromSession;
    if (typeof token === 'string' && /^\d{3,}$/.test(token)) return token;
    return null;
  }

  generateToken() {
    return uuidv4();
  }

  // =================================================================
  // FUNGSI OTENTIKASI & SESI
  // =================================================================

  async loginUser(nip, password) {
    try {
      // Cek user di database
      const sql = `
        SELECT nip, nama, password 
        FROM useraccounts 
        WHERE nip = ?
      `;
      
      const users = await this.db.query(sql, [nip]);
      
      if (users.length === 0) {
        return { success: false, message: "NIP/NIK tidak terdaftar." };
      }

      const user = users[0];
      
      // Normalisasi password
      const storedPassword = (user.password ?? '').toString().trim();
      const inputPassword = (password ?? '').toString().trim();

      // Aturan: jika password di DB kosong, izinkan login dengan password kosong atau '123'
      if (storedPassword === '') {
        const allowedDefault = inputPassword === '' || inputPassword === '123';
        if (!allowedDefault) {
          return { success: false, message: "Password salah." };
        }
      } else {
        // Jika ada password di DB, harus sama persis (plain text sementara)
        if (storedPassword !== inputPassword) {
          return { success: false, message: "Password salah." };
        }
      }

      // Generate token (untuk dev: gunakan NIP sebagai token agar tahan restart)
      const token = String(nip);
      this.sessions.set(token, nip);

      return {
        success: true,
        token: token,
        user: {
          nip: user.nip,
          nama: user.nama
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: "Terjadi kesalahan pada server." };
    }
  }

  async logoutUser(token) {
    try {
      this.sessions.delete(token);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: "Gagal logout." };
    }
  }

  async getUserInfo(token) {
    try {
      const nip = await this.getNipFromToken(token);
      if (!nip) return null;
      const rows = await this.db.query(`SELECT nip, nama FROM useraccounts WHERE nip = ?`, [nip]);
      if (rows.length > 0) {
        return { nip: String(rows[0].nip), nama: rows[0].nama };
      }
      return { nip: String(nip), nama: '' };
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  // =================================================================
  // FUNGSI UNTUK PENGGUNA
  // =================================================================

  async getSisaJatah(token) {
    try {
      const nip = await this.getNipFromToken(token);
      if (!nip) {
        return { liburTersisa: 0, cutiTersisa: 0, cutiLainTersisa: 0 };
      }

      // Hitung pengajuan yang sudah ada (case-insensitive)
      const sql = `
        SELECT LOWER(jenis_pengajuan) AS jenis, COUNT(*) AS total
        FROM request 
        WHERE nip = ?
        GROUP BY LOWER(jenis_pengajuan)
      `;
      
      const results = await this.db.query(sql, [nip]);
      
      let totalLibur = 0, totalCuti = 0, totalCutiLain = 0;
      
      results.forEach(row => {
        const jenis = (row.jenis || '').toString();
        if (jenis === 'libur') totalLibur = row.total;
        if (jenis === 'cuti') totalCuti = row.total;
        if (jenis === 'cuti lainnya') totalCutiLain = row.total;
      });

      return {
        liburTersisa: Math.max(0, this.CONFIG.QUOTA.LIBUR - totalLibur),
        cutiTersisa: Math.max(0, this.CONFIG.QUOTA.CUTI - totalCuti),
        cutiLainTersisa: Math.max(0, this.CONFIG.QUOTA.CUTILAIN - totalCutiLain)
      };
    } catch (error) {
      console.error('Get sisa jatah error:', error);
      return { liburTersisa: 0, cutiTersisa: 0, cutiLainTersisa: 0 };
    }
  }

  async simpanSatuTanggal(token, data) {
    try {
      const nip = await this.getNipFromToken(token);
      if (!nip) {
        return { success: false, message: "⚠️ Sesi tidak valid." };
      }

      const { jenis, tanggal } = data;
      if (!jenis || !tanggal) {
        return { success: false, message: "⚠️ Data pengajuan tidak lengkap." };
      }

      // Cek kuota harian untuk libur
      if (jenis.toLowerCase() === 'libur') {
        const dayOfWeek = new Date(tanggal).getDay();
        const maxQuota = (dayOfWeek === 0 || dayOfWeek === 6) ? 10 : this.CONFIG.QUOTA.HARIAN;

        const dailyCountSql = `
          SELECT COUNT(*) as total
          FROM request 
          WHERE jenis_pengajuan = 'libur' AND tanggal = ?
        `;
        const dailyCount = await this.db.query(dailyCountSql, [tanggal]);

        if (dailyCount[0].total >= maxQuota) {
          return {
            success: false,
            message: `❌ Tanggal ${tanggal} sudah mencapai batas kuota harian (${maxQuota}).`
          };
        }
      }

      // Cek apakah sudah ada pengajuan untuk tanggal yang sama
      const existingSql = `
        SELECT COUNT(*) as total
        FROM request 
        WHERE nip = ? AND jenis_pengajuan = ? AND tanggal = ?
      `;
      const existing = await this.db.query(existingSql, [nip, jenis, tanggal]);

      if (existing[0].total > 0) {
        return {
          success: false,
          message: `❌ Anda sudah mengajukan ${jenis} untuk tanggal ${tanggal}.`
        };
      }

      // Simpan pengajuan
      const insertSql = `
        INSERT INTO request (nip, jenis_pengajuan, tanggal, status_pengajuan, timestamp)
        VALUES (?, ?, ?, 'Pengajuan Baru', NOW())
      `;
      await this.db.query(insertSql, [nip, jenis, tanggal]);

      return {
        success: true,
        message: `✅ Pengajuan ${jenis} untuk tanggal ${tanggal} berhasil disimpan.`
      };
    } catch (error) {
      console.error('Simpan tanggal error:', error);
      return { success: false, message: `❌ Gagal menyimpan: ${error.message}` };
    }
  }

  async getPegawai() {
    try {
      const sql = `
        SELECT nip, nama, jabatan, unit_kerja
        FROM useraccounts 
        ORDER BY nama
      `;
      
      const pegawai = await this.db.query(sql);
      return pegawai.map(p => ({
        nip: p.nip,
        nama: p.nama,
        jabatan: p.jabatan || '',
        unitKerja: p.unit_kerja || ''
      }));
    } catch (error) {
      console.error('Get pegawai error:', error);
      return [];
    }
  }

  async getPengajuan() {
    try {
      const sql = `
        SELECT 
          r.nip,
          ua.nama,
          r.jenis_pengajuan,
          r.status_pengajuan,
          DATE_FORMAT(r.tanggal, '%Y-%m-%d') AS tanggal_str,
          r.timestamp
        FROM request r
        JOIN useraccounts ua ON r.nip = ua.nip
        ORDER BY r.timestamp DESC
      `;
      
      const pengajuan = await this.db.query(sql);
      return pengajuan.map(p => ({
        nip: p.nip,
        nama: p.nama,
        request: `${p.jenis_pengajuan}: ${p.tanggal_str}`,
        status: p.status_pengajuan
      }));
    } catch (error) {
      console.error('Get pengajuan error:', error);
      return [];
    }
  }

  async getPengajuanUser(token) {
    try {
      const nip = await this.getNipFromToken(token);
      if (!nip) return { libur: [], cuti: [], cutiLain: [] };

      const sql = `
        SELECT jenis_pengajuan, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal_str
        FROM request 
        WHERE nip = ?
        ORDER BY tanggal
      `;
      
      const requests = await this.db.query(sql, [nip]);
      
      const libur = [];
      const cuti = [];
      const cutiLain = [];

      requests.forEach(req => {
        const tanggal = req.tanggal_str;
        const jenis = (req.jenis_pengajuan || '').toString().toLowerCase().trim();
        if (jenis === 'libur') {
          libur.push(tanggal);
        } else if (jenis === 'cuti') {
          cuti.push(tanggal);
        } else if (jenis === 'cuti lainnya') {
          cutiLain.push(tanggal);
        }
      });

      return {
        libur: [...new Set(libur)],
        cuti: [...new Set(cuti)],
        cutiLain: [...new Set(cutiLain)]
      };
    } catch (error) {
      console.error('Get pengajuan user error:', error);
      return { libur: [], cuti: [], cutiLain: [] };
    }
  }

  async updateSatuTanggal(token, data) {
    const nip = await this.getNipFromToken(token);
    if (!nip) {
      return { success: false, message: "⚠️ Sesi tidak valid." };
    }

    const { jenis, tanggalLama, tanggalBaru } = data;
    if (!jenis || !tanggalLama || !tanggalBaru) {
      return { success: false, message: "⚠️ Parameter tidak lengkap." };
    }

    try {
      // Cek kuota harian untuk tanggal baru
      if (jenis.toLowerCase() === 'libur') {
        const dayOfWeek = new Date(tanggalBaru).getDay();
        const maxQuota = (dayOfWeek === 0 || dayOfWeek === 6) ? 10 : 5;

        const dailyCountSql = `
          SELECT COUNT(*) as total
          FROM request 
          WHERE jenis_pengajuan = 'libur' AND tanggal = ?
        `;
        const dailyCount = await this.db.query(dailyCountSql, [tanggalBaru]);

        if (dailyCount[0].total >= maxQuota) {
          return {
            success: false,
            message: `❌ Tanggal ${tanggalBaru} sudah mencapai batas kuota harian (${maxQuota}).`
          };
        }
      }

      // Update pengajuan
      await this.db.query(`
        UPDATE request 
        SET tanggal = ?, status_pengajuan = 'Update Pengajuan', timestamp = NOW()
        WHERE nip = ? AND jenis_pengajuan = ? AND tanggal = ?
      `, [tanggalBaru, nip, jenis, tanggalLama]);

      return {
        success: true,
        message: `✅ Tanggal '${tanggalLama}' berhasil diganti menjadi '${tanggalBaru}'.`
      };
    } catch (error) {
      console.error('Update tanggal error:', error);
      return { success: false, message: `❌ Gagal menyimpan: ${error.message}` };
    }
  }

  async hapusSatuTanggal(token, data) {
    const nip = await this.getNipFromToken(token);
    if (!nip) throw new Error("Token tidak valid.");

    const { jenis, tanggal } = data;
    if (!jenis || !tanggal) throw new Error("Data tidak lengkap.");

    try {
      const result = await this.db.query(`
        DELETE FROM request 
        WHERE nip = ? AND jenis_pengajuan = ? AND tanggal = ?
      `, [nip, jenis, tanggal]);

      if (result.affectedRows > 0) {
        return {
          success: true,
          message: `Tanggal ${tanggal} berhasil dihapus.`
        };
      } else {
        return { success: false, message: "Tanggal tidak ditemukan untuk dihapus." };
      }
    } catch (error) {
      console.error('Hapus tanggal error:', error);
      return { success: false, message: error.message };
    }
  }

  async simpanPengajuan(token, data) {
    const nip = await this.getNipFromToken(token);
    if (!nip) throw new Error("Sesi tidak valid.");

    const { jenis, tanggal } = data;
    if (!jenis || !Array.isArray(tanggal) || tanggal.length === 0) {
      throw new Error("Data pengajuan tidak lengkap.");
    }

    try {
      const accepted = [];
      const rejected = [];

      for (const tgl of tanggal) {
        const result = await this.simpanSatuTanggal(token, { jenis, tanggal: tgl });
        if (result.success) {
          accepted.push(tgl);
        } else {
          rejected.push(tgl);
        }
      }

      let msg = "";
      if (accepted.length) msg += `✅ Pengajuan tersimpan untuk: ${accepted.join(", ")}.\n`;
      if (rejected.length) msg += `⚠️ Ditolak: ${rejected.join(", ")}.`;

      return {
        success: accepted.length > 0,
        message: msg.trim() || "Tidak ada perubahan."
      };
    } catch (error) {
      console.error('Simpan pengajuan error:', error);
      return { success: false, message: `Terjadi error: ${error.message}` };
    }
  }

  async hapusPengajuan(token, jenisPengajuan) {
    const nip = await this.getNipFromToken(token);
    if (!nip || !jenisPengajuan) return { success: false, message: "Data tidak lengkap" };

    try {
      const result = await this.db.query(`
        DELETE FROM request 
        WHERE nip = ? AND jenis_pengajuan = ?
      `, [nip, jenisPengajuan]);

      return {
        success: true,
        message: `Berhasil menghapus ${result.affectedRows} pengajuan ${jenisPengajuan}.`
      };
    } catch (error) {
      console.error('Hapus pengajuan error:', error);
      return { success: false, message: error.message };
    }
  }

  async getPengajuanSaya(token) {
    const nip = await this.getNipFromToken(token);
    if (!nip) return [];

    try {
      const sql = `
        SELECT 
          r.nip,
          ua.nama,
          r.jenis_pengajuan,
          r.status_pengajuan,
          DATE_FORMAT(r.tanggal, '%Y-%m-%d') AS tanggal_str,
          r.timestamp
        FROM request r
        JOIN useraccounts ua ON r.nip = ua.nip
        WHERE r.nip = ?
        ORDER BY r.timestamp DESC
      `;
      const requests = await this.db.query(sql, [nip]);

      return requests.map(req => ({
        nip: req.nip,
        nama: req.nama,
        request: `${req.jenis_pengajuan}: ${req.tanggal_str}`,
        status: req.status_pengajuan
      }));
    } catch (error) {
      console.error('Get pengajuan saya error:', error);
      return [];
    }
  }

  async getPengajuanUntukUpdate(token) {
    const nip = await this.getNipFromToken(token);
    if (!nip) return { libur: [], cuti: [], cuti_lainnya: [] };

    try {
      const sql = `
        SELECT jenis_pengajuan, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal_str
        FROM request 
        WHERE nip = ?
        ORDER BY tanggal
      `;
      const requests = await this.db.query(sql, [nip]);

      const libur = [];
      const cuti = [];
      const cuti_lainnya = [];

      requests.forEach(req => {
        const tanggal = req.tanggal_str;
        const jenis = (req.jenis_pengajuan || '').toString().toLowerCase().trim();
        if (jenis === 'libur') {
          libur.push(tanggal);
        } else if (jenis === 'cuti') {
          cuti.push(tanggal);
        } else if (jenis === 'cuti lainnya') {
          cuti_lainnya.push(tanggal);
        }
      });

      return {
        libur: [...new Set(libur)],
        cuti: [...new Set(cuti)],
        cuti_lainnya: [...new Set(cuti_lainnya)]
      };
    } catch (error) {
      console.error('Get pengajuan untuk update error:', error);
      return { libur: [], cuti: [], cuti_lainnya: [] };
    }
  }

  async getTanggalDisableUser(token) {
    const nip = await this.getNipFromToken(token);
    if (!nip) return [];

    try {
      // Ambil semua pengajuan libur
      const sql = `
        SELECT tanggal, COUNT(*) as total
        FROM request 
        WHERE jenis_pengajuan = 'libur'
        GROUP BY tanggal
        HAVING total >= 5
      `;
      const results = await this.db.query(sql);

      return results.map(row => row.tanggal.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Get tanggal disable error:', error);
      return [];
    }
  }

  // =================================================================
  // FUNGSI TANGGAL MERAH (LIBUR NASIONAL)
  // =================================================================

  async getTanggalMerah() {
    try {
      // Untuk sementara kembalikan array kosong karena tabel libur_nasional belum ada
      // Bisa ditambahkan nanti jika diperlukan
      return [];
    } catch (error) {
      console.error('Get tanggal merah error:', error);
      return [];
    }
  }

  async fetchTglMerahBlnIni(bulan, tahun = new Date().getFullYear()) {
    try {
      // Untuk sementara kembalikan array kosong
      return [];
    } catch (error) {
      console.error('Fetch tanggal merah bulan ini error:', error);
      return [];
    }
  }

  // =================================================================
  // FUNGSI UTILITAS TANGGAL
  // =================================================================

  normalizeDateString(dateStr) {
    const [y, m, d] = dateStr.split('-').map(part => part.padStart(2, '0'));
    return `${y}-${m}-${d}`;
  }
}

module.exports = DatabaseService; 
