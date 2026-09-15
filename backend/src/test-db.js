import { initDatabase } from './config/db.js';

async function test() {
  console.log('🚀 Bắt đầu kiểm tra kết nối MySQL...');
  try {
    const pool = await initDatabase();
    const [rows] = await pool.query('SELECT DATABASE() as db_name, VERSION() as mysql_version, NOW() as server_time');
    console.log('📊 Thông tin kết nối MySQL:');
    console.log(`   - Database: ${rows[0].db_name}`);
    console.log(`   - Phiên bản MySQL: ${rows[0].mysql_version}`);
    console.log(`   - Thời gian Server: ${rows[0].current_time}`);

    const [tableRows] = await pool.query('SHOW TABLES');
    console.log(`✅ Danh sách bảng trong CSDL (${tableRows.length} bảng):`);
    tableRows.forEach((r, idx) => {
      console.log(`   ${idx + 1}. ${Object.values(r)[0]}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Kiểm tra kết nối thất bại:', error.message);
    if (error.sql) console.error('SQL query:', error.sql);
    process.exit(1);
  }
}

test();
