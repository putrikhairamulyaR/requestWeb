// =================================================================
// TEST DATABASE CONNECTION
// =================================================================

const DatabaseService = require('./database_service');

async function testDatabase() {
  console.log('🧪 Testing Database Connection...\n');
  
  const dbService = new DatabaseService();
  
  try {
    // Test 1: Login
    console.log('1️⃣ Testing Login...');
    const loginResult = await dbService.loginUser('400087', '123');
    console.log('Login Result:', loginResult);
    
    if (loginResult.success) {
      const token = loginResult.token;
      console.log('✅ Login berhasil, token:', token);
      
      // Test 2: Get Sisa Jatah
      console.log('\n2️⃣ Testing Get Sisa Jatah...');
      const jatahResult = await dbService.getSisaJatah(token);
      console.log('Sisa Jatah:', jatahResult);
      
      // Test 3: Get Pengajuan User
      console.log('\n3️⃣ Testing Get Pengajuan User...');
      const pengajuanResult = await dbService.getPengajuanUser(token);
      console.log('Pengajuan User:', pengajuanResult);
      
      // Test 4: Get Pegawai
      console.log('\n4️⃣ Testing Get Pegawai...');
      const pegawaiResult = await dbService.getPegawai();
      console.log('Pegawai (first 3):', pegawaiResult.slice(0, 3));
      
      // Test 5: Get Pengajuan
      console.log('\n5️⃣ Testing Get Pengajuan...');
      const allPengajuanResult = await dbService.getPengajuan();
      console.log('All Pengajuan (first 3):', allPengajuanResult.slice(0, 3));
      
      console.log('\n🎉 Semua test berhasil!');
    } else {
      console.log('❌ Login gagal:', loginResult.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await dbService.db.close();
  }
}

// Jalankan test
testDatabase(); 
