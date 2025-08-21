// =================================================================
// KONFIGURASI GLOBAL
// =================================================================
const CONFIG = {
  SHEET_ACCOUNTS: 'UserAccounts',
  SHEET_REQUESTS: 'Requests',
  ADMIN_NIP: '400199',
  QUOTA: {
    LIBUR: 3,
    CUTI: 12,
    HARIAN: 5,
    CUTILAIN:3
  }
};

// =================================================================
// KONTROLER UTAMA (ENTRY POINT WEB APP)
// =================================================================
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('webAppInterface')
    .setTitle('Login & Registrasi')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  // Fungsi ini sengaja dikosongkan karena navigasi ditangani oleh getPageContent
}
function getTanggalMerah() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LiburNasional');
    if (!sheet) {
      throw new Error("Sheet 'LiburNasional' tidak ditemukan.");
    }
    
    // Ambil semua data dari kolom pertama (Kolom A), mulai dari baris kedua
    const range = sheet.getRange("A2:A" + sheet.getLastRow());
    const values = range.getValues();
    const timeZone = Session.getScriptTimeZone();
    const holidays = [];

    for (let i = 0; i < values.length; i++) {
      const cell = values[i][0];
      // Pastikan sel tidak kosong dan merupakan tanggal yang valid
      if (cell instanceof Date && !isNaN(cell)) {
        holidays.push(Utilities.formatDate(cell, timeZone, "yyyy-MM-dd"));
      }
    }
    console.log(holidays);
    return holidays;
  } catch (err) {
    Logger.log(err.stack);
    // Kembalikan array kosong jika terjadi error
    return [];
  }
}
function fetchTglMerahBlnIni(bulan, tahun = new Date().getFullYear()) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LiburNasional');
    if (!sheet) {
      throw new Error("Sheet 'LiburNasional' tidak ditemukan.");
    }
    
    const range = sheet.getRange("A2:A" + sheet.getLastRow());
    const values = range.getValues();
    const timeZone = Session.getScriptTimeZone();
    const holidays = [];

    for (let i = 0; i < values.length; i++) {
      const cell = values[i][0];
      if (cell instanceof Date && !isNaN(cell)) {
        const dateMonth = cell.getMonth() + 1;
        const dateYear = cell.getFullYear();
        
        if (dateMonth === bulan && dateYear === tahun) {
          holidays.push(Utilities.formatDate(cell, timeZone, "yyyy-MM-dd"));
        }
      }
    }

    return holidays;
  } catch (err) {
    Logger.log(err.stack);
    return [];
  }
}
function getTanggalDisableUser(token) {
  const userNip = getNipFromToken(token);
  if (!userNip) return [];

  try {
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEET_REQUESTS);
    if (!sheet) return [];

    const rows = sheet.getDataRange().getValues();
    const dailyCounts = {};
    const myDates     = new Set();
    const cleanUserNip = userNip.toString().trim();

    // 1) Hitung cuti/libur pengguna lain & simpan tanggal milik user sendiri
    rows.slice(1).forEach(r => {
      const [ , rowNip, rowJenis, , rawTanggal ] = r;
      if (!rawTanggal) return;

      const tgl = rawTanggal instanceof Date
        ? Utilities.formatDate(rawTanggal, Session.getScriptTimeZone(), 'yyyy-MM-dd')
        : rawTanggal.toString().trim();

      const cleanRowNip = rowNip.toString().trim();

      if (cleanRowNip === cleanUserNip) {
        myDates.add(tgl);
      } else if (typeof rowJenis === 'string' &&
                 ['libur','cuti'].includes(rowJenis.toLowerCase())) {
        dailyCounts[tgl] = (dailyCounts[tgl] || 0) + 1;
      }
    });

    // 2) Ambil tanggal yang sudah melewati kuota harian
    const quotaDates = Object.entries(dailyCounts)
      .filter(([tgl, cnt]) => {
        const day = new Date(tgl).getDay(); // 0 = Minggu, 6 = Sabtu
        const isWeekend = (day === 0 || day === 6);
        const maxQuota = isWeekend ? 10 : CONFIG.QUOTA.HARIAN;
        return cnt >= maxQuota && !myDates.has(tgl);
      })
      .map(([tgl]) => tgl);


    // 3) Ambil tanggal dari sheet "LiburNasional"
    const liburSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("LiburNasional");
    const liburValues = liburSheet.getRange("A2:A").getValues(); // Ambil semua dari A2 ke bawah
    const liburDates = liburValues
      .flat()
      .filter(tgl => tgl instanceof Date)
      .map(tgl => Utilities.formatDate(tgl, Session.getScriptTimeZone(), 'yyyy-MM-dd'))
      .filter(tgl => !myDates.has(tgl)); // exclude user-owned dates

    // 4) Gabungkan semua tanggal yang perlu di-disable
    const disableDates = new Set([...quotaDates, ...liburDates]);

    return Array.from(disableDates);
  } catch (e) {
    Logger.log('getTanggalDisableUser error ► ' + e);
    return [];
  }
}
/**
 * Mengambil semua tanggal dari sheet 'LiburNasional' dan memformatnya.
 * @returns {string[]} Sebuah array berisi tanggal merah dalam format 'YYYY-MM-DD'.
 * Mengembalikan array kosong jika terjadi error atau sheet tidak ditemukan.
 */
