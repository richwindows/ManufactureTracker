const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库出错:', err.message);
    return;
  }
  console.log('连接到SQLite数据库成功');
});

// 清空现有数据并插入完整的生产状态测试数据
db.serialize(() => {
  // 清空现有数据
  db.run('DELETE FROM products', (err) => {
    if (err) {
      console.error('清空数据出错:', err.message);
      return;
    }
    console.log('清空现有数据成功');
  });

  // 插入测试数据
  const insertStmt = db.prepare(`
    INSERT INTO products (customer, product_id, style, size, frame, glass, grid, p_o, batch_no, status, barcode, scannedAt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 7200000).toISOString();
  
  // 包含完整生产流程的测试数据
  const testData = [
    // 已排产状态
    ['Luis107012', '21', 'XO', '35 1/2 x 23 1/2', 'Nailon', 'OBS/cl+', '', 'TLC', '06032025-02-05', 'scheduled', null, null, now, now],
    ['Luis107012', '22', 'XO', '35 1/2 x 23 1/2', 'Nailon', 'OBS/cl+', '', 'TLC', '06032025-02-05', 'scheduled', null, null, now, now],
    ['Luis107012', '23', 'XO', '35 1/2 x 23 1/2', 'Nailon', 'OBS/cl+', '', 'TLC', '06032025-02-05', 'scheduled', null, null, now, now],
    
    // 开料状态
    ['Luis107012', '24', 'XO', '35 1/2 x 23 1/2', 'Nailon', 'OBS/cl+', '', 'TLC', '06032025-02-05', '开料', 'BC001', twoHoursAgo, now, now],
    ['Luis107012', '25', 'XO', '35 1/2 x 23 1/2', 'Nailon', 'OBS/cl+', '', 'TLC', '06032025-02-05', '开料', 'BC002', twoHoursAgo, now, now],
    
    // 焊接状态
    ['Luis107012', '26', 'SH', '35 1/2 x 47 1/2', 'Nailon', 'OBS/cl TP+', '', 'TLC', '06032025-02-05', '焊接', 'BC003', hourAgo, now, now],
    ['Luis107012', '27', 'SH', '35 1/2 x 47 1/2', 'Nailon', 'OBS/cl TP+', '', 'TLC', '06032025-02-05', '焊接', 'BC004', hourAgo, now, now],
    
    // 清角状态
    ['Jesus107004', '28', 'XO', '45 1/2 x 45 1/4', 'Retrofit', 'cl/le2+', '', '', '06032025-02-05', '清角', 'BC005', hourAgo, now, now],
    
    // 组装状态
    ['Luis107014', '29', 'XO', '47 1/2 x 71 1/2', 'Nailon', 'cl/le2+', '', '3288MichiganRd', '06032025-02-05', '组装', 'BC006', now, now, now],
    ['Luis107014', '30', 'XO', '47 1/2 x 71 1/2', 'Nailon', 'cl/le2+', '', '3288MichiganRd', '06032025-02-05', '组装', 'BC007', now, now, now],
    
    // 入库状态
    ['Luis107014', '31', 'XO', '59 1/2 x 59 1/2', 'Nailon', 'OBS/le2 TP+', '', '3288MichiganRd', '06032025-02-05', '入库', 'BC008', now, now, now],
    ['Luis107014', '32', 'XO', '59 1/2 x 59 1/2', 'Nailon', 'OBS/le2 TP+', '', '3288MichiganRd', '06032025-02-05', '入库', 'BC009', now, now, now],
    
    // 出库状态
    ['Hou106792', '33', 'SH', '21 x 32 1/4', 'Retrofit', 'OBS/cl TP+', '', 'Standard', 'Standard', '出库', 'BC010', now, now, now]
  ];

  testData.forEach((data, index) => {
    insertStmt.run(data, (err) => {
      if (err) {
        console.error(`插入第${index + 1}条数据出错:`, err.message);
      } else {
        console.log(`✅ 成功插入第${index + 1}条数据 - ${data[0]} ${data[1]} (${data[9]})`);
      }
    });
  });

  insertStmt.finalize();
});

db.close((err) => {
  if (err) {
    console.error('关闭数据库出错:', err.message);
  } else {
    console.log('📊 生产状态测试数据创建完成！');
    console.log('🏭 包含状态: 已排产、开料、焊接、清角、组装、入库、出库');
  }
}); 