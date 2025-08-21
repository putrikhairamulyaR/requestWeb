// =================================================================
// KONFIGURASI DATABASE MYSQL
// =================================================================

// Gunakan variabel lingkungan agar mudah dikonfigurasi saat deploy (Docker/K8s)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD === undefined ? '' : process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'web',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
};

module.exports = dbConfig;
