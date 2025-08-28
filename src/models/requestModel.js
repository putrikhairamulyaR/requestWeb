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

  /**
   * Mengupdate satu tanggal pengajuan.
   * @param {string} nip - NIP pengguna.
   * @param {string} jenis - Jenis pengajuan.
   * @param {string} tanggalLama - Tanggal asli yang akan diubah (YYYY-MM-DD).
   * @param {string} tanggalBaru - Tanggal baru (YYYY-MM-DD).
   * @returns {Promise<object>} Hasil dari operasi query.
   */
  static async update(nip, jenis, tanggalLama, tanggalBaru) {
    const sql = `
      UPDATE request 
      SET 
        tanggal = ?, 
        status_pengajuan = 'Update Pengajuan', 
        timestamp = NOW()
      WHERE 
        nip = ? AND 
        jenis_pengajuan = ? AND 
        tanggal = ?
    `;
    const [result] = await pool.query(sql, [tanggalBaru, nip, jenis, tanggalLama]);
    return result;
  }

  /**
   * Menghapus satu tanggal pengajuan.
   * @param {string} nip - NIP pengguna.
   * @param {string} jenis - Jenis pengajuan.
   * @param {string} tanggal - Tanggal yang akan dihapus (YYYY-MM-DD).
   * @returns {Promise<object>} Hasil dari operasi query.
   */
  static async delete(nip, jenis, tanggal) {
    const sql = `DELETE FROM request WHERE nip = ? AND jenis_pengajuan = ? AND tanggal = ?`;
    const [result] = await pool.query(sql, [nip, jenis, tanggal]);
    return result;
  }

  /**
   * Menghitung total pengajuan 'libur' pada tanggal tertentu.
   * @param {string} tanggal - Tanggal yang akan dicek (format YYYY-MM-DD).
   * @returns {Promise<number>} Jumlah total pengajuan.
   */
  static async countLiburByDate(tanggal) {
    const sql = `
      SELECT COUNT(*) as total 
      FROM request 
      WHERE jenis_pengajuan = 'libur' AND tanggal = ?
    `;
    
    try {
      const [rows] = await pool.query(sql, [tanggal]);
      // Mengembalikan nilai 'total' dari baris pertama, atau 0 jika tidak ada hasil
      return rows[0].total || 0; 
    } catch (error) {
      console.error("Error di countByDate:", error);
      throw new Error("Gagal menghitung kuota tanggal.");
    }
  }
}


module.exports = Request;