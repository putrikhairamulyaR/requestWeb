// Muat environment variables terlebih dahulu
require('dotenv').config();

const { pool } = require('./setupDatabase');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function migratePasswords() {
    console.log('Memulai proses migrasi password...');
   
    try {
        const [usersToMigrate] = await pool.query(
            "SELECT nip, password FROM useraccounts WHERE password NOT LIKE '$2b$%' AND password IS NOT NULL AND password != ''"
        );

        if (usersToMigrate.length === 0) {
            console.log('✅ Tidak ada password yang perlu dimigrasi. Semua sudah aman.');
            return;
        }

        console.log(`Menemukan ${usersToMigrate.length} password plain text yang akan di-hash...`);

        for (const user of usersToMigrate) {
            try {
                const plainTextPassword = user.password;
                const hashedPassword = await bcrypt.hash(plainTextPassword, SALT_ROUNDS);

                await pool.query(
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
    }
}

// Jalankan migrasi lalu tutup pool
migratePasswords()

