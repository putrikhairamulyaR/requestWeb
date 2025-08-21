// =================================================================
// KONFIGURASI GLOBAL - DATABASE VERSION
// =================================================================
const CONFIG = {
  DATABASE_URL: 'http://localhost:3000/api', // URL ke Node.js backend
  ADMIN_NIP: '400199',
  QUOTA: {
    LIBUR: 3,
    CUTI: 12,
    HARIAN: 5,
    CUTILAIN: 3
  }
};

// =================================================================
// KONTROLER UTAMA (ENTRY POINT WEB APP)
// =================================================================
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Login & Registrasi')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  // Fungsi ini sengaja dikosongkan karena navigasi ditangani oleh getPageContent
}

// =================================================================
// FUNGSI UTILITAS DATABASE
// =================================================================

/**
 * Fungsi untuk melakukan HTTP request ke backend database
 */
function makeDatabaseRequest(endpoint, method = 'GET', data = null) {
  try {
    const url = CONFIG.DATABASE_URL + endpoint;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };
    
    if (data && method !== 'GET') {
      options.payload = JSON.stringify(data);
    }
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode >= 200 && responseCode < 300) {
      return JSON.parse(responseText);
    } else {
      throw new Error(`HTTP ${responseCode}: ${responseText}`);
    }
  } catch (error) {
    Logger.log(`Database request error: ${error.message}`);
    throw error;
  }
}

// =================================================================
// FUNGSI TANGGAL MERAH (LIBUR NASIONAL)
// =================================================================

function getTanggalMerah() {
  try {
    // Untuk sementara kembalikan array kosong karena tabel libur_nasional belum ada
    // Bisa ditambahkan nanti jika diperlukan
    return [];
  } catch (err) {
    Logger.log(err.stack);
    return [];
  }
}

function fetchTglMerahBlnIni(bulan, tahun = new Date().getFullYear()) {
  try {
    // Untuk sementara kembalikan array kosong
    return [];
  } catch (err) {
    Logger.log(err.stack);
    return [];
  }
}

function getTanggalDisableUser(token) {
  const userNip = getNipFromToken(token);
  if (!userNip) return [];

  try {
    // Ambil data dari database
    const response = makeDatabaseRequest('/get-disable-dates', 'POST', { token });
    
    if (response.success) {
      return response.disableDates || [];
    } else {
      Logger.log(`Error getting disable dates: ${response.message}`);
      return [];
    }
  } catch (e) {
    Logger.log('getTanggalDisableUser error ► ' + e);
    return [];
  }
}

function normalizeDateString(dateStr) {
  const [y, m, d] = dateStr.split('-').map(part => part.padStart(2, '0'));
  return `${y}-${m}-${d}`;
}

// =================================================================
// FUNGSI NAVIGASI HALAMAN
// =================================================================

