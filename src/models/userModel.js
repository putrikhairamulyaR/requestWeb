// Mengimpor koneksi database dari file konfigurasi
const { pool } = require('../config/database'); 

class User {
  /**
   * Mencari user berdasarkan NIP.
   * @param {string} nip - NIP pengguna.
   * @returns {Promise<object|null>} Data pengguna atau null jika tidak ditemukan.
   */
  static async findByNip(nip) {
    const sql = `
      SELECT nip, nama, password 
      FROM useraccounts 
      WHERE nip = ?
    `;
    
    // Hanya menjalankan kueri dan mengembalikan hasilnya
    const [rows] = await pool.query(sql, [nip]);
    return rows[0];
  }

  // Anda bisa menambahkan fungsi lain di sini, contoh:
  // static async create(userData) { ... }
  // static async findById(id) { ... }
}

module.exports = User;