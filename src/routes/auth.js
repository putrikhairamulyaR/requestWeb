const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rute GET untuk menampilkan halaman login EJS
router.get('/auth/login', userController.showLoginPage);
router.post('/auth/login', userController.handleLogin);
router.get('/form', userController.showFormPage);
router.post('/form', userController.handleFormSubmission);
router.get('/pengajuan-ulang', userController.showPengajuanUlangPage);
router.post('/pengajuan-ulang', userController.showFormPage);

// Rute untuk logout
// router.get('/logout', authController.handleLogout);

module.exports = router;