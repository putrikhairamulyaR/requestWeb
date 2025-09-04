const Request = require('../src/models/requestModel');
const { pool } = require('../src/config/database');  // <-- ambil pool dengan benar
const CONFIG = require('../src/config/constants');

describe('Integration Test for Request Model', () => {
  afterAll(async () => {
    await pool.end(); // sekarang valid
  });

  describe('Read operations', () => {
    test('countByUser should return the correct count of requests per type', async () => {
      const nip = 400087;
      const counts = await Request.countByUser(nip);

      expect(counts).toBeInstanceOf(Array);

     
     function getTotal(jenis) {
     const data = counts.find(c => c.jenis?.trim().toLowerCase() === jenis);
      return data ? Number(data.total) : 0;
    }

     expect(getTotal('cuti')).toBe(0);
     expect(getTotal('libur')).toBe(0);
     expect(getTotal('cuti lainnya')).toBe(1);

    });
  });
});
