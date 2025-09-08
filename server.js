// =================================================================
// SERVER ENTRY POINT
// =================================================================

// 1. Muat variabel lingkungan dari file .env di paling atas
require('dotenv').config();

// 2. Impor aplikasi Express dari src/app.js
const app = require('./src/app');

// 3. Impor fungsi untuk mengetes koneksi database
const { testConnection } = require('./src/config/database');

// 4. Tentukan port dari environment, atau default ke 3000
const PORT = process.env.PORT || 3000;

/**
 * Fungsi untuk memulai server.
 * Pertama, ia akan mencoba terhubung ke database. 
 * Jika berhasil, baru ia akan menjalankan server Express.
 */
async function startServer() {
  try {
    // Tunggu sampai koneksi database berhasil diverifikasi
    await testConnection();

    // Jalankan server Express
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('💥 Gagal memulai server:', error);
    process.exit(1); // Hentikan proses jika database tidak bisa terhubung
  }
}

// Panggil fungsi untuk memulai server
startServer();