function getTanggalMerah() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("LiburNasional");

    // Jika sheet tidak ditemukan, langsung kembalikan array kosong.
    if (!sheet) {
      Logger.log("Peringatan: Sheet 'LiburNasional' tidak ditemukan.");
      return [];
    }

    const lastRow = sheet.getLastRow();
    // Jika tidak ada data sama sekali (selain header), tidak perlu proses.
    if (lastRow < 2) {
      return [];
    }

    const range = sheet.getRange("A2:A" + lastRow);
    const values = range.getValues();

    // Proses data untuk mendapatkan hasil akhir
    const holidays = values
      .flat() // Ubah array [[tgl1], [tgl2]] menjadi [tgl1, tgl2]
      .filter(cell => cell instanceof Date && !isNaN(cell)) // Ambil hanya baris yang isinya tanggal valid
      .map(tgl => Utilities.formatDate(tgl, Session.getScriptTimeZone(), 'yyyy-MM-dd')); // Format ke 'YYYY-MM-DD'

    return holidays;

  } catch (e) {
    Logger.log("Error di getTanggalMerah: " + e.stack);
    return []; // Selalu kembalikan array kosong jika terjadi error agar tidak merusak aplikasi klien.
  }
}
function normalizeDateString(dateStr) {
  const [y, m, d] = dateStr.split('-').map(part => part.padStart(2, '0'));
  return `${y}-${m}-${d}`;
}


function getPageContent(pageName, token) {
  try {
    const nip = getNipFromToken(token);

    if (!nip && pageName !== 'login') {
      return HtmlService.createHtmlOutputFromFile('webAppInterface').getContent();
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
        return HtmlService.createHtmlOutputFromFile('webAppInterface')
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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_ACCOUNTS);
    if (!sheet) throw new Error(`Sheet '${CONFIG.SHEET_ACCOUNTS}' tidak ditemukan.`);
    
    const data = sheet.getDataRange().getValues();
    const nipTrimmed = nip.toString().trim();
    
    for (let i = 1; i < data.length; i++) {
      // PENTING: Sesuaikan indeks kolom dengan struktur spreadsheet Anda
      const sheetNip = (data[i][0] || "").toString().trim();      // Asumsi NIP di kolom C
      const sheetPassword = (data[i][5] || "").toString().trim(); // Asumsi Password di kolom F

      if (sheetNip === nipTrimmed) {
        if (sheetPassword === password) {
          const token = Utilities.getUuid();
          CacheService.getScriptCache().put(token, nipTrimmed, 1800); // Sesi 30 menit
          return { success: true, isAdmin: (nipTrimmed === CONFIG.ADMIN_NIP), token: token };
        } else {
          return { success: false, message: "Password salah." };
        }
      }
    }
    return { success: false, message: "NIP/NIK tidak terdaftar." };
  } catch (err) {
    Logger.log(err.stack);
    return { success: false, message: `Terjadi kesalahan pada server: ${err.message}` };
  }
}

// --- TAMBAHKAN KODE BARU DI BAGIAN INI ---

/**
 * Mengambil informasi pengguna (NIP) berdasarkan token sesi yang valid.
 * Fungsi ini menggunakan get_NipFromToken yang sudah ada.
 * @param {string} token - Token sesi yang dikirim dari client.
 * @returns {object|null} Objek berisi {nip: 'NIP_PENGGUNA'} atau null jika tidak valid.
 */
function getUserInfoByToken(token) {
  // Panggil fungsi Anda yang sudah ada untuk mendapatkan NIP
  const nip = getNipFromToken(token);
  
  // Jika NIP ditemukan, kirim kembali dalam format objek yang diharapkan oleh client
  if (nip) {
    return { nip: nip };
  }
  
  // Jika token tidak valid atau tidak ada NIP, kembalikan null
  return null;
}

// CATATAN: Anda harus sudah memiliki fungsi seperti ini dari sistem login Anda.
// Ini adalah contoh. Sesuaikan dengan implementasi Anda.
function getActiveSession(token) {
  var cache = CacheService.getUserCache();
  var sessionDataString = cache.get(token);
  if (sessionDataString) {
    return JSON.parse(sessionDataString);
  }
  return null;
}

// --- AKHIR DARI KODE BARU ---

/* function registerUser(userData) {
  const { name, email, nip, gender, lokasi } = userData;
  if (!name || !email || !nip || !gender || !lokasi) return { success: false, message: "Data tidak lengkap." };
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_ACCOUNTS);
    const data = sheet.getDataRange().getValues();

    const nipExists = data.some(row => row[2] === nip);
    if(nipExists) return { success: false, message: "NIP/NIK sudah terdaftar." };

    const emailExists = data.some(row => row[1] === email);
    if(emailExists) return { success: false, message: "Email sudah terdaftar." };

    const defaultPassword = "nip" + nip.slice(-4);
    // PENTING: Sesuaikan urutan kolom ini dengan sheet Anda
    sheet.appendRow([name, email, nip, gender, lokasi, defaultPassword]);
    return { success: true, password: defaultPassword };
  } catch (err) {
    Logger.log(err.stack);
    return { success: false, message: "Terjadi kesalahan pada server." };
  }
}*/

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
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEET_REQUESTS);
    const data = sheet.getDataRange().getValues();

    let totalLibur = 0, totalCuti = 0, totalCutiLain = 0;

    for (let i = 1; i < data.length; i++) {
      const rowNip = (data[i][1] || "").toString().trim();          // kolom B
      const jenis = (data[i][2] || "").toString().toLowerCase();   // kolom C
      if (rowNip === nip) {
        if (jenis === "libur") totalLibur++;
        if (jenis === "cuti") totalCuti++;
        if (jenis === "cuti lainnya") totalCutiLain++;
      }
    }

    return {
      liburTersisa: Math.max(0, CONFIG.QUOTA.LIBUR - totalLibur),
      cutiTersisa: Math.max(0, CONFIG.QUOTA.CUTI - totalCuti),
      cutiLainTersisa: Math.max(0, CONFIG.QUOTA.CUTILAIN - totalCutiLain)
    };
  } catch (err) {
    Logger.log("Error di getSisaJatah:", err.stack);
    return { liburTersisa: 0, cutiTersisa: 0, cutiLainTersisa: 0 };
  }
}

