// Impor semua modul yang dibutuhkan di atas
const Request = require('../src/models/requestModel');
const { pool } = require('../src/config/database');
const CONFIG = require('../src/config/constants');
const authService = require('../src/services/userServices');
const formService = require('../src/services/formServices');
require('dotenv').config();

// =================================================================
// SATU TEST SUITE UTAMA UNTUK SEMUA TES INTEGRASI
// =================================================================
describe('Full Integration Tests', () => {

    const testUserNip = 400087;
    const testUserPassword = '123';
    let validToken;

    // Satu beforeAll untuk seluruh file
    beforeAll(async () => {
        // Login sekali di awal untuk mendapatkan token yang akan digunakan di tes lain
        const loginResult = await authService.loginUser(testUserNip, testUserPassword);
        validToken = loginResult.token;
    });

    // Satu afterAll untuk seluruh file, ini akan membereskan masalah!
    afterAll(async () => {
        await pool.end();
    });

    // =================================================================
    // KELOMPOK TES UNTUK REQUEST MODEL
    // =================================================================
    describe('Request Model Operations', () => {
        test('countByUser should return the correct count of requests per type', async () => {
            const nip = 400087;
            const counts = await Request.countByUser(nip);
            expect(counts).toBeInstanceOf(Array);

            function getTotal(jenis) {
                const data = counts.find(c => c.jenis?.trim().toLowerCase() === jenis);
                return data ? Number(data.total) : 0;
            }

            // Asumsi data yang di-load sesuai dengan yang Anda berikan
            expect(getTotal('cuti')).toBe(2);
            expect(getTotal('libur')).toBe(0);
            expect(getTotal('cuti lainnya')).toBe(1);
        });
    });

    // =================================================================
    // KELOMPOK TES UNTUK GET INITIAL DATA SERVICE
    // =================================================================
    describe('Form Service (getInitialData)', () => {
        // Test case #1: Berhasil mendapatkan data dengan token yang valid
        test('should return the complete initial data structure for a valid user token', async () => {
            const result = await formService.getInitialData(validToken);
            
            // Verifikasi Jatah
            expect(result.jatah.liburTersisa).toBe(CONFIG.QUOTA.LIBUR);
            expect(result.jatah.cutiTersisa).toBe(CONFIG.QUOTA.CUTI - 2);
            expect(result.jatah.cutiLainTersisa).toBe(CONFIG.QUOTA.CUTILAIN - 1);

            // Verifikasi Pengajuan
            expect(result.pengajuan.libur).toEqual([]);
            expect(result.pengajuan.cuti).toContain('2025-09-12');
            expect(result.pengajuan.cutiLain).toEqual(['2025-09-10']);

            // Verifikasi Tanggal Merah
            const expectedHolidays = [
              '2025-01-01', '2025-01-27', '2025-01-28', '2025-01-29',
              '2025-03-28', '2025-03-29', '2025-03-31', '2025-04-01',
              '2025-12-25', '2025-12-26'
            ];
            expect(result.tanggalMerah.sort()).toEqual(expectedHolidays.sort());

            // Verifikasi Tanggal yang Dinonaktifkan
            const disabledDates = result.disableDatesLibur;
            expect(disabledDates).toContain('2025-01-01'); // Dari tanggal merah
            expect(disabledDates).toContain('2025-09-12'); // Tanggal yang kuotanya penuh
            expect(disabledDates).toContain('2025-09-11');
        });

        // Test case #2: Gagal karena sesi/token tidak valid
        test('should throw an error for an invalid session or token', async () => {
            const invalidToken = 'ini.token.yang.pasti.tidak.valid';
            await expect(formService.getInitialData(invalidToken)).rejects.toThrow(
              "Sesi tidak valid. Silakan login kembali."
            );
        });
    });
});
