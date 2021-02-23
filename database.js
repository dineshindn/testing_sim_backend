const mysql = require('mysql2/promise');
const dbConfig = require('./db.config');

const pool = mysql.createPool(dbConfig);

module.exports = async (sql, args) => {
  const conn = await pool.getConnection(dbConfig);
  try {
    const result = await conn.query(sql, args);
    return result[0];
  } catch (e) {
    throw e;
  } finally {
    await conn.release();
  }
}