function getPageContent(pageName, token) {
  try {
    const nip = getNipFromToken(token);

    if (!nip && pageName !== 'login') {
      return HtmlService.createHtmlOutputFromFile('index').getContent();
    }
    
    let template;
    switch (pageName) {
      case 'form':
        template = HtmlService.createTemplateFromFile(pageName);
        break;
      case 'dashboard':
        template = HtmlService.createTemplateFromFile(pageName);
        break;
      case 'pengajuanUlang': 
        template = HtmlService.createTemplateFromFile(pageName);
        break;
      case 'admin':
        if (!isAdmin(token)) throw new Error("Akses ditolak.");
        template = HtmlService.createTemplateFromFile('admin');
        break;
      default:
        return HtmlService.createHtmlOutputFromFile('index')
          .setTitle('Login & Registrasi')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    template.nip = nip;
    template.token = token;
    template.scriptUrl = ScriptApp.getService().getUrl();

    return template.evaluate().getContent();
  } catch (err) {
    Logger.log(err.stack);
    return `<h2>Terjadi Kesalahan</h2><p>${err.message}</p>`;
  }
}

function getScript(){
  return ScriptApp.getService().getUrl();
}

// =================================================================
// FUNGSI OTENTIKASI & SESI
// =================================================================

function getNipFromToken(token) {
  if (!token) return null;
  return CacheService.getScriptCache().get(token);
}

function isAdmin(token) {
  const nip = getNipFromToken(token);
  return nip === CONFIG.ADMIN_NIP;
}

function loginUser(credentials) {
  const { nip, password } = credentials;
  if (!nip || !password) return { success: false, message: "NIP dan Password wajib diisi." };

  try {
    // Kirim request ke backend database
    const response = makeDatabaseRequest('/login', 'POST', { nip, password });
    
    if (response.success && response.token) {
      // Simpan token di cache Google Apps Script
      CacheService.getScriptCache().put(response.token, nip, 1800); // Sesi 30 menit
      return { 
        success: true, 
        isAdmin: (nip === CONFIG.ADMIN_NIP), 
        token: response.token 
      };
    } else {
      return { success: false, message: response.message || "Login gagal." };
    }
  } catch (err) {
    Logger.log(err.stack);
    return { success: false, message: `Terjadi kesalahan pada server: ${err.message}` };
  }
}

function getUserInfoByToken(token) {
  const nip = getNipFromToken(token);
  
  if (nip) {
    return { nip: nip };
  }
  
  return null;
}

function getActiveSession(token) {
  var cache = CacheService.getUserCache();
  var sessionDataString = cache.get(token);
  if (sessionDataString) {
    return JSON.parse(sessionDataString);
  }
  return null;
}

function logoutUser(token) {
  if (token) {
    CacheService.getScriptCache().remove(token);
  }
  return { success: true };
}

// =================================================================
// FUNGSI UNTUK PENGGUNA (USER-FACING)
// =================================================================

function getSisaJatah(token) {
  const nip = getNipFromToken(token);
  if (!nip) return { liburTersisa: 0, cutiTersisa: 0, cutiLainTersisa: 0 };

  try {
    // Ambil data dari database
    const response = makeDatabaseRequest('/sisa-jatah', 'POST', { token });
    
    if (response.success) {
      return response.jatah || { liburTersisa: 0, cutiTersisa: 0, cutiLainTersisa: 0 };
    } else {
      Logger.log("Error di getSisaJatah:", response.message);
      return { liburTersisa: 0, cutiTersisa: 0, cutiLainTersisa: 0 };
    }
  } catch (err) {
    Logger.log("Error di getSisaJatah:", err.stack);
    return { liburTersisa: 0, cutiTersisa: 0, cutiLainTersisa: 0 };
  }
}

function simpanSatuTanggal(token, data) {
  try {
    const nip = getNipFromToken(token);
    if (!nip) throw new Error("Sesi tidak valid.");

    const { jenis, tanggal } = data;
    if (!jenis || !tanggal || typeof tanggal !== 'string') {
      throw new Error("Data pengajuan tidak lengkap atau format salah.");
    }

    // Kirim ke database
    const response = makeDatabaseRequest('/simpan-satu-tanggal', 'POST', { 
      token, 
      jenis, 
      tanggal 
    });
    
    return response;
  } catch (err) {
    Logger.log(err.stack);
    return {
      success: false,
      message: err.message
    };
  }
}

function getPegawai() {
  try {
    // Ambil data dari database
    const response = makeDatabaseRequest('/pegawai', 'GET');
    
    if (response.success) {
      return response.pegawai || [];
    } else {
      throw new Error(response.message || "Gagal mengambil data pegawai");
    }
  } catch (err) {
    Logger.log(err.stack);
    return [];
  }
}

function getPengajuan() {
  try {
    // Ambil data dari database
    const response = makeDatabaseRequest('/pengajuan', 'GET');
    
    if (response.success) {
      return response.pengajuan || [];
    } else {
      throw new Error(response.message || "Gagal mengambil data pengajuan");
    }
  } catch (err) {
    Logger.log(err.stack);
    return [];
  }
}

function updateSatuTanggal(token, data) {
  try {
    const nip = getNipFromToken(token);
    if (!nip) {
      return { success: false, message: "⚠️ Sesi tidak valid." };
    }

    const { jenis, tanggalLama, tanggalBaru } = data;
    if (!jenis || !tanggalLama || !tanggalBaru) {
      return { success: false, message: "⚠️ Parameter tidak lengkap." };
    }

    // Kirim ke database
    const response = makeDatabaseRequest('/update-satu-tanggal', 'POST', { 
      token, 
      jenis, 
      tanggalLama, 
      tanggalBaru 
    });
    
    return response;
  } catch (err) {
    Logger.log(err.stack);
    return {
      success: false,
      message: `❌ Gagal menyimpan: ${err.message}`
    };
  }
}

function hapusSatuTanggal(token, data) {
  try {
    const nip = getNipFromToken(token);
    if (!nip) throw new Error("Token tidak valid.");

    const { jenis, tanggal } = data;
    if (!jenis || !tanggal) throw new Error("Data tidak lengkap.");

    // Kirim ke database
    const response = makeDatabaseRequest('/hapus-satu-tanggal', 'POST', { 
      token, 
      jenis, 
      tanggal 
    });
    
    return response;
  } catch (err) {
    Logger.log(err.stack);
    return { success: false, message: err.message };
  }
}

function simpanPengajuan(token, data) {
  try {
    const nip = getNipFromToken(token);
    if (!nip) throw new Error("Sesi tidak valid.");

    const { jenis, tanggal } = data;
    if (!jenis || !Array.isArray(tanggal) || tanggal.length === 0) {
      throw new Error("Data pengajuan tidak lengkap.");
    }

    // Kirim ke database
    const response = makeDatabaseRequest('/simpan-pengajuan', 'POST', { 
      token, 
      jenis, 
      tanggal 
    });
    
    return response;
  } catch (err) {
    Logger.log("Error di simpanPengajuan:", err.stack || err.message);
    return { success: false, message: `Terjadi error: ${err.message}` };
  }
}

function hapusPengajuan(token, jenisPengajuan) {
  try {
    const nip = getNipFromToken(token);
    if (!nip || !jenisPengajuan) return { success: false, message: "Data tidak lengkap" };

    // Kirim ke database
    const response = makeDatabaseRequest('/hapus-pengajuan', 'POST', { 
      token, 
      jenisPengajuan 
    });
    
    return response;
  } catch (err) {
    Logger.log(err.stack);
    return { success: false, message: err.message };
  }
}

function getAllPengajuan() {
  try {
    // Ambil data dari database
    const response = makeDatabaseRequest('/all-pengajuan', 'GET');
    
    if (response.success) {
      return response.pengajuan || [];
    } else {
      throw new Error(response.message || "Gagal mengambil data pengajuan");
    }
  } catch (err) {
    Logger.log(err.stack);
    return [];
  }
}

function getPengajuanUser(token) {
  const nip = getNipFromToken(token);
  if (!nip) throw new Error("Sesi tidak valid.");

  try {
    // Ambil data dari database
    const response = makeDatabaseRequest('/pengajuan-user', 'POST', { token });
    
    if (response.success) {
      return response.pengajuan || { libur: [], cuti: [], cutiLain: [] };
    } else {
      throw new Error(response.message || "Gagal mengambil data pengajuan user");
    }
  } catch (err) {
    Logger.log(err.stack);
    return { libur: [], cuti: [], cutiLain: [] };
  }
}

function getPengajuanSaya(token) {
  try {
    // Ambil data dari database
    const response = makeDatabaseRequest('/pengajuan-saya', 'POST', { token });
    
    if (response.success) {
      return response.pengajuan || [];
    } else {
      throw new Error(response.message || "Gagal mengambil data pengajuan saya");
    }
  } catch (err) {
    Logger.log('ERROR getPengajuanSaya:', err.stack);
    return [];
  }
}

function getPengajuanUntukUpdate(token) {
  try {
    // Ambil data dari database
    const response = makeDatabaseRequest('/pengajuan-untuk-update', 'POST', { token });
    
    if (response.success) {
      return response.pengajuan || { libur: [], cuti: [], cuti_lainnya: [] };
    } else {
      throw new Error(response.message || "Gagal mengambil data pengajuan untuk update");
    }
  } catch (err) {
    Logger.log(err.stack);
    return { libur: [], cuti: [], cuti_lainnya: [] };
  }
}

function getInitial(token) {
  try {
    // Ambil semua data dalam satu request
    const response = makeDatabaseRequest('/initial', 'POST', { token });
    
    if (response.success) {
      return response.data || {
        jatah: { liburTersisa: 0, cutiTersisa: 0, cutiLainTersisa: 0 },
        disableDatesLibur: [],
        tanggalMerah: [],
        pengajuan: { libur: [], cuti: [], cutiLain: [] }
      };
    } else {
      throw new Error(response.message || "Gagal mengambil data awal");
    }
  } catch (e) {
    Logger.log("Error di getInitial: " + e.stack);
    return { success: false, message: e.message };
  }
}

// =================================================================
// FUNGSI EXCEL (TIDAK BERUBAH)
// =================================================================

const TEMPLATE_ID = '1IbcgLQXuogBQrlBpTunu4XEZN7LOua_C';

function generateFilledExcel(tableData) {
  // 1) Grab the template by ID and make a copy so original stays intact
  const templateFile = DriveApp.getFileById(TEMPLATE_ID);
  const copyFile     = templateFile.makeCopy(`Jadwal_Terisi_${Date.now()}.xlsx`);
  const blob         = copyFile.getBlob();

  // 2) Read it in as a SheetJS workbook
  const workbook = XLSX.read(blob.getBytes(), { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const ws        = workbook.Sheets[sheetName];

  // 3) Overwrite starting at row 2 (so header row stays)
  XLSX.utils.sheet_add_aoa(ws, tableData, { origin: 'A1' });

  // 4) Write back out to a new .xlsx blob
  const outputArray = XLSX.write(workbook, { bookType:'xlsx', type:'array' });
  const outBlob     = Utilities.newBlob(
    outputArray, 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Jadwal_Terisi.xlsx'
  );

  // 5) Save to Drive and return its download URL
  const outFile = DriveApp.createFile(outBlob);
  return outFile.getDownloadUrl();
}

function writeScheduleToSheet(data) {
  const ss       = SpreadsheetApp.getActive();
  const template = ss.getSheetByName('TEMPLATE');
  if (!template) {
    return { success: false, message: 'Template sheet not found.' };
  }

  // 1) Delete old output if it exists
  const existing = ss.getSheetByName('JadwalOutput');
  if (existing) ss.deleteSheet(existing);

  // 2) Copy template (this preserves all formatting, formulas, CF, etc)
  const out = template.copyTo(ss)
    .setName('JadwalOutput');

  // 3) Decide where your values start.
  const startRow = 7;
  const startCol = 2;

  // 4) Clear only the *values* in your data block (so formulas in other cells stay)
  const numRows = data.length;
  const numCols = data[0].length;
  out.getRange(startRow, startCol, numRows, numCols)
     .clearContent();

  // 5) Write your schedule *values* into that same range
  out.getRange(startRow, startCol, numRows, numCols)
     .setValues(data);

  return { success: true };
}

function cleanupTemp() {
  // Find your triggers, delete them, and optionally remove the file copy.
  // Left as an exercise.
}