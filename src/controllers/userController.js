const authService = require('../services/userServices');
const constants = require('../config/constants'); // Impor konstanta
const formService = require('../services/formServices');



// Controller untuk menampilkan halaman login
function showLoginPage(req, res) {
  // Render halaman login.ejs dan kirim variabel error bernilai null
  res.render('login', { error: null });
}

// Controller untuk MENGHANDLE form login
async function handleLogin(req, res) {
  try {
    const { nip, password } = req.body;

    // Validasi input
    if (!nip || !password) {
      // Jika tidak valid, render ulang halaman login dengan pesan error
      return res.render('login', { error: 'NIP dan Password wajib diisi.' });
    }

    // Panggil service untuk verifikasi
    const result = await authService.loginUser(nip, password);
    
    // PENTING: Jika login sukses, buat sesi dan redirect
    if (result.success) {
      
      req.session.token = result.token;
      req.session.user = result.user;

      // Logika redirect yang sudah dipindah dari frontend
      if (result.user.nip == constants.ADMIN_NIP) {
        return res.redirect('/admin'); // Arahkan admin ke halaman admin
      } else {
        return res.redirect('/form'); // Arahkan user biasa ke halaman form
      }
    }
    
  } catch (error) {
    // Jika service melempar error (user tidak ada, password salah)
    // Render ulang halaman login dengan pesan error dari service
    res.render('login', { error: error.message });
  }
}

async function showFormPage(req, res) {
  try {
    // 1. Ambil token dari sesi yang sudah dibuat saat login
    const token = req.session.token;
    if (!token) {
      // Jika tidak ada sesi, paksa kembali ke halaman login
      return res.redirect('/auth/login');
    }

    // 2. Panggil service untuk mengambil semua data yang dibutuhkan oleh halaman
    const pageData = await formService.getInitialData(token);

    // 3. Render file 'form.ejs' dan kirimkan semua data yang diperlukan
    res.render('form', {
      user: req.session.user, // Info user untuk ditampilkan di header
      data: pageData,         // Data utama (jatah, riwayat, dll.)
      message: null,          // Pesan status awal kosong
      status: null
    });

  } catch (error) {
    // Jika terjadi error saat mengambil data, render halaman error
    console.error('Error saat menampilkan halaman form:', error);
    res.status(500).render('error', { message: 'Gagal memuat data formulir. Silakan coba lagi.' });
  }
}

// Controller untuk menampilkan halaman Pengajuan Ulang (Edit)
async function showPengajuanUlangPage(req, res) {
  try {
    // 1. Ambil token dari session
    const token = req.session.token;
    if (!token) {
      return res.redirect('/auth/login');
    }

    // 2. Ambil ID pengajuan dari URL (misal /pengajuan/ulang/:id)
    const pengajuanId = req.params.id;

    // 3. Ambil data awal (jatah, riwayat, dll.)
    const pageData = await formService.getInitialData(token);
    console.log(pageData.pengajuan);
    // 4. Cari data pengajuan lama berdasarkan ID
    const pengajuanLama = pageData.pengajuan;
    if (!pengajuanLama) {
      return res.status(404).render('error', { message: 'Data pengajuan tidak ditemukan.' });
    }

    // 5. Render halaman pengajuan ulang dengan data lama
    res.render('pengajuanUlang', {
      user: req.session.user,
      data: {
        ...pengajuanLama,
        tanggalMerah: pageData.tanggalMerah || [],
        disableDatesLibur: pageData.disableDatesLibur || [],
        jatah: pageData.jatah || { liburTersisa: 0, cutiTersisa: 0, cutiLainTersisa: 0 }
      }, // ini yang dipakai untuk pre-fill form
      message: null,
      status: null
    });

  } catch (error) {
    console.error('Error saat menampilkan halaman pengajuan ulang:', error);
    res.status(500).render('error', { message: 'Gagal memuat data pengajuan ulang. Silakan coba lagi.' });
  }
}


/**
 * Controller untuk memproses data dari form pengajuan (POST /form/ajukan)
 */
