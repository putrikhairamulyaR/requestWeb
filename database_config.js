// =================================================================
// KONFIGURASI DATABASE MYSQL
// =================================================================

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Password kosong sesuai dengan database Anda
  database: 'web',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
};

module.exports = dbConfig; 
