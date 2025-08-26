const { pool } = require('../config/database');
const CONFIG = require('../config/constants');

class Request {
  /**
   * Menghitung total pengajuan per jenis untuk seorang pengguna.
   */
  static async countByUser(nip) {
    const sql = `
      SELECT LOWER(jenis_pengajuan) AS jenis, COUNT(*) AS total
      FROM request 
      WHERE nip = ?
      GROUP BY LOWER(jenis_pengajuan)`;
    const [rows] = await pool.query(sql, [nip]);
    return rows;
  }

  /**
   * Mengambil semua riwayat pengajuan untuk seorang pengguna.
   */
  static async findByUser(nip) {
    const sql = `
      SELECT jenis_pengajuan, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal_str
      FROM request 
      WHERE nip = ? ORDER BY tanggal`;
    const [rows] = await pool.query(sql, [nip]);
    return rows;
  }

  /**
   * Mengambil tanggal-tanggal libur yang kuotanya sudah penuh.
   */
  static async getDisabledLiburDates() {
    const sql = `
      SELECT DATE_FORMAT(tanggal, '%Y-%m-%d') AS tgl
      FROM request
      WHERE jenis_pengajuan = 'libur'
      GROUP BY tanggal
      HAVING COUNT(*) >= ?`;
    const [rows] = await pool.query(sql, [CONFIG.QUOTA.HARIAN]);
    return rows.map(r => r.tgl);
  }

  /**
   * Menyimpan satu data pengajuan baru.
   * @param {object} connection - Koneksi transaksi, bukan pool.
   * @param {string} nip - NIP pengguna.
   * @param {string} jenis - Jenis pengajuan (libur, cuti, dll).
   * @param {string} tanggal - Tanggal pengajuan (YYYY-MM-DD).
   */
  static async create(connection, nip, jenis, tanggal) {
    const sql = `
      INSERT INTO request (nip, jenis_pengajuan, tanggal, status_pengajuan, timestamp)
      VALUES (?, ?, ?, 'Pengajuan Baru', NOW())`;
    await connection.query(sql, [nip, jenis, tanggal]);
  }

  /**
   * Mengambil semua tanggal merah (libur nasional) dari database.
   * Fungsi ini dipindahkan dari holidayModel.js
   */
  static async getAllHolidays() {
    try {
      const sql = `SELECT DATE_FORMAT(tanggal, '%Y-%m-%d') AS tgl FROM libur_nasional ORDER BY tanggal`;
      const [rows] = await pool.query(sql);
      return rows.map(r => r.tgl);
    } catch (error) {
      console.error("Gagal mengambil tanggal merah:", error.message);
      // Anda bisa menambahkan logika fallback di sini jika perlu
      return []; // Kembalikan array kosong jika terjadi error
    }
  }
}

module.exports = Request;