/**
 * Fungsi ini mengembalikan daftar tanggal yang harus dinonaktifkan karena kuota harian telah terpenuhi oleh PENGGUNA LAIN.
 * Pengguna yang sudah mengajukan pada tanggal tersebut tidak akan melihat tanggalnya dinonaktifkan.
 *
 * @param {string} token Token otentikasi pengguna.
 * @returns {Array<string>} Daftar tanggal yang dinonaktifkan dalam format 'yyyy-MM-dd'.
 */


// File: Code.gs

// =================================================================
// GANTI FUNGSI-FUNGSI INI
// =================================================================

/**
 * Menyimpan SATU tanggal pengajuan. Jika tanggal sudah ada, tidak melakukan apa-apa.
 * Jika belum ada, akan ditambahkan.
 * @param {string} token Token sesi pengguna.
 * @param {object} data Objek berisi { jenis: 'Libur'/'Cuti', tanggal: 'YYYY-MM-DD' }.
 * @return {object} Hasil operasi.
 */
function simpanSatuTanggal(token, data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(3000);  // block up to 30 seconds

  try {
    const nip = getNipFromToken(token);
    if (!nip) throw new Error("Sesi tidak valid.");

    const { jenis, tanggal } = data;
    if (!jenis || !tanggal || typeof tanggal !== 'string') {
      throw new Error("Data pengajuan tidak lengkap atau format salah.");
    }

    const sisaJatah = getSisaJatah(token);
    if (jenis.toLowerCase() === 'libur' && sisaJatah.liburTersisa <= 0) {
      throw new Error("sisa libur Anda sudah habis.");
    }
    if (jenis.toLowerCase() === 'cuti' && sisaJatah.cutiTersisa <= 0) {
      throw new Error("sisa cuti tahunan Anda sudah habis.");
    }
    if (jenis.toLowerCase() === 'cuti lainnya' && sisaJatah.cutiLainTersisa <= 0) {
      throw new Error("sisa cuti CAP Anda sudah habis.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_REQUESTS);
    const rows = sheet.getDataRange().getValues();

    const tz = Session.getScriptTimeZone();
    const jumlahPengajuanLiburTanggalIni = rows.filter(row => {
      const [ , , rowJenis, , rawDate ] = row;
      if (String(rowJenis).toLowerCase() !== 'libur') return false;

      let dateStr;
      if (rawDate instanceof Date) {
        dateStr = Utilities.formatDate(rawDate, tz, 'yyyy-MM-dd');
      } else {
        dateStr = String(rawDate).trim();
      }
      return dateStr === tanggal;
    }).length;

    // ❌ Batasi maksimal 5 orang untuk jenis "libur"
    // ✅ Batasi 5 orang di hari kerja, 10 orang di akhir pekan
    if (jenis.toLowerCase() === 'libur') {
      const hari = new Date(tanggal).getDay(); // 0 = Minggu, 6 = Sabtu
      const kuotaMaks = (hari === 0 || hari === 6) ? 10 : 5;

      if (jumlahPengajuanLiburTanggalIni >= kuotaMaks) {
        return {
          success: false,
          message: `❌ Pengajuan libur untuk tanggal ${tanggal} sudah mencapai batas maksimal (${kuotaMaks} orang).`
        };
      }
    }

    // Cek duplikat untuk user ini di tanggal yang sama
    const isDuplicate = rows.some(r => {
      const [ , rowNip, rowJenis, , rawDate ] = r;

      if (String(rowNip) !== nip) return false;
      if (String(rowJenis).toLowerCase() !== jenis.toLowerCase()) return false;

      let dateStr;
      if (rawDate instanceof Date) {
        dateStr = Utilities.formatDate(rawDate, tz, 'yyyy-MM-dd');
      } else {
        dateStr = String(rawDate).trim();
      }

      return dateStr === tanggal;
    });

    if (isDuplicate) {
      return {
        success: true,
        message: `⚠️ Tanggal ${tanggal} sudah pernah diajukan sebelumnya.`
      };
    }

    // Simpan pengajuan
    sheet.appendRow([
      new Date(),
      nip,
      jenis,
      'Pengajuan Pertama',
      tanggal
    ]);

    return {
      success: true,
      message: `✅ Tanggal ${tanggal} berhasil disimpan.`
    };

  } catch (err) {
    Logger.log(err.stack);
    return {
      success: false,
      message: err.message
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil seluruh daftar pegawai dari sheet UserAccounts
 * @return {{NIP: string, Nama: string}[]} Array objek pegawai
 */
function getPegawai() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_ACCOUNTS);
  if (!sheet) throw new Error(`Sheet '${CONFIG.SHEET_ACCOUNTS}' tidak ditemukan.`);
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  // Mulai dari i=1 untuk melewati header
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const nama = (row[1] || '').toString().trim(); // Kolom A
    const nip  = (row[0] || '').toString().trim(); // Kolom C
    if (nip) {
      result.push({ NIP: nip, Nama: nama });
    }
  }
  
  return result;
}

/**
 * Mengambil semua baris pengajuan (satu baris = satu tanggal) dari sheet Requests
 * @return {{nip: string, jenis: string, request: string[], status: string}[]}
 */
function getPengajuan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_REQUESTS);
  if (!sheet) throw new Error(`Sheet '${CONFIG.SHEET_REQUESTS}' tidak ditemukan.`);
  
  const data = sheet.getDataRange().getValues();
  const tz   = Session.getScriptTimeZone();
  const out  = [];
  
  // Lewati header (i=1)
  for (let i = 1; i < data.length; i++) {
    const row       = data[i];
    const nip       = (row[1] || '').toString().trim();   // kolom B
    const jenis     = (row[2] || '').toString().trim();   // kolom C
    const status    = (row[3] || '').toString().trim();   // kolom D
    const tanggalRaw= row[4];                             // kolom E (YYYY-MM-DD)
    
    if (!nip || !tanggalRaw) continue;
    // format ke 'DD-MM-YYYY'
    const tgl = Utilities.formatDate(new Date(tanggalRaw), tz, 'dd-MM-yyyy');
    
    out.push({
      nip:     nip,
      jenis:   jenis,
      request: [ tgl ],
      status:  status
    });
  }
  
  return out;
}

