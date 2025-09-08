// =================================================================
// KONSTANTA APLIKASI
// =================================================================
// File ini berisi nilai-nilai tetap yang digunakan di seluruh aplikasi.
// Tujuannya adalah untuk menghindari 'magic numbers' atau string
// yang tersebar di banyak file.

module.exports = {
  // NIP khusus yang dianggap sebagai admin
  ADMIN_NIP: '400199',

  // Kuota default untuk setiap jenis pengajuan per pengguna
  QUOTA: {
    LIBUR: 3,
    CUTI: 12,
    HARIAN: 5, // Kuota harian untuk jenis 'Libur'
    CUTILAIN: 3
  },

  // (Opsional) Anda bisa menambahkan konstanta lain di sini, misalnya:
  // JWT_EXPIRATION: '8h',
  // DEFAULT_STATUS: 'Pengajuan Baru'
};