const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const protectRoute = require('../middleware/authMiddleware');


router.get('/auth/login', userController.showLoginPage);
router.post('/auth/login', userController.handleLogin);
router.get('/form',protectRoute ,userController.showFormPage);
router.post('/form', protectRoute,userController.handleInsert);
router.get('/pengajuan-ulang',protectRoute ,userController.showPengajuanUlangPage);
router.put('/pengajuan-ulang',protectRoute ,userController.handleUpdate);
router.delete('/pengajuan-ulang', protectRoute,userController.handleDelete);

// Rute untuk logout
// router.get('/logout', authController.handleLogout);

module.exports = router;