async function handleInsert(req, res) {
  let pageData; // data untuk halaman

  try {
    const token = req.session.token;
    const user = req.session.user;
    const formData = req.body;

    console.log("Form data:", formData);

    // proses pengajuan
    const result = await formService.processPengajuan(token, formData);

    // ambil data terbaru
    pageData = await formService.getInitialData(token);

    // buat pesan
    let message = "";

    if (result.success.length > 0) {
      result.success.forEach(s => {
        message += `✅ Tanggal ${s.tanggal} berhasil diajukan (${s.jenis})<br/>`;
      });
    }

    if (result.failed.length > 0) {
      result.failed.forEach(f => {
        message += `❌ Tanggal ${f.tanggal} gagal diajukan (${f.jenis}) - ${f.reason}<br/>`;
      });
    }

    // render halaman dengan message
    res.render("form", {
      user,
      data: pageData,
      status: result.failed.length > 0 ? "gagal" : "sukses",
      message
    });

  } catch (error) {
    console.error("Error saat memproses pengajuan:", error);

    try {
      pageData = await formService.getInitialData(req.session.token);
    } catch (fetchError) {
      pageData = { jatah: {}, pengajuan: { libur: [], cuti: [], cutiLain: [] } };
    }

    res.render("form", {
      user: req.session.user,
      data: pageData,
      status: "gagal",
      message: error.message
    });
  }
}

// Contoh di /src/controllers/pengajuanUlangController.js



async function handleUpdate(req, res) {
    try {
    // Ambil data dari body request
    const { jenis, oldDate, newDate } = req.body;
    
    // Debug logging
    console.log('Update request received:', { jenis, oldDate, newDate });
    console.log('Request body:', req.body);
    
    // Validasi data yang diterima
    if (!jenis || !oldDate || !newDate) {
      console.log('Missing data:', { jenis: !!jenis, oldDate: !!oldDate, newDate: !!newDate });
      return res.status(400).json({ 
        success: false, 
        message: 'Data tidak lengkap. Pastikan jenis, oldDate, dan newDate terisi.' 
      });
    }
    
    // Ambil token dari sesi
    const token = req.session.token; 
    if (!token) {
        // Kirim error jika tidak ada sesi
        return res.status(401).json({ success: false, message: 'Unauthorized: Silakan login kembali.' });
    }

    // Panggil service untuk melakukan pekerjaan
    const result = await formService.updateTanggal(token, jenis, oldDate, newDate);
    
    // Jika service berhasil, kirim respons JSON yang sukses
    res.status(200).json(result);

  } catch (error) {
    // Jika terjadi error di mana pun di dalam blok 'try', 
    // server TIDAK AKAN CRASH. Sebaliknya, blok ini akan dijalankan.
    console.error('Error di handleUpdate:', error); // Log error di server
    
    // Kirim respons JSON yang berisi pesan error
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Terjadi kesalahan pada server saat mengupdate data.' 
    });
  }
}


async function handleDelete(req, res) {
    try {
        console.log('Delete request received:', req.body);
        const { jenis, tanggal } = req.body;
        const token = req.session.token;

        console.log('Token from session:', token);
        console.log('Request body:', { jenis, tanggal });

        if (!token) {
            console.log('No token found in session');
            return res.status(401).json({ success: false, message: "Sesi tidak valid" });
        }

        const result = await formService.hapusTanggal(token, jenis, tanggal);
        console.log('Delete result:', result);
        res.status(200).json(result);

    } catch (error) {
        console.error('Error in handleDelete:', error);
        res.status(400).json({ success: false, message: error.message });
    }
}


// Controller untuk logout
function handleLogout(req, res) {
  // Hapus session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error saat logout:', err);
      return res.status(500).render('error', { message: 'Gagal logout. Silakan coba lagi.' });
    }
    
    // Redirect ke halaman login
    res.redirect('/auth/login');
  });
}

// Controller untuk menampilkan halaman admin
function showAdminPage(req, res) {
  try {
    // Cek apakah user adalah admin
    if (req.session.user && req.session.user.nip == constants.ADMIN_NIP) {
      res.render('admin', { user: req.session.user });
    } else {
      res.status(403).render('error', { message: 'Akses ditolak. Hanya admin yang dapat mengakses halaman ini.' });
    }
  } catch (error) {
    console.error('Error saat menampilkan halaman admin:', error);
    res.status(500).render('error', { message: 'Gagal memuat halaman admin. Silakan coba lagi.' });
  }
}

