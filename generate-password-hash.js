// 生成正确的密码哈希
const bcrypt = require('bcryptjs');

async function generatePasswordHash() {
  const password = 'shipping123';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('密码:', password);
    console.log('哈希值:', hash);
    
    // 验证哈希是否正确
    const isValid = await bcrypt.compare(password, hash);
    console.log('验证结果:', isValid);
    
    // 生成SQL语句
    console.log('\n=== SQL 更新语句 ===');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'shipping';`);
    
  } catch (error) {
    console.error('生成哈希失败:', error);
  }
}

generatePasswordHash();