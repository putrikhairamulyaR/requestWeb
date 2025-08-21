// =================================================================
// KONEKSI DATABASE MYSQL
// =================================================================

const mysql = require('mysql2/promise');
const dbConfig = require('./database_config');

class DatabaseConnection {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = mysql.createPool(dbConfig);
      
      // Test koneksi
      const connection = await this.pool.getConnection();
      console.log('✅ Berhasil terhubung ke MySQL database');
      connection.release();
      
      return this.pool;
    } catch (error) {
      console.error('❌ Error koneksi database:', error.message);
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
      if (!this.pool) {
        await this.connect();
      }
      
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('❌ Error query database:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Koneksi database ditutup');
    }
  }
}

module.exports = DatabaseConnection; 
