// Muat environment variables terlebih dahulu
require('dotenv').config();

const { pool } = require('./src/config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; // Standar industri, jangan diubah kecuali Anda tahu alasannya

async function migratePasswords() {
    let connection;
    try {
        console.log('Memulai proses migrasi password...');
        
        connection = await pool.getConnection();

        // 1. Ambil semua user yang passwordnya BUKAN hash bcrypt
        //    Hash bcrypt selalu diawali dengan '$2a$', '$2b$', atau '$2y$'.
        const [usersToMigrate] = await connection.query(
            "SELECT nip, password FROM useraccounts WHERE password NOT LIKE '$2b$%' AND password IS NOT NULL AND password != ''"
        );

        if (usersToMigrate.length === 0) {
            console.log('✅ Tidak ada password yang perlu dimigrasi. Semua sudah aman.');
            return;
        }

        console.log(`Menemukan ${usersToMigrate.length} password plain text yang akan di-hash...`);

        // 2. Loop setiap user, hash passwordnya, dan update ke database
        for (const user of usersToMigrate) {
            try {
                const plainTextPassword = user.password;
                
                // Hash password dengan bcrypt
                const hashedPassword = await bcrypt.hash(plainTextPassword, SALT_ROUNDS);

                // Update password di database dengan versi yang sudah di-hash
                await connection.query(
                    "UPDATE useraccounts SET password = ? WHERE nip = ?",
                    [hashedPassword, user.nip]
                );
                console.log(`- Password untuk NIP ${user.nip} berhasil di-hash.`);

            } catch (hashError) {
                console.error(`- Gagal memproses NIP ${user.nip}:`, hashError.message);
            }
        }

        console.log('✅ Migrasi password selesai!');

    } catch (error) {
        console.error('❌ Terjadi error saat migrasi:', error);
    } finally {
        if (connection) connection.release();
        pool.end(); // Tutup koneksi pool setelah selesai
    }
}

// Jalankan fungsi migrasi
migratePasswords();