const Request = require('../models/requestModel');
const authService = require('./userServices');
const CONFIG = require('../config/constants');
const { pool } = require('../config/database');


/**
 * Mengambil semua data yang dibutuhkan untuk me-render halaman form.
 */
async function getInitialData(token) {
  const user = await authService.verifyUserToken(token);
  if (!user) {
    throw new Error("Sesi tidak valid. Silakan login kembali.");
  }

  const [
    jatahCounts,
    userRequests,
    allHolidays,
    disabledLiburDates
  ] = await Promise.all([
    Request.countByUser(user.nip),
    Request.findByUser(user.nip),
    Request.getAllHolidays(),
    Request.getDisabledLiburDates()
  ]);

  let totalLibur = 0, totalCuti = 0, totalCutiLain = 0;
  jatahCounts.forEach(row => {
    if (row.jenis === 'libur') totalLibur = row.total;
    if (row.jenis === 'cuti') totalCuti = row.total;
    if (row.jenis === 'cuti lainnya') totalCutiLain = row.total;
  });

  const jatah = {
    liburTersisa: Math.max(0, CONFIG.QUOTA.LIBUR - totalLibur),
    cutiTersisa: Math.max(0, CONFIG.QUOTA.CUTI - totalCuti),
    cutiLainTersisa: Math.max(0, CONFIG.QUOTA.CUTILAIN - totalCutiLain)
  };

  const pengajuan = { libur: [], cuti: [], cutiLain: [] };
  userRequests.forEach(req => {
    const jenis = req.jenis_pengajuan.toLowerCase().trim();
    if (jenis === 'libur') pengajuan.libur.push(req.tanggal_str);
    if (jenis === 'cuti') pengajuan.cuti.push(req.tanggal_str);
    if (jenis === 'cuti lainnya') pengajuan.cutiLain.push(req.tanggal_str);
  });

  const disableDatesLibur = [...new Set([...disabledLiburDates, ...allHolidays])];

  return { jatah, pengajuan, tanggalMerah: allHolidays, disableDatesLibur };
}

/**
 * Memproses dan menyimpan data dari form submission.
 */


async function processPengajuan(token, formData) {
  const user = await authService.verifyUserToken(token);
  if (!user) throw new Error("Sesi tidak valid.");

  const connection = await pool.getConnection();
  const results = {
    success: [],
    failed: []
  };

  try {
    function extractDates(prefix, jumlah) {
      const dates = [];
      const count = parseInt(jumlah || "0", 10);
      for (let i = 1; i <= count; i++) {
        const key = `${prefix}_tanggal${i}`;
        if (formData[key]) {
          dates.push(formData[key]);
        }
      }
      return dates;
    }

    const allDates = {
      libur: extractDates("tanggalLiburContainer", formData.jumlahLibur),
      cuti: extractDates("tanggalCutiContainer", formData.jumlahCuti),
      "cuti lainnya": extractDates("tanggalCutiLainContainer", formData.jumlahCutiLain)
    };

    for (const jenis in allDates) {
      for (const tanggal of allDates[jenis]) {
        try {
          // 🔹 Mapping jenis -> key quota
          let quotaKey;
          if (jenis === "libur") quotaKey = "LIBUR";
          else if (jenis === "cuti") quotaKey = "CUTI";
          else quotaKey = "CUTI_LAINNYA";

          // 🔹 Cek quota individu
          const [countRows] = await connection.query(
            "SELECT COUNT(*) as jumlah FROM request WHERE nip = ? AND jenis_pengajuan = ?",
            [user.nip, jenis]
          );
          const currentCount = countRows[0].jumlah;
          const maxQuota = CONFIG.QUOTA[quotaKey];

          if (currentCount >= maxQuota) {
            results.failed.push({ jenis, tanggal, reason: `Melebihi jatah ${jenis} (maks ${maxQuota})` });
            continue;
          }

          // 🔹 Cek kuota global (misalnya libur max 5 orang per tanggal)
          if (jenis === "libur") {
            const [rows] = await connection.query(
              "SELECT COUNT(*) as jumlah FROM request WHERE jenis_pengajuan = ? AND tanggal = ?",
              [jenis, tanggal]
            );
            if (rows[0].jumlah >= 5) {
              results.failed.push({ jenis, tanggal, reason: "Kuota libur penuh (maks 5 orang)" });
              continue;
            }
          }

          // 🔹 Insert request
          await Request.create(connection, user.nip, jenis, tanggal);
          results.success.push({ jenis, tanggal });
        } catch (err) {
          results.failed.push({ jenis, tanggal, reason: err.message });
        }
      }
    }
  } finally {
    connection.release();
  }

  return results;
}

async function updateTanggal(token, jenis, tanggalLama, tanggalBaru) {
  // 1. Verifikasi sesi pengguna
  const user = await authService.verifyUserToken(token);
  if (!user) {
    throw new Error("Sesi tidak valid atau telah berakhir.");
  }

  // 2. Validasi input dasar
  if (!jenis || !tanggalLama || !tanggalBaru) {
    throw new Error("Data tidak lengkap untuk melakukan update.");
  }
  if (tanggalLama === tanggalBaru) {
    throw new Error("Tidak ada perubahan pada tanggal.");
  }

  // 3. Validasi aturan bisnis
  // Cek apakah tanggal baru sudah pernah diajukan sebelumnya
  const existingRequests = await Request.findByUser(user.nip);
  const allExistingDates = [
    ...(existingRequests.libur || []),
    ...(existingRequests.cuti || []),
    ...(existingRequests.cuti_lainnya || [])
  ];
  if (allExistingDates.includes(tanggalBaru)) {
    throw new Error(`Tanggal ${tanggalBaru} sudah pernah Anda ajukan.`);
  }

  // Cek kuota harian jika jenisnya 'libur'
  if (jenis.toLowerCase() === 'libur') {
    const dailyCount = await Request.countLiburByDate(tanggalBaru);
    if (dailyCount >= CONFIG.QUOTA.HARIAN) {
      throw new Error(`Kuota untuk tanggal ${tanggalBaru} sudah penuh.`);
    }
  }

  // 4. Panggil model untuk melakukan update di database
  const result = await Request.update(user.nip, jenis, tanggalLama, tanggalBaru);

  // 5. Periksa apakah ada baris yang benar-benar diupdate
  if (result.affectedRows === 0) {
    throw new Error("Data pengajuan yang akan diupdate tidak ditemukan di database.");
  }

  return { success: true, message: `Pengajuan berhasil diupdate ke tanggal ${tanggalBaru}` };
}

/**
 * Logika bisnis untuk menghapus satu tanggal pengajuan.
 */
async function hapusTanggal(token, jenis, tanggal) {
  const user = await authService.verifyUserToken(token);
  if (!user) {
    throw new Error("Sesi tidak valid.");
  }

  if (!jenis || !tanggal) {
    throw new Error("Data tidak lengkap untuk menghapus.");
  }

  const result = await Request.delete(user.nip, jenis, tanggal);

  if (result.affectedRows === 0) {
    throw new Error("Data pengajuan yang akan dihapus tidak ditemukan.");
  }

  return { success: true, message: `Pengajuan tanggal ${tanggal} berhasil dihapus.` };
}


module.exports = {
  getInitialData,
  processPengajuan,
  updateTanggal,
  hapusTanggal
  
};