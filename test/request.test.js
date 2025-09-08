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

    // Hook ini berjalan SEKALI sebelum semua tes dimulai.
    beforeAll(async () => {
        const loginResult = await authService.loginUser(testUserNip, testUserPassword);
        validToken = loginResult.token;
    });

    // Hook ini berjalan SEKALI setelah semua tes selesai.
    afterAll(async () => {
        await pool.end();
    });

    // Hook ini berjalan SETELAH SETIAP TES untuk memastikan isolasi data.
    afterEach(async () => {
        await pool.query("TRUNCATE TABLE request");
    });

    // =================================================================
    // KELOMPOK TES UNTUK REQUEST MODEL
    // =================================================================
    describe('Request Model Operations', () => {
        test('countByUser should return the correct count of requests per type', async () => {
            // Setup: Sisipkan data dengan format yang benar.
            await pool.query("INSERT INTO request (timestamp, nip, jenis_pengajuan, status_pengajuan, tanggal, tanggal_lama) VALUES (NOW(), ?, 'cuti', 'Disetujui', '2025-10-01', NULL)", [testUserNip]);
            await pool.query("INSERT INTO request (timestamp, nip, jenis_pengajuan, status_pengajuan, tanggal, tanggal_lama) VALUES (NOW(), ?, 'cuti', 'Disetujui', '2025-10-02', NULL)", [testUserNip]);
            await pool.query("INSERT INTO request (timestamp, nip, jenis_pengajuan, status_pengajuan, tanggal, tanggal_lama) VALUES (NOW(), ?, 'cuti lainnya', 'Disetujui', '2025-10-03', NULL)", [testUserNip]);
            
            // Eksekusi
            const counts = await Request.countByUser(testUserNip);
            
            // Verifikasi
            function getTotal(jenis) {
                const data = counts.find(c => c.jenis?.trim().toLowerCase() === jenis);
                return data ? Number(data.total) : 0;
            }
            expect(getTotal('cuti')).toBe(2);
            expect(getTotal('libur')).toBe(0);
            expect(getTotal('cuti lainnya')).toBe(1);
        });
    });

    // =================================================================
    // KELOMPOK TES UNTUK GET INITIAL DATA SERVICE
    // =================================================================
    describe('Form Service (getInitialData)', () => {
        test('should return the correct initial data structure', async () => {
            // Setup: Sisipkan data yang relevan untuk tes ini.
            await pool.query("INSERT INTO request (timestamp, nip, jenis_pengajuan, status_pengajuan, tanggal, tanggal_lama) VALUES (NOW(), ?, 'cuti', 'Disetujui', '2025-09-12', NULL)", [testUserNip]);
            
            // Eksekusi
            const result = await formService.getInitialData(validToken);
            
            // Verifikasi
            expect(result.jatah.cutiTersisa).toBe(CONFIG.QUOTA.CUTI - 1);
            expect(result.jatah.liburTersisa).toBe(CONFIG.QUOTA.LIBUR);
            expect(result.pengajuan.cuti).toEqual(['2025-09-12']);
        });
    });

    // =================================================================
    // KELOMPOK TES UNTUK PROCESS PENGAJUAN SERVICE
    // =================================================================
    describe('Form Service (processPengajuan)', () => {
        test('should successfully process valid requests', async () => {
            const formData = {
                jumlahLibur: '1', tanggalLiburContainer_tanggal1: '2025-10-10',
                jumlahCuti: '1', tanggalCutiContainer_tanggal1: '2025-10-11'
                
            };
            const result = await formService.processPengajuan(validToken, formData);
            expect(result.success).toHaveLength(2);
            expect(result.failed).toHaveLength(0);
        });

        test('should fail requests that exceed the individual user quota', async () => {
            // Setup: Penuhi kuota cuti.
            for (let i = 1; i <= CONFIG.QUOTA.CUTI; i++) {
                await pool.query("INSERT INTO request (timestamp, nip, jenis_pengajuan, status_pengajuan, tanggal, tanggal_lama) VALUES (NOW(), ?, 'cuti', 'Pengajuan Pertama', ?, NULL)", [testUserNip, `2025-11-0${i}`]);
            }
            const formData = { jumlahCuti: '1', tanggalCutiContainer_tanggal1: '2025-11-30' };
            const result = await formService.processPengajuan(validToken, formData);
            expect(result.failed).toHaveLength(1);
            expect(result.failed[0].reason).toContain('Melebihi jatah cuti');
        });

        test('should fail a request if the date has already been submitted', async () => {
            await pool.query("INSERT INTO request (timestamp, nip, jenis_pengajuan, status_pengajuan, tanggal, tanggal_lama) VALUES (NOW(), ?, 'libur', 'Pengajuan Pertama', '2025-12-01', NULL)", [testUserNip]);
            const formData = { jumlahCuti: '1', tanggalCutiContainer_tanggal1: '2025-12-01' };
            const result = await formService.processPengajuan(validToken, formData);
            expect(result.failed).toHaveLength(1);
            expect(result.failed[0].reason).toBe('Tanggal yang dimasukkan sudah ada');
        });

        test('should fail a libur request if the global quota is full', async () => {
            
            const otherNips = [400090, 400091, 400092, 400093]; 
            for (const nip of otherNips) {
                await pool.query("INSERT INTO request (timestamp, nip, jenis_pengajuan, status_pengajuan, tanggal, tanggal_lama) VALUES (NOW(), ?, 'libur', 'Pengajuan Pertama', '2025-12-25', NULL)", [nip]);
            }
            
            const formData = { jumlahLibur: '1', tanggalLiburContainer_tanggal1: '2025-12-25' };
            const result = await formService.processPengajuan(validToken, formData);
            //console.log(result.failed);
            expect(result.failed).toHaveLength(1);
            expect(result.failed[0].reason).toContain('Kuota libur penuh');
        });
    });
});

