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
router.get('/logout', userController.handleLogout);

// Rute untuk admin
router.get('/admin', userController.showAdminPage);

// API routes untuk admin (perlu protectRoute untuk keamanan)
router.get('/api/pegawai', protectRoute, userController.getPegawaiData);
router.get('/api/pengajuan', protectRoute, userController.getPengajuanData);
router.get('/api/tanggal-merah', protectRoute, userController.getTanggalMerahData);
router.post('/api/tanggal-merah', protectRoute, userController.addTanggalMerah);
router.delete('/api/tanggal-merah', protectRoute, userController.deleteTanggalMerah);
router.post('/api/reset-pengajuan', protectRoute, userController.resetPengajuan);
router.post('/api/undo-reset-pengajuan', protectRoute, userController.undoResetPengajuan);

// API untuk generate jadwal
router.post('/api/generate-schedule', protectRoute, userController.generateSchedule);

// API untuk check status generate jadwal
router.get('/api/schedule-status/:id', protectRoute, userController.checkScheduleStatus);

// API untuk menambah tanggal baru dari pengajuan ulang
router.post('/api/add-date', protectRoute, userController.addDate);


// Debug route to test if DELETE is working
router.delete('/api/test-delete', (req, res) => {
  console.log('Test DELETE route hit');
  res.json({ success: true, message: 'DELETE route is working' });
});

// Debug route to test database connection
router.get('/api/test-db', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const query = 'SELECT COUNT(*) as count FROM libur_nasional';
    const [results] = await pool.query(query);
    res.json({ success: true, message: 'Database connection working', count: results[0].count });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// Debug route to test date format
router.get('/api/test-dates', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const query = 'SELECT tanggal, DATE_FORMAT(tanggal, "%Y-%m-%d") as formatted_date FROM libur_nasional LIMIT 5';
    const [results] = await pool.query(query);
    res.json({ success: true, message: 'Date format test', data: results });
  } catch (error) {
    console.error('Date test error:', error);
    res.status(500).json({ error: 'Date test error: ' + error.message });
  }
});

module.exports = router;