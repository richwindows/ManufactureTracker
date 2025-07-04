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

// 清空现有数据并插入测试数据
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
    INSERT INTO products (customer, product_id, style, size, frame, glass, grid, p_o, batch_no, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  
  // 一些测试数据
  const testData = [
    ['Luis107012', '21', 'XO', '35 1/2 x 23 1/2', 'Nailon', 'OBS/cl+', '', 'TLC', '06032025-02-05', 'scheduled', now, now],
    ['Luis107012', '22', 'XO', '35 1/2 x 23 1/2', 'Nailon', 'OBS/cl+', '', 'TLC', '06032025-02-05', 'scheduled', now, now],
    ['Luis107012', '23', 'XO', '35 1/2 x 23 1/2', 'Nailon', 'OBS/cl+', '', 'TLC', '06032025-02-05', 'scanned', now, now]
  ];

  testData.forEach((data, index) => {
    insertStmt.run(data, (err) => {
      if (err) {
        console.error(`插入第${index + 1}条数据出错:`, err.message);
      } else {
        console.log(`✅ 成功插入第${index + 1}条数据`);
      }
    });
  });

  insertStmt.finalize();
});

db.close((err) => {
  if (err) {
    console.error('关闭数据库出错:', err.message);
  } else {
    console.log('数据库连接已关闭');
  }
}); 