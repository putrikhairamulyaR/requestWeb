// 1. Impor pustaka mysql2/promise
const mysql = require('mysql2/promise');
const dbTest = 'db_test';
const fs = require('fs');


const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_test',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
  multipleStatements: true,
});



async function setupDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    //console.log('Koneksi ke MySQL berhasil.');

    // Gunakan db_test (sudah dibuat otomatis oleh Docker)
    await connection.query(`USE \`${dbTest}\`;`);

    // Baca file skema SQL
    //console.log('Membaca file skema SQL...');
    const schemaPath = '/home/ori/webJadwalAgent/requestWeb/db_test.sql';
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Jalankan skema SQL
    //console.log('Menjalankan skema SQL...');
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

//setupDatabase();

module.exports = {
  pool
};