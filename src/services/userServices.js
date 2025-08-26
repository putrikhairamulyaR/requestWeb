// Mengimpor model yang berinteraksi langsung dengan database
const User = require('../models/userModel');
// Anda akan membutuhkan pustaka untuk token dan password hashing di sini
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');

async function loginUser(nip, password) {
  // 1. Panggil model untuk mendapatkan data dari DB
  const user = await User.findByNip(nip);
  
  if (!user) {
    throw new Error("NIP/NIK tidak terdaftar.");
  }

  // 2. Logika bisnis untuk memvalidasi password
  // SANGAT PENTING: Ganti ini dengan bcrypt.compare()
  const isPasswordMatch = (user.password === password); 
  if (!isPasswordMatch) {
    throw new Error("Password salah.");
  }

  // 3. Logika bisnis untuk membuat token sesi/JWT
  // Ganti ini dengan token yang aman dan acak (misalnya JWT)
  const token = String(user.nip); 
  // Logika untuk menyimpan sesi juga akan ada di sini

  // 4. Kembalikan data yang sudah diproses
  return {
    success: true,
    token: token,
    user: {
      nip: user.nip,
      nama: user.nama
    }
  };
}

async function getUserByToken(token) {
  // Karena token = nip, kita cukup cari user by nip
  const user = await User.findByNip(token);

  if (!user) {
    throw new Error("Token tidak valid atau user tidak ditemukan.");
  }

  return {
    nip: user.nip,
    nama: user.nama
  };
}

module.exports = {
  loginUser,
  getUserByToken
};