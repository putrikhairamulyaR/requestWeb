// 1. Impor pustaka mysql2/promise
const mysql = require('mysql2/promise');
const dbTest = 'db_test';
const fs = require('fs');
// 2. Definisikan konfigurasi dari environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
  multipleStatements: true
};

const dbConfigTest = {
  host:  'localhost',
  user:  'root',
  password: '',
  database: 'db_test',
  port:  3306,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
  multipleStatements: true
};

// 3. Buat connection pool berdasarkan konfigurasi
//const pool = mysql.createPool(dbConfig);
const pool = mysql.createPool(dbConfigTest);
// 4. Tambahkan kembali fungsi untuk mengetes koneksi
/**
 * Memverifikasi koneksi ke database.
 * Jika gagal, aplikasi akan dihentikan.
 */
async function testConnection() {
  try {
    // Coba ambil satu koneksi dari pool
    const connection = await pool.getConnection();
    console.log('✅ Berhasil terhubung ke MySQL database');
    // Segera lepaskan koneksi setelah tes berhasil
    connection.release();
  } catch (error) {
    console.error('❌ Gagal terhubung ke database:', error.message);
    // Hentikan aplikasi jika tidak bisa terhubung ke database
    process.exit(1);
  }
}







// 5. Ekspor pool dan fungsi testConnection
module.exports = {
  pool,
 
  testConnection
};