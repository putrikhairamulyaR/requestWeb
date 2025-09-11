// Muat environment variables terlebih dahulu, jika ada
require('dotenv').config();

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// --- KONFIGURASI ---
const dbName =  'db_test';
const dbPort =  3306; // Gunakan port 3307 untuk tes

// Konfigurasi untuk terhubung ke SERVER MySQL, bukan database spesifik.
const serverConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: dbPort,
  multipleStatements: true, // Izinkan eksekusi beberapa query dari file .sql
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
const pool = mysql.createPool(dbConfig);

/**
 * Fungsi ini akan:
 * 1. Terhubung ke server MySQL.
 * 2. Menghapus database tes lama (jika ada) untuk memastikan kebersihan.
 * 3. Membuat database tes baru.
 * 4. Menjalankan file db_test.sql untuk membuat tabel dan mengisi data.
 */
async function setupTestDatabase() {
  let connection;
  console.log(`Memulai proses setup untuk database '${dbName}' di port ${dbPort}...`);
  
  try {
    // 1. Buat koneksi ke server MySQL
    connection = await mysql.createConnection(serverConfig);
    console.log('🔌 Berhasil terhubung ke server MySQL.');

    // 2. Hapus database lama dan buat yang baru
    
    await connection.query(`USE \`${dbName}\`;`);
    console.log(`Database '${dbName}' berhasil dibuat dan dipilih.`);

    // 3. Baca file .sql untuk membuat tabel dan data
    // Pastikan file db_test.sql ada di root folder proyek Anda
    const schemaPath = path.join(__dirname, 'db_test.sql'); 
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⚙️  Menjalankan skema SQL untuk membuat tabel dan data...');
    await connection.query(schemaSql);

    console.log('✅ Setup database tes berhasil diselesaikan!');

  } catch (error) {
    console.error('❌ Gagal melakukan setup database:', error);
    process.exit(1); // Keluar dari skrip jika ada error
  } finally {
    // 4. Tutup koneksi agar skrip bisa berhenti
    if (connection) {
      await connection.end();
      console.log('Koneksi ditutup.');
    }
  }
}

// Panggil fungsi untuk memulai proses
//setupTestDatabase();

module.exports={
  pool
};
