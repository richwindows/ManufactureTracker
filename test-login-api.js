// 测试登录API
async function testLogin() {
  const testUsers = [
    { username: 'admin', password: 'admin123' },
    { username: 'shipping', password: '123456' },
    { username: 'shipping', password: 'shipping123' }
  ];

  for (const user of testUsers) {
    console.log(`\n=== 测试用户: ${user.username} ===`);
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });

      const data = await response.json();
      
      console.log('状态码:', response.status);
      console.log('响应数据:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('✅ 登录成功');
      } else {
        console.log('❌ 登录失败:', data.error);
      }
    } catch (error) {
      console.log('❌ 网络错误:', error.message);
    }
  }
}

// 如果是在浏览器中运行，请确保服务器正在运行
console.log('开始测试登录API...');
testLogin();