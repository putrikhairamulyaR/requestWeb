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
      if (result.user.nip === constants.ADMIN_NIP) {
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
      data: (pengajuanLama), // ini yang dipakai untuk pre-fill form
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
        const { jenis, tanggal } = req.body;
        const token = req.session.token;

        const result = await formService.hapusTanggal(token, jenis, tanggal);
        res.status(200).json(result);

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}


module.exports = {
  showLoginPage,
  handleLogin,
  handleInsert,
  showFormPage,
  showPengajuanUlangPage,
  handleUpdate,
  handleDelete

};