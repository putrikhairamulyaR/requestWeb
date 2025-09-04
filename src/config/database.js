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

// 3. Buat connection pool berdasarkan konfigurasi
const pool = mysql.createPool(dbConfig);

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



async function setupDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Koneksi ke MySQL berhasil.');

    // Gunakan db_test (sudah dibuat otomatis oleh Docker)
    await connection.query(`USE \`${dbTest}\`;`);

    // Baca file skema SQL
    console.log('Membaca file skema SQL...');
    const schemaPath = '/home/ori/webJadwalAgent/requestWeb/db_test.sql';
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Jalankan skema SQL
    console.log('Menjalankan skema SQL...');
    await connection.query(schemaSql);

    //console.log('✅ Setup database tes berhasil diselesaikan!');
  } catch (error) {
    //console.error('❌ Gagal melakukan setup database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      //console.log('Koneksi ditutup.');
    }
  }
}



// 5. Ekspor pool dan fungsi testConnection
module.exports = {
  pool,
  testConnection
};