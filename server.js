// =================================================================
// SERVER EXPRESS.JS - MIGRASI DARI GOOGLE APPS SCRIPT
// =================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const DatabaseService = require('./database_service');

const app = express();
const PORT = process.env.PORT || 3000;

// =================================================================
// MIDDLEWARE
// =================================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// =================================================================
// INSTANCE DATABASE SERVICE
// =================================================================

const dbService = new DatabaseService();

// =================================================================
// ROUTES HALAMAN UTAMA
// =================================================================

// Serve halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/pengajuanUlang', (req, res) => {
  res.sendFile(path.join(__dirname, 'pengajuanUlang.html'));
});

// =================================================================
// API ENDPOINTS
// =================================================================

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { nip, password } = req.body;
    
    if (!nip || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'NIP dan Password wajib diisi.' 
      });
    }

    const result = await dbService.loginUser(nip, password);
    res.json(result);
  } catch (error) {
    console.error('Login API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Logout
app.post('/api/logout', async (req, res) => {
  try {
    const { token } = req.body;
    const result = await dbService.logoutUser(token);
    res.json(result);
  } catch (error) {
    console.error('Logout API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get sisa jatah
app.post('/api/sisa-jatah', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const result = await dbService.getSisaJatah(token);
    res.json({ success: true, jatah: result });
  } catch (error) {
    console.error('Get sisa jatah API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Simpan satu tanggal
app.post('/api/simpan-satu-tanggal', async (req, res) => {
  try {
    const { token, jenis, tanggal } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const result = await dbService.simpanSatuTanggal(token, { jenis, tanggal });
    res.json(result);
  } catch (error) {
    console.error('Simpan satu tanggal API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update satu tanggal
app.post('/api/update-satu-tanggal', async (req, res) => {
  try {
    const { token, jenis, tanggalLama, tanggalBaru } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const result = await dbService.updateSatuTanggal(token, { jenis, tanggalLama, tanggalBaru });
    res.json(result);
  } catch (error) {
    console.error('Update satu tanggal API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Hapus satu tanggal
app.post('/api/hapus-satu-tanggal', async (req, res) => {
  try {
    const { token, jenis, tanggal } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const result = await dbService.hapusSatuTanggal(token, { jenis, tanggal });
    res.json(result);
  } catch (error) {
    console.error('Hapus satu tanggal API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Simpan pengajuan (multiple dates)
app.post('/api/simpan-pengajuan', async (req, res) => {
  try {
    const { token, jenis, tanggal } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const result = await dbService.simpanPengajuan(token, { jenis, tanggal });
    res.json(result);
  } catch (error) {
    console.error('Simpan pengajuan API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Hapus pengajuan
app.post('/api/hapus-pengajuan', async (req, res) => {
  try {
    const { token, jenisPengajuan } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const result = await dbService.hapusPengajuan(token, jenisPengajuan);
    res.json(result);
  } catch (error) {
    console.error('Hapus pengajuan API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get pengajuan user
app.post('/api/pengajuan-user', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const result = await dbService.getPengajuanUser(token);
    res.json({ success: true, pengajuan: result });
  } catch (error) {
    console.error('Get pengajuan user API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get pengajuan saya
app.post('/api/pengajuan-saya', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const result = await dbService.getPengajuanSaya(token);
    res.json({ success: true, pengajuan: result });
  } catch (error) {
    console.error('Get pengajuan saya API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get pengajuan untuk update
app.post('/api/pengajuan-untuk-update', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const result = await dbService.getPengajuanUntukUpdate(token);
    res.json({ success: true, pengajuan: result });
  } catch (error) {
    console.error('Get pengajuan untuk update API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get disable dates
app.post('/api/get-disable-dates', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const result = await dbService.getTanggalDisableUser(token);
    res.json({ success: true, disableDates: result });
  } catch (error) {
    console.error('Get disable dates API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get tanggal merah
app.get('/api/tanggal-merah', async (req, res) => {
  try {
    const result = await dbService.getTanggalMerah();
    res.json({ success: true, tanggalMerah: result });
  } catch (error) {
    console.error('Get tanggal merah API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get pegawai (admin)
app.get('/api/pegawai', async (req, res) => {
  try {
    const result = await dbService.getPegawai();
    res.json({ success: true, pegawai: result });
  } catch (error) {
    console.error('Get pegawai API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get pengajuan (admin)
app.get('/api/pengajuan', async (req, res) => {
  try {
    const result = await dbService.getPengajuan();
    res.json({ success: true, pengajuan: result });
  } catch (error) {
    console.error('Get pengajuan API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get initial data (untuk halaman form)
app.post('/api/initial', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const jatah = await dbService.getSisaJatah(token);
    const disableDatesLibur = await dbService.getTanggalDisableUser(token);
    const pengajuan = await dbService.getPengajuanUser(token);
    const tanggalMerah = await dbService.getTanggalMerah();
    
    res.json({ 
      success: true, 
      data: {
        jatah,
        disableDatesLibur,
        tanggalMerah,
        pengajuan
      }
    });
  } catch (error) {
    console.error('Get initial data API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// =================================================================
// ERROR HANDLING MIDDLEWARE
// =================================================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Terjadi kesalahan pada server' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint tidak ditemukan' 
  });
});

// =================================================================
// START SERVER
// =================================================================

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
  console.log(`📱 Aplikasi dapat diakses di: http://localhost:${PORT}`);
});

// =================================================================
// GRACEFUL SHUTDOWN
// =================================================================

process.on('SIGINT', async () => {
  console.log('\n🛑 Server akan dihentikan...');
  await dbService.db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Server akan dihentikan...');
  await dbService.db.close();
  process.exit(0);
}); 