// API untuk mengambil data pegawai
async function getPegawaiData(req, res) {
  try {
    const { pool } = require('../config/database');
    const query = 'SELECT nip as NIP, nama as Nama FROM useraccounts WHERE nip IS NOT NULL AND nama IS NOT NULL';
    
    const [results] = await pool.query(query);
    res.json(results);
  } catch (error) {
    console.error('Error in getPegawaiData:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

// API untuk mengambil data pengajuan
async function getPengajuanData(req, res) {
  try {
    const { pool } = require('../config/database');
    const query = `
      SELECT r.*, u.nama 
      FROM request r 
      LEFT JOIN useraccounts u ON r.nip = u.nip 
      ORDER BY r.id_request DESC
    `;
    
    const [results] = await pool.query(query);
    
    // Format data - one row per date request
    const formattedData = results.map(row => {
      const tanggal = row.tanggal.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
      const formattedDate = tanggal.split('-').reverse().join('-'); // Convert to DD-MM-YYYY
      
      return {
        nip: row.nip,
        nama: row.nama || '',
        jenis: row.jenis_pengajuan,
        request: [formattedDate], // Single date in array
        status: row.status_pengajuan || 'Pengajuan Pertama'
      };
    });
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error in getPengajuanData:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

// API untuk mengambil data tanggal merah
async function getTanggalMerahData(req, res) {
  try {
    console.log('Getting holiday data...');
    const { pool } = require('../config/database');
    const query = 'SELECT DATE_FORMAT(tanggal, "%Y-%m-%d") as tanggal FROM libur_nasional ORDER BY tanggal';
    
    const [results] = await pool.query(query);
    console.log('Holiday data retrieved:', results);
    res.json(results);
  } catch (error) {
    console.error('Error in getTanggalMerahData:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// API untuk menambah tanggal merah
async function addTanggalMerah(req, res) {
  try {
    console.log('Add holiday request received:', req.body);
    console.log('Request headers:', req.headers);
    console.log('Request session:', req.session);
    
    const { tanggal } = req.body;
    
    if (!tanggal) {
      console.log('No tanggal provided');
      return res.status(400).json({ error: 'Tanggal harus diisi' });
    }
    
    console.log('Adding holiday with date:', tanggal);
    const { pool } = require('../config/database');
    
    // Test database connection first
    try {
      const testQuery = 'SELECT 1 as test';
      const [testResults] = await pool.query(testQuery);
      console.log('Database connection test:', testResults);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    // Check if date already exists
    const checkQuery = 'SELECT COUNT(*) as count FROM libur_nasional WHERE tanggal = ?';
    console.log('Executing check query:', checkQuery, 'with date:', tanggal);
    const [checkResults] = await pool.query(checkQuery, [tanggal]);
    console.log('Check results:', checkResults);
    
    if (checkResults[0].count > 0) {
      console.log('Date already exists');
      return res.status(400).json({ error: 'Tanggal ini sudah ada dalam daftar' });
    }
    
    // Insert new date
    const insertQuery = 'INSERT INTO libur_nasional (tanggal) VALUES (?)';
    console.log('Executing insert query:', insertQuery, 'with date:', tanggal);
    const [insertResult] = await pool.query(insertQuery, [tanggal]);
    console.log('Insert result:', insertResult);
    
    if (insertResult.affectedRows > 0) {
      console.log('Successfully inserted new holiday date');
      res.json({ success: true, message: 'Tanggal merah berhasil ditambahkan' });
    } else {
      console.log('No rows affected during insert');
      res.status(500).json({ error: 'Gagal menambahkan tanggal merah' });
    }
  } catch (error) {
    console.error('Error in addTanggalMerah:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// API untuk menghapus tanggal merah
async function deleteTanggalMerah(req, res) {
  try {
    console.log('Delete request received:', req.body);
    const { tanggal } = req.body;
    
    if (!tanggal) {
      console.log('No tanggal provided');
      return res.status(400).json({ error: 'Tanggal harus diisi' });
    }
    
    console.log('Deleting tanggal:', tanggal);
    const { pool } = require('../config/database');
    
    // First, check if the date exists
    const checkQuery = 'SELECT COUNT(*) as count FROM libur_nasional WHERE tanggal = ?';
    console.log('Checking if date exists:', tanggal);
    const [checkResults] = await pool.query(checkQuery, [tanggal]);
    console.log('Check results:', checkResults);
    
    if (checkResults[0].count === 0) {
      console.log('Date not found in database:', tanggal);
      return res.status(404).json({ error: 'Tanggal merah tidak ditemukan di database' });
    }
    
    // Delete the date
    const deleteQuery = 'DELETE FROM libur_nasional WHERE tanggal = ?';
    console.log('Executing delete query for date:', tanggal);
    const [result] = await pool.query(deleteQuery, [tanggal]);
    console.log('Delete result:', result);
    
    if (result.affectedRows === 0) {
      console.log('No rows affected during delete - unexpected');
      return res.status(500).json({ error: 'Gagal menghapus tanggal merah' });
    }
    
    console.log('Successfully deleted tanggal:', tanggal);
    res.json({ success: true, message: 'Tanggal merah berhasil dihapus' });
  } catch (error) {
    console.error('Error in deleteTanggalMerah:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// API untuk reset pengajuan (mengembalikan jatah libur dan cuti CAP ke full)
async function resetPengajuan(req, res) {
  try {
    console.log('Reset pengajuan request received');
    const { pool } = require('../config/database');
    
    // First, backup the current data before reset
    const backupQuery = `
      SELECT * FROM request 
      WHERE jenis_pengajuan IN ('Libur', 'Cuti Lainnya')
    `;
    const [backupData] = await pool.query(backupQuery);
    
    // Store backup in a temporary table or return it for frontend storage
    console.log('Backup data:', backupData);
    
    // Delete only libur and cuti lainnya requests (not cuti tahunan)
    const deleteRequestsQuery = `
      DELETE FROM request 
      WHERE jenis_pengajuan IN ('Libur', 'Cuti Lainnya')
    `;
    const [deleteResult] = await pool.query(deleteRequestsQuery);
    console.log('Delete requests result:', deleteResult);
    
    // Reset cutiTerpakai to 0 for all users
    const resetQuery = `
      UPDATE useraccounts 
      SET cutiTerpakai = 0 
      WHERE cutiTerpakai > 0
    `;
    const [result] = await pool.query(resetQuery);
    console.log('Reset result:', result);
    
    res.json({ 
      success: true, 
      message: 'Reset pengajuan berhasil! Jatah cuti CAP dan libur telah dikembalikan ke full. Cuti tahunan tidak direset.',
      affectedUsers: result.affectedRows,
      deletedRequests: deleteResult.affectedRows,
      backupData: backupData // Send backup data for potential undo
    });
  } catch (error) {
    console.error('Error in resetPengajuan:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

// API untuk undo reset pengajuan
async function undoResetPengajuan(req, res) {
  try {
    console.log('Undo reset pengajuan request received');
    const { backupData } = req.body;
    
    if (!backupData || !Array.isArray(backupData)) {
      return res.status(400).json({ error: 'Backup data tidak valid' });
    }
    
    const { pool } = require('../config/database');
    
    // Restore the backup data
    let restoredCount = 0;
    for (const record of backupData) {
      const insertQuery = `
        INSERT INTO request (timestamp, nip, jenis_pengajuan, status_pengajuan, tanggal, tanggal_lama) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await pool.query(insertQuery, [
        record.timestamp,
        record.nip,
        record.jenis_pengajuan,
        record.status_pengajuan,
        record.tanggal,
        record.tanggal_lama
      ]);
      restoredCount++;
    }
    
    console.log('Restored records:', restoredCount);
    
    res.json({ 
      success: true, 
      message: `Undo reset berhasil! ${restoredCount} pengajuan telah dikembalikan.`,
      restoredCount: restoredCount
    });
  } catch (error) {
    console.error('Error in undoResetPengajuan:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

// API untuk generate jadwal
async function generateSchedule(req, res) {
  try {
    console.log('Generate schedule request received:', req.body);
    const { year, month, requests, public_holidays, demand } = req.body;
    
    // Validasi input
    if (!year || !month || !requests || !public_holidays || !demand) {
      return res.status(400).json({ 
        error: 'Missing required parameters: year, month, requests, public_holidays, demand' 
      });
    }
    
    console.log('Processing schedule generation for:', { year, month, requestsCount: requests.length });
    
    // Simulasi proses generate jadwal (untuk sementara)
    // Di implementasi nyata, ini akan memanggil algoritma scheduling yang kompleks
    const mockSchedule = await generateMockSchedule(year, month, requests, public_holidays, demand);
    
    // Simpan schedule ke variabel global untuk status check
    generatedSchedule = mockSchedule;
    
    // Simulasi status check URL (untuk polling)
    const statusCheckUrl = `/api/schedule-status/${Date.now()}`;
    
    // Simulasi async processing - kirim response dengan status check URL
    res.json({
      success: true,
      message: 'Proses pembuatan jadwal dimulai',
      status_check_url: statusCheckUrl,
      estimated_time: '30-60 detik'
    });
    
    // Simulasi proses background (dalam implementasi nyata, ini akan dijalankan di background)
    setTimeout(() => {
      // Simulasi hasil jadwal
      console.log('Mock schedule generated for all employees:', Object.keys(mockSchedule).length, 'employees');
    }, 2000);
    
  } catch (error) {
    console.error('Error in generateSchedule:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// Fungsi helper untuk generate mock schedule
async function generateMockSchedule(year, month, requests, public_holidays, demand) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const schedule = {};
  
  // Ambil semua pegawai dari database, bukan hanya dari requests
  const { pool } = require('../config/database');
  const [pegawaiResults] = await pool.query('SELECT nip FROM useraccounts WHERE nip IS NOT NULL');
  const allNips = pegawaiResults.map(p => p.nip);
  
  console.log('Generating schedule for all employees:', allNips);
  
  // Generate mock schedule untuk setiap pegawai
  allNips.forEach(nip => {
    schedule[nip] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay(); // 0 = Minggu, 1 = Senin, etc.
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Cek apakah ini hari libur nasional
      if (public_holidays.includes(dateStr)) {
        schedule[nip].push('Libur');
        continue;
      }
      
      // Cek apakah ada request untuk tanggal ini
      const requestForDate = requests.find(r => r.tanggal === dateStr && r.nip === nip);
      if (requestForDate) {
        schedule[nip].push(requestForDate.jenis === 'Libur' ? 'Libur' : 'Cuti');
        continue;
      }
      
      // Generate shift berdasarkan hari dalam seminggu
      if (dayOfWeek === 0) { // Minggu
        schedule[nip].push('P6');
      } else if (dayOfWeek === 6) { // Sabtu
        schedule[nip].push('P7');
      } else { // Weekday
        const shifts = ['P8', 'P9', 'P10', 'P11', 'S12', 'SOCM', 'SOC2', 'SOC6', 'M'];
        const randomShift = shifts[Math.floor(Math.random() * shifts.length)];
        schedule[nip].push(randomShift);
      }
    }
  });
  
  return schedule;
}

// Store generated schedule globally untuk status check
let generatedSchedule = null;

// API untuk check status generate jadwal
async function checkScheduleStatus(req, res) {
  try {
    const { id } = req.params;
    console.log('Checking schedule status for ID:', id);
    
    // Simulasi status check - dalam implementasi nyata, ini akan check status dari background job
    // Untuk demo, kita akan return success setelah beberapa detik
    const startTime = parseInt(id);
    const elapsed = Date.now() - startTime;
    
    if (elapsed < 5000) { // 5 detik pertama masih processing
      res.json({
        state: 'PROCESSING',
        message: 'Sedang memproses jadwal...',
        progress: Math.min(90, (elapsed / 5000) * 90)
      });
    } else {
      // Setelah 5 detik, return success dengan schedule yang sudah di-generate
      if (generatedSchedule) {
        const mockResult = {
          state: 'SUCCESS',
          result: [{
            result: {
              schedule: generatedSchedule
            }
          }]
        };
        
        res.json(mockResult);
      } else {
        res.json({
          state: 'ERROR',
          message: 'Jadwal tidak ditemukan. Silakan generate ulang.'
        });
      }
    }
    
  } catch (error) {
    console.error('Error in checkScheduleStatus:', error);
    res.status(500).json({ 
      state: 'ERROR',
      message: 'Terjadi kesalahan saat memproses jadwal: ' + error.message 
    });
  }
}

// API untuk menambah tanggal baru dari pengajuan ulang
async function addDate(req, res) {
  try {
    const token = req.session.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { jenis, tanggal } = req.body;
    
    // Debug logging
    console.log('Add date request received:', { jenis, tanggal });
    
    // Validasi data
    if (!jenis || !tanggal) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data tidak lengkap. Pastikan jenis dan tanggal terisi.' 
      });
    }

    // Format data sesuai yang diharapkan processPengajuan
    const formData = {
      [`jumlah${jenis === 'libur' ? 'Libur' : jenis === 'cuti' ? 'Cuti' : 'CutiLain'}`]: '1',
      [`tanggal${jenis === 'libur' ? 'Libur' : jenis === 'cuti' ? 'Cuti' : 'CutiLain'}Container_tanggal1`]: tanggal
    };
    
    console.log('Formatted data for processPengajuan:', formData);

    // Proses pengajuan
    const result = await formService.processPengajuan(token, formData);
    
    if (result.success.length > 0) {
      res.json({ 
        success: true, 
        message: `Tanggal ${tanggal} berhasil ditambahkan!`,
        data: result.success[0]
      });
    } else if (result.failed.length > 0) {
      res.status(400).json({ 
        success: false, 
        message: result.failed[0].reason || 'Gagal menambahkan tanggal'
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Gagal menambahkan tanggal'
      });
    }

  } catch (error) {
    console.error('Error in addDate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
}

module.exports = {
  showLoginPage,
  handleLogin,
  handleInsert,
  showFormPage,
  showPengajuanUlangPage,
  handleUpdate,
  handleDelete,
  handleLogout,
  showAdminPage,
  getPegawaiData,
  getPengajuanData,
  getTanggalMerahData,
  addTanggalMerah,
  deleteTanggalMerah,
  resetPengajuan,
  undoResetPengajuan,
  generateSchedule,
  checkScheduleStatus,
  addDate
};