/**
 * Memperbarui satu tanggal dengan mencatat Tanggal Lama, 
 * lalu menghapus baris lama.
 *
 * Sheet 'Requests' kolomnya:
 * A: Timestamp
 * B: NIP/NIK
 * C: JenisPengajuan
 * D: Status
 * E: Tanggal
 * F: Tanggal Lama
 *
 * @param {string} token
 * @param {{ jenis: string, tanggalLama: string, tanggalBaru: string }} data
 * @return {{ success: boolean, message: string }}
 */
function updateSatuTanggal(token, data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(3000); // hindari race condition

  try {
    const nip = getNipFromToken(token);
    if (!nip) {
      return { success: false, message: "⚠️ Sesi tidak valid." };
    }

    const { jenis, tanggalLama, tanggalBaru } = data;
    if (!jenis || !tanggalLama || !tanggalBaru) {
      return { success: false, message: "⚠️ Parameter tidak lengkap." };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_REQUESTS);
    if (!sheet) {
      return { success: false, message: `⚠️ Sheet '${CONFIG.SHEET_REQUESTS}' tidak ditemukan.` };
    }

    const tz = Session.getScriptTimeZone();
    const MaxPerDay = (tglStr) => {
      const day = new Date(`${tglStr}T00:00:00`).getDay(); // 0 = Minggu, 6 = Sabtu
      return (day === 0 || day === 6) ? 10 : CONFIG.QUOTA.HARIAN;
    };

    const rows = sheet.getDataRange().getValues();

    // Hitung total pengajuan di tanggalBaru
    const currentUsage = {};
    rows.slice(1).forEach(row => {
      const rawDate = row[4];
      const rowJenis = String(row[2] || "").trim().toLowerCase();
      if (!rawDate || rowJenis !== 'libur') return;

      const dateStr = rawDate instanceof Date
        ? Utilities.formatDate(rawDate, tz, "yyyy-MM-dd")
        : String(rawDate).trim();

      currentUsage[dateStr] = (currentUsage[dateStr] || 0) + 1;
    });

    const jumlahPengajuanPadaTanggalBaru = currentUsage[tanggalBaru] || 0;

    // TAPI! Jika user ini sendiri sebelumnya sudah ajukan tanggalLama,
    // dan tanggalLama == tanggalBaru, dia tidak menambah kuota baru.
    // Tapi kalau dia pindah tanggal, perlu cek kuota.

    const tanggalBaruDipakaiSendiri = rows.some(row => {
      const rowNip   = String(row[1] || "").trim();
      const rowJenis = String(row[2] || "").trim().toLowerCase();
      const rawDate  = row[4];
      let dateStr = rawDate instanceof Date
        ? Utilities.formatDate(rawDate, tz, "yyyy-MM-dd")
        : String(rawDate).trim();

      return (
        rowNip === nip &&
        rowJenis === jenis.toLowerCase() &&
        dateStr === tanggalBaru
      );
    });

    // Kalau dia belum pakai tanggalBaru, dan slot udah penuh, tolak
    if (!tanggalBaruDipakaiSendiri && jumlahPengajuanPadaTanggalBaru >= MaxPerDay(tanggalBaru)) {
      return {
        success: false,
        message: `❌ Tanggal ${tanggalBaru} sudah mencapai batas kuota harian ($${MaxPerDay(tanggalBaru)}).`
      };
    }
    
    // Temukan baris lama untuk dihapus
    let foundRow = -1;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNip   = String(row[1] || "").trim();
      const rowJenis = String(row[2] || "").trim().toLowerCase();
      let rowTanggal = row[4];
      if (rowTanggal instanceof Date) {
        rowTanggal = Utilities.formatDate(rowTanggal, tz, "yyyy-MM-dd");
      } else {
        rowTanggal = String(rowTanggal).trim();
      }

      if (
        rowNip === nip &&
        rowJenis === jenis.toLowerCase() &&
        rowTanggal === tanggalLama.trim()
      ) {
        foundRow = i + 1; // 1-based index for deleteRow
        break;
      }
    }

    if (foundRow < 0) {
      return {
        success: false,
        message: `❌ Data pengajuan lama '${tanggalLama}' tidak ditemukan.`
      };
    }

    // Lanjut simpan update
    const now = new Date();
    sheet.appendRow([
      now,                 // A: Timestamp
      nip,                 // B: NIP
      jenis,               // C: Jenis
      "Update Pengajuan",  // D: Status
      tanggalBaru.trim(),  // E: Tanggal Baru
      tanggalLama.trim()   // F: Tanggal Lama
    ]);

    sheet.deleteRow(foundRow);

    return {
      success: true,
      message: `✅ Tanggal '${tanggalLama}' berhasil diganti menjadi '${tanggalBaru}'.`
    };

  } catch (err) {
    Logger.log(err.stack);
    return {
      success: false,
      message: `❌ Gagal menyimpan: ${err.message}`
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menghapus SATU tanggal pengajuan.
 * @param {string} token Token sesi pengguna.
 * @param {object} data Objek berisi { jenis: 'Libur'/'Cuti', tanggal: 'YYYY-MM-DD' }.
 */
function hapusSatuTanggal(token, data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(3000);
  
  try {
    const nip = getNipFromToken(token);
    if (!nip) throw new Error("Token tidak valid.");

    const { jenis, tanggal } = data;
    if (!jenis || !tanggal) throw new Error("Data tidak lengkap.");

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_REQUESTS);
    const dataRange = sheet.getDataRange().getValues();

    // Loop dari bawah ke atas untuk cari baris yang cocok
    for (let i = dataRange.length - 1; i >= 1; i--) {
  const row = dataRange[i];
  
  // 1) Normalize everything to string
  const rowNip   = (row[1] || "").toString().trim();
  const rowJenis = (row[2] || "").toString().trim().toLowerCase();
  const rawDate  = row[4];

  // 2) Format the date into 'yyyy-MM-dd'
  const formattedRowTgl = rawDate instanceof Date
    ? Utilities.formatDate(rawDate, Session.getScriptTimeZone(), 'yyyy-MM-dd')
    : rawDate.toString().trim();

  const cleanNIP   = nip.toString().trim();
  const cleanJenis = jenis.toString().trim().toLowerCase();
  const cleanTgl   = tanggal.toString().trim();  // your incoming '2025-07-20'

  // (optional) debugging
  Logger.log(`rowNip='${rowNip}' cleanNIP='${cleanNIP}'`);
  Logger.log(`rowJenis='${rowJenis}' cleanJenis='${cleanJenis}'`);
  Logger.log(`rowTgl='${formattedRowTgl}' cleanTgl='${cleanTgl}'`);

  if (rowNip === cleanNIP
      && rowJenis === cleanJenis
      && formattedRowTgl === cleanTgl) {
    sheet.deleteRow(i + 1);
    return {
      success: true,
      message: `Tanggal ${cleanTgl} berhasil dihapus.`
    };
  }
}

    return { success: false, message: "Tanggal tidak ditemukan untuk dihapus." };

  } catch (err) {
    Logger.log(err.stack);
    return { success: false, message: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menyimpan data pengajuan dengan proteksi race condition yang lebih kuat.
 * Hanya user tercepat yang berhasil jika ada pengajuan serentak pada kuota terakhir.
 */
/**
 * Menyimpan data pengajuan dengan aturan:
 * - Kuota harian 5 orang hanya berlaku untuk jenis 'Libur'.
 * - Jenis 'Cuti' tidak memiliki batasan kuota harian.
 */
// TAMBAHKAN FUNGSI BARU INI DI FILE Code.gs

/**
 * Mengambil semua data yang diperlukan untuk halaman pengajuan dalam satu panggilan.
 * Ini mencegah race condition dan lebih efisien.
 * @param {string} token - Token sesi pengguna.
 * @returns {object} Objek berisi semua data yang diperlukan oleh klien.
 */
    function getInitial(token) {
      try {
        // Panggil semua fungsi yang sudah ada dari dalam sini.
        // Karena dijalankan di server secara berurutan, datanya dijamin sinkron.
        const jatah = getSisaJatah(token);
        const disableDatesLibur = getTanggalDisableUser(token);
        const tanggalMerah = getTanggalMerah();
        const pengajuan = getPengajuanUser(token);

        // Kembalikan semua data dalam satu objek besar.
        return {
          success: true,
          data: {
            jatah: jatah,
            disableDatesLibur: disableDatesLibur,
            tanggalMerah: tanggalMerah,
            pengajuan: pengajuan
          }
        };
      } catch (e) {
        Logger.log("Error di getInitialPageData: " + e.stack);
        // Jika terjadi error, kirim pesan yang jelas.
        return { success: false, message: e.message };
      }
    }
      
function simpanPengajuan(token, data) {
  const lock = LockService.getScriptLock();
  
  try {
  // Tunggu giliran selama maksimal 30 detik (batas maksimal platform).
  // Skrip akan dijeda di baris ini sampai kunci didapat.
  lock.waitLock(30000); 
  
  // --- BAGIAN KRITIS DIMULAI ---
  // Kode penting Anda yang harus dilindungi (misalnya, update Google Sheet) 
  // diletakkan di sini. Karena sudah menunggu, proses ini pasti aman.
  // ...
  // --- BAGIAN KRITIS SELESAI ---

} catch (e) {
  // Blok ini hanya akan berjalan jika setelah 30 detik kunci tetap tidak didapat.
  Logger.log(e.message);
  return { success: false, message: "Sistem sedang mengalami beban sangat tinggi. Silakan coba lagi dalam satu menit." };
}

  try {
    const nip = getNipFromToken(token);
    if (!nip) throw new Error("Sesi tidak valid.");

    const { jenis, tanggal } = data;
    if (!jenis || !Array.isArray(tanggal) || tanggal.length === 0) {
      throw new Error("Data pengajuan tidak lengkap.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_REQUESTS);
    if (!sheet) throw new Error(`Sheet '${CONFIG.SHEET_REQUESTS}' tidak ditemukan.`);

    const rows = sheet.getDataRange().getValues();
    const tz = Session.getScriptTimeZone();

    // Kuota harian (weekend 10, selain itu ikut CONFIG.QUOTA.HARIAN)
    const MaxPerDay = (tglStr) => {
      const day = new Date(`${tglStr}T00:00:00`).getDay();
      return (day === 0 || day === 6) ? 10 : CONFIG.QUOTA.HARIAN;
    };

    // Hitung penggunaan kuota saat ini (berdasarkan TANGGAL saja, sesuai perilaku awal)
    const currentUsage = {};
    rows.slice(1).forEach(row => {
      const rawDate = row[4];
      if (rawDate instanceof Date) {
        const d = Utilities.formatDate(rawDate, tz, 'yyyy-MM-dd');
        currentUsage[d] = (currentUsage[d] || 0) + 1;
      } else if (rawDate) {
        const d = rawDate.toString().trim();
        if (d) currentUsage[d] = (currentUsage[d] || 0) + 1;
      }
    });
    console.log("Current usage per tanggal:", JSON.stringify(currentUsage, null, 2));

    const accepted = [];
    const rejected = [];

    // Hanya 'Libur' yang dibatasi kuota (sesuai kode awalmu)
    const isLiburRequest = jenis.toLowerCase() === 'libur';

    // Pre-filter berdasarkan kuota existing (agar cepat feedback)
    tanggal.forEach(tgl => {
      const cleanTgl = tgl.toString().trim();
      const usage = currentUsage[cleanTgl] || 0;

      if (!isLiburRequest || usage < MaxPerDay(cleanTgl)) {
        accepted.push(cleanTgl);
        // update counter lokal supaya loop ini tidak menembus batas
        currentUsage[cleanTgl] = usage + 1;
      } else {
        rejected.push(cleanTgl);
      }
    });

    // Jika semuanya tertolak saat prefilter libur
    if (accepted.length === 0) {
      return {
        success: false,
        message: `❌ Pengajuan Libur ditolak. Kuota harian penuh untuk tanggal: ${rejected.join(", ")}.`
      };
    }
  

    // ===== Helper: cari baris existing utk (nip, jenisLower, tgl) =====
    function findExistingRowIndex(rowsVals, nipVal, jenisLower, tglStr, tzId) {
      for (let i = 1; i < rowsVals.length; i++) { // skip header
        const row = rowsVals[i];
        const rowNip = (row[1] || "").toString().trim();
        const rowJenisLower = (row[2] || "").toString().toLowerCase();
        const rawDate = row[4];
        const rowTgl = rawDate instanceof Date
          ? Utilities.formatDate(rawDate, tzId, 'yyyy-MM-dd')
          : (rawDate || "").toString().trim();
        if (rowNip === nipVal && rowJenisLower === jenisLower && rowTgl === tglStr) {
          return i; // index relatif ke getValues()
        }
      }
      return -1;
    }

    // ===== Simpan data (status per tanggal) =====
    const jenisLower = jenis.toLowerCase();
    const timestamp = new Date();
    const plannedCounts = {}; // untuk menghindari race antar insert di batch yang sama
    const updatedDates = [];
    const insertedDates = [];

    for (const tgl of accepted) {
      const formattedTgl = tgl.trim();

      // snapshot saat ini
      const currentRows = sheet.getDataRange().getValues();
      const existingIdx = findExistingRowIndex(currentRows, nip, jenisLower, formattedTgl, tz);

      if (existingIdx !== -1) {
        // === UPDATE: timpa baris lama (kuota diabaikan untuk update)
        const dateObj = new Date(`${formattedTgl}T00:00:00`);
        sheet.getRange(existingIdx + 1, 1, 1, 5)
             .setValues([[timestamp, nip, jenis, "Update Pengajuan", dateObj]]);
        updatedDates.push(formattedTgl);
        continue;
      }

      // === INSERT BARU: cek kuota HANYA jika jenis = Libur ===
      let canInsert = true;
      if (jenisLower === 'libur') {
        // hitung total entri pada tanggal tsb (semua jenis, mengikuti perilaku awal pre-filter)
        let countOnDate = 0;
        for (let i = 1; i < currentRows.length; i++) {
          const rawDate = currentRows[i][4];
          const rowTgl = rawDate instanceof Date
            ? Utilities.formatDate(rawDate, tz, 'yyyy-MM-dd')
            : (rawDate || "").toString().trim();
          if (rowTgl === formattedTgl) countOnDate++;
        }
        const planned = plannedCounts[formattedTgl] || 0;
        canInsert = (countOnDate + planned) < MaxPerDay(formattedTgl);
      }

      if (canInsert) {
        const dateObj = new Date(`${formattedTgl}T00:00:00`);
        sheet.appendRow([timestamp, nip, jenis, "Pengajuan Pertama", dateObj]);
        plannedCounts[formattedTgl] = (plannedCounts[formattedTgl] || 0) + 1;
        insertedDates.push(formattedTgl);
      } else {
        // penuh saat eksekusi (race condition)
        rejected.push(formattedTgl);
      }
    }

    SpreadsheetApp.flush();

    // ===== Pesan hasil =====
    let msg = "";
    if (insertedDates.length) msg += `✅ Pengajuan pertama tersimpan untuk: ${insertedDates.join(", ")}.\n`;
    if (updatedDates.length)  msg += `✏️ Update pengajuan untuk: ${updatedDates.join(", ")}.\n`;
    if (rejected.length)      msg += `⚠️ Ditolak (kuota penuh): ${rejected.join(", ")}.`;

    return {
      success: (insertedDates.length + updatedDates.length) > 0,
      message: msg.trim() || "Tidak ada perubahan."
    };

  } catch (err) {
    Logger.log("Error di simpanPengajuan:", err.stack || err.message);
    return { success: false, message: `Terjadi error: ${err.message}` };
  } finally {
    lock.releaseLock();
  }
}

// Pastikan fungsi hapusPengajuan ini juga ada di Code.gs
function hapusPengajuan(token, jenisPengajuan) {
  const nip = getNipFromToken(token);
  if (!nip || !jenisPengajuan) return;
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_REQUESTS);
  const data = sheet.getDataRange().getValues();
  const rowsToDelete = [];

  for (let i = data.length - 1; i >= 1; i--) {
    const rowNip = (data[i][1] || "").toString().trim();
    const rowJenis = (data[i][2] || "").toString().toLowerCase();
    if (rowNip === nip && rowJenis === jenisPengajuan.toLowerCase()) {
      rowsToDelete.push(i + 1);
    }
  }
  rowsToDelete.forEach(rowNum => sheet.deleteRow(rowNum));
}
/**
 * Mengambil SEMUA data pengajuan dari sheet 'Requests'.
 * Fungsi ini sebaiknya hanya bisa diakses oleh admin.
 * @param {string} token Token sesi pengguna, untuk verifikasi admin.
 * @return {object[]} Array berisi semua data pengajuan yang sudah diformat.
 */
function getAllPengajuan() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const requestsSheet = ss.getSheetByName(CONFIG.SHEET_REQUESTS);
    const accountsSheet = ss.getSheetByName(CONFIG.SHEET_ACCOUNTS);

    // 2. Buat Peta (Map) NIP ke Nama untuk efisiensi
    const accountsData = accountsSheet.getDataRange().getValues();
    const nipToNama = {};
    for (let i = 1; i < accountsData.length; i++) {
      const nip = (accountsData[i][2] || "").toString().trim(); // Asumsi NIP di kolom C
      const nama = (accountsData[i][0] || "").toString().trim(); // Asumsi Nama di kolom A
      if (nip) {
        nipToNama[nip] = nama;
      }
    }

    // 3. Proses data pengajuan
    const requestsData = requestsSheet.getDataRange().getValues();
    const allRequests = [];

    // Loop mulai dari baris kedua untuk melewati header
    for (let i = 1; i < requestsData.length; i++) {
      const row = requestsData[i];
      
      // Asumsi urutan kolom di sheet 'Requests'
      const nip = (row[1] || "").toString().trim();      // Kolom B
      const jenis = (row[2] || "").toString();           // Kolom C
      const status = (row[3] || "Menunggu").toString();   // Kolom D
      const rawTanggal = row[5] || '[]';                 // Kolom F

      let tanggalArr = [];
      try {
        if (typeof rawTanggal === 'string' && rawTanggal.startsWith('[')) {
          tanggalArr = JSON.parse(rawTanggal);
        }
      } catch (e) { /* Abaikan jika parsing gagal */ }

      // "Flatten" data: buat satu entri untuk setiap tanggal dalam array
      if (Array.isArray(tanggalArr)) {
        tanggalArr.forEach(tgl => {
          if (tgl) {
            allRequests.push({
              nip: nip,
              nama: nipToNama[nip] || 'Tidak Ditemukan', // Ambil nama dari peta
              request: `${jenis}: ${Utilities.formatDate(new Date(tgl), 'Asia/Jakarta', 'dd-MM-yyyy')}`,
              status: status,
              _tanggal: new Date(tgl) // Properti sementara untuk sorting
            });
          }
        });
      }
    }

    // 4. Urutkan data dari yang paling baru
    allRequests.sort((a, b) => b._tanggal - a._tanggal);

    // 5. Hapus properti _tanggal sebelum mengirim ke frontend
    return allRequests.map(({ _tanggal, ...rest }) => rest);

  } catch (err) {
    Logger.log(err.stack);
    return []; // Kembalikan array kosong jika terjadi error
  }
}

/**
 * @return {Object} user’s own submitted dates, e.g.
 *                  { libur: ["2025-07-04","2025-07-06"], cuti: ["2025-07-15"] }
 */

function getPengajuanUser(token) {
  const nip = getNipFromToken(token);
  if (!nip) throw new Error("Sesi tidak valid.");

  const sheet = SpreadsheetApp.getActiveSpreadsheet()
                             .getSheetByName(CONFIG.SHEET_REQUESTS);
  const data  = sheet.getDataRange().getValues();
  
  // ✅ 1. Siapkan wadah untuk semua jenis pengajuan
  const libur = [], cuti = [], cutiLain = [];

  // Asumsi kolom B=NIP, C=Jenis, E=Tanggal
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1].toString().trim() !== nip) continue; // Pastikan NIP cocok

    const jenis = (row[2] || "").toString().toLowerCase(); // Ambil jenis pengajuan
    const raw   = row[4]; // Ambil tanggal mentah
    
    if (!raw) continue; // Lewati jika tidak ada tanggal

    let tgl;
    if (raw instanceof Date) {
      tgl = Utilities.formatDate(raw, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else {
      tgl = raw.toString().trim();
    }
    
    // ✅ 2. Tambahkan kondisi untuk mengenali 'cuti lainnya'
    if (jenis === 'libur') {
      libur.push(tgl);
    } else if (jenis === 'cuti') {
      cuti.push(tgl);
    } else if (jenis === 'cuti lainnya') { // INI BAGIAN PENTINGNYA
      cutiLain.push(tgl);
    }
  }
  
  // ✅ 3. Kirim semua data yang sudah dikumpulkan
  return { libur, cuti, cutiLain };
}

function getPengajuanSaya(token) {
  const nip = getNipFromToken(token);
  if (!nip) return [];

  try {
    const ss            = SpreadsheetApp.getActiveSpreadsheet();
    const reqSheet      = ss.getSheetByName(CONFIG.SHEET_REQUESTS);
    const accSheet      = ss.getSheetByName(CONFIG.SHEET_ACCOUNTS);
    const result        = [];

    // 1) Bangun peta NIP→Nama
    const accounts = accSheet.getDataRange().getValues();
    const nipToNama = {};
    accounts.slice(1).forEach(r => {
      const nama   = (r[0] || '').toString().trim();  // A
      const userNip= (r[1] || '').toString().trim();  // B
      if (userNip) nipToNama[userNip] = nama;
    });

    // 2) Baca semua baris di requests
    const rows = reqSheet.getDataRange().getValues();
    rows.slice(1).forEach(r => {
      const rowNip    = (r[1] || '').toString().trim();  // B
      if (rowNip !== nip) return;

      const tsRaw     = r[0];                           // A: Timestamp
      const jenis     = (r[2] || '').toString().trim();  // C
      const status    = (r[3] || '').toString().trim();  // D
      const cellTanggal = r[4];                         // E

      // 3) Validasi cellTanggal
      
      // 4) Format untuk display
      const tanggalFmt = Utilities.formatDate(
        new Date(tanggalStr),
        Session.getScriptTimeZone(),
        'yyyy=MM-dd'
      );

      // 5) Kumpulkan
      result.push({
        nip:     rowNip,
        nama:    nipToNama[rowNip] || '–',
        request: `${jenis}: ${tanggalFmt}`,
        status:  status,
        _ts:     tsRaw instanceof Date ? tsRaw.getTime() : new Date(tsRaw).getTime()
      });
    });

    // 6) Sort descending by timestamp
    result.sort((a,b) => b._ts - a._ts);

    // 7) Hilangkan field internal dan return
    return result.map(({ _ts, ...rest }) => rest);

  } catch (e) {
    Logger.log('ERROR getPengajuanSaya:', e.stack);
    return [];
  }
}

// File: Code.gs

function getPengajuanUntukUpdate(token) {
  const nip = getNipFromToken(token);
  if (!nip) return { libur: [], cuti: [], cuti_lainnya: [] };

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEET_REQUESTS);
  if (!sheet) return { libur: [], cuti: [], cuti_lainnya: [] };

  const rows = sheet.getDataRange().getValues().slice(1);

  const allLibur = [];
  const allCuti = [];
  const allCutiLainnya = [];

  rows.forEach(r => {
    const rowNip  = (r[1] || '').toString().trim();
    const jenis   = (r[2] || '').toString().toLowerCase();
    const rawDate = r[4];

    if (rowNip !== nip || !rawDate) return;

    const d = new Date(rawDate);
    if (isNaN(d)) return;
    const fmt = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    if (jenis === 'libur') allLibur.push(fmt);
    else if (jenis === 'cuti') allCuti.push(fmt);
    else if (jenis === 'cuti lainnya') allCutiLainnya.push(fmt);
  });

  return {
    libur: [...new Set(allLibur)],
    cuti: [...new Set(allCuti)],
    cuti_lainnya: [...new Set(allCutiLainnya)]
  };
}

const TEMPLATE_ID = '1IbcgLQXuogBQrlBpTunu4XEZN7LOua_C';

/**
 * @param {Array<Array<string>>} tableData 
 *   an array of rows; each row is an array of cell‑strings
 */
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
  //    You can tweak the origin if your template expects data somewhere else.
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
  //    For example: headers occupy rows 1–6, data starts row 7 and col D onward:
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

// (Optional) A cleanup function if you want to delete old copies
function cleanupTemp() {
  // Find your triggers, delete them, and optionally remove the file copy.
  // Left as an exercise.
}






