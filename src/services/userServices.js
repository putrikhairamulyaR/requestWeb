const User = require('../models/userModel');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken'); // <-- Impor JWT

/**
 * Memverifikasi kredensial pengguna dan mengembalikan JWT jika valid.
 */
async function loginUser(nip, password) {
  // 1. Panggil model untuk mendapatkan data dari DB
  const user = await User.findByNip(nip);
  if (!user) {
    throw new Error("NIP/NIK atau Password salah."); // Pesan dibuat lebih umum untuk keamanan
  }

  
  const isPasswordValid = await bcrypt.compare(password, user.password); 
  if (!isPasswordValid) {
     throw new Error("NIP/NIK atau Password salah.");
   }
  // --- Logika plain text sementara (HARUS DIGANTI) ---
  

  // 3. Buat payload untuk token
  const payload = {
    nip: user.nip,
    nama: user.nama
  };

  // 4. Buat (tandatangani) JWT
  const token = jwt.sign(
    payload, 
    process.env.JWT_SECRET, // Gunakan kunci rahasia dari .env
    { expiresIn: '10m' } // Token akan kedaluwarsa dalam 10 menit
  );

  // 5. Kembalikan data yang dibutuhkan
  return {
    success: true,
    token: token, // Token sekarang adalah string acak yang aman
    user: {
      nip: user.nip,
      nama: user.nama
    }
  };
}

/**
 * Memverifikasi sebuah JWT dan mengembalikan payload jika valid.
 * @param {string} token - JWT dari klien.
 * @returns {object|null} Payload pengguna jika token valid, atau null jika tidak.
 */
function verifyUserToken(token) {
  if (!token) {
    return null;
  }
  try {
    // Coba verifikasi token menggunakan kunci rahasia
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    return decodedPayload; // Mengembalikan { nip, nama, iat, exp }
  } catch (error) {
    // Jika token tidak valid (kadaluwarsa, tanda tangan salah, dll.)
    console.error("Verifikasi token gagal:", error.message);
    return null;
  }
}

module.exports = {
  loginUser,
  verifyUserToken // Kita ganti nama fungsinya agar lebih jelas
};