const Request = require('../src/models/requestModel');
const { pool } = require('../setupDatabase');  // <-- ambil pool dengan benar
const CONFIG = require('../src/config/constants');
const authService= require('../src/services/userServices')
const formService= require('../src/services/formServices')
require('dotenv').config();
describe('Integration Test for Request Model', () => {
 

  describe('Read operations', () => {
    test('countByUser should return the correct count of requests per type', async () => {
      const nip = 400087;
      const counts = await Request.countByUser(nip);

      expect(counts).toBeInstanceOf(Array);

     
     function getTotal(jenis) {
     const data = counts.find(c => c.jenis?.trim().toLowerCase() === jenis);
      return data ? Number(data.total) : 0;
    }

     expect(getTotal('cuti')).toBe(2);
     expect(getTotal('libur')).toBe(1);
     expect(getTotal('cuti lainnya')).toBe(1);

    });
  });
});


describe('Full Integration Test for getInitialData Service', () => {

  const testUserNip = 400087;
  const testUserPassword = '123'; // Menggunakan password plain text dari DB
  let validToken;

  // Menyiapkan database sebelum semua tes berjalan
  beforeAll(async () => {
    // Login menggunakan fungsi asli untuk mendapatkan token yang valid
    // Tes ini sekarang berasumsi database sudah di-seed dengan data yang benar
    const loginResult = await authService.loginUser(testUserNip, testUserPassword);
    validToken = loginResult.token;
  });

  // Menutup koneksi pool setelah semua tes selesai
  afterAll(async () => {
    // Tidak ada lagi pembersihan data karena data dikelola secara eksternal
    await pool.end();
  });

  // Test case #1: Berhasil mendapatkan data dengan token yang valid
  test('should return the complete initial data structure for a valid user token', async () => {
    // 1. Eksekusi Fungsi yang Dites menggunakan token asli
    const result = await formService.getInitialData(validToken);
    
    // 2. Verifikasi (Assertions)
    
    // Verifikasi Jatah (berdasarkan data yang sudah di-load ke DB)
    // User 400087 memiliki: 1 Cuti Lainnya, 1 Libur, 2 Cuti
    expect(result.jatah.liburTersisa).toBe(CONFIG.QUOTA.LIBUR - 1);
    expect(result.jatah.cutiTersisa).toBe(CONFIG.QUOTA.CUTI - 2);
    expect(result.jatah.cutiLainTersisa).toBe(CONFIG.QUOTA.CUTILAIN - 1);

    // Verifikasi Pengajuan (pastikan data duplikat sudah hilang)
    expect(result.pengajuan.libur).toEqual(['2025-09-11']);
    expect(result.pengajuan.cuti).toEqual(['2025-11-11']);
    expect(result.pengajuan.cutiLain).toEqual(['2025-09-10']);

    // Verifikasi Tanggal Merah
    const expectedHolidays = [
      '2025-01-01', '2025-01-27', '2025-01-28', '2025-01-29',
      '2025-03-28', '2025-03-29', '2025-03-31', '2025-04-01',
      '2025-12-25', '2025-12-26'
    ];
    expect(result.tanggalMerah).toHaveLength(expectedHolidays.length);
    // Sortir kedua array untuk memastikan isinya identik, terlepas dari urutan dari DB
    expect(result.tanggalMerah.sort()).toEqual(expectedHolidays.sort());

    // Verifikasi Tanggal yang Dinonaktifkan
    // Harus berisi semua tanggal merah DAN tanggal '2025-09-11' yang kuotanya penuh
    const disabledDates = result.disableDatesLibur;
    expect(disabledDates).toContain('2025-01-01'); // Contoh dari tanggal merah
    expect(disabledDates).toContain('2025-09-11'); // Tanggal yang kuotanya penuh
  });

  // Test case #2: Gagal karena sesi/token tidak valid
  test('should throw an error for an invalid session or token', async () => {
    const invalidToken = 'ini.token.yang.pasti.tidak.valid';
    await expect(formService.getInitialData(invalidToken)).rejects.toThrow(
      "Sesi tidak valid. Silakan login kembali."
    );
  });
});

