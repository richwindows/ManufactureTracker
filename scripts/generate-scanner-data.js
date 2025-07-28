// 生成模拟扫码枪数据的脚本
// 为指定的条码生成三个不同扫码枪的扫描记录

// API基础URL
const API_BASE = 'http://localhost:3001/api';

// 动态导入fetch
let fetch;

async function initFetch() {
  if (typeof globalThis.fetch !== 'undefined') {
    fetch = globalThis.fetch;
  } else {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
  }
}

// 指定的条码列表
const barcodes = [
  'Rich-07212025-01',
  'Rich-07212025-02', 
  'Rich-07212025-03',
  'Rich-07212025-04',
  'Rich-07212025-05',
  'Rich-07212025-06',
  'Rich-07212025-07',
  'Rich-07212025-08',
  'Rich-07212025-09',
  'Rich-07212025-10'
];

// 扫码枪设备标识
const scanners = ['1@', '2@', '3@'];

// 生成随机时间偏移（在过去24小时内）
function getRandomTimestamp() {
  const now = new Date();
  const randomHoursAgo = Math.random() * 24; // 0-24小时前
  const randomMinutesAgo = Math.random() * 60; // 0-60分钟前
  const timestamp = new Date(now.getTime() - (randomHoursAgo * 60 * 60 * 1000) - (randomMinutesAgo * 60 * 1000));
  return timestamp.toISOString();
}

// 添加单个扫描记录
async function addScanRecord(barcode, device_id) {
  try {
    const response = await fetch(`${API_BASE}/barcodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ barcode, device_id })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error(`❌ 添加失败 ${barcode} (${device_id}):`, result.error);
      return null;
    }
    
    return result;
  } catch (error) {
    console.error(`❌ 网络错误 ${barcode} (${device_id}):`, error.message);
    return null;
  }
}

// 生成扫码数据
async function generateScannerData() {
  console.log('开始生成模拟扫码枪数据...');
  
  const scanRecords = [];
  const successfulScans = [];
  
  // 为每个条码生成扫描记录
  for (const barcode of barcodes) {
    // 随机选择1-3个扫码枪来扫描这个条码
    const numScans = Math.floor(Math.random() * 3) + 1; // 1-3次扫描
    const selectedScanners = [...scanners].sort(() => 0.5 - Math.random()).slice(0, numScans);
    
    for (const scanner of selectedScanners) {
      const record = {
        barcode: barcode,
        device_id: scanner,
        timestamp: getRandomTimestamp()
      };
      scanRecords.push(record);
    }
  }
  
  // 按时间排序
  scanRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  console.log(`准备插入 ${scanRecords.length} 条扫描记录...`);
  
  // 逐个插入数据（避免并发问题）
  for (let i = 0; i < scanRecords.length; i++) {
    const record = scanRecords[i];
    console.log(`正在插入 ${i + 1}/${scanRecords.length}: ${record.barcode} - ${record.device_id}`);
    
    const result = await addScanRecord(record.barcode, record.device_id);
    if (result) {
      successfulScans.push({ ...record, id: result.id });
      console.log(`✅ 成功`);
    }
    
    // 添加小延迟避免过快请求
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n✅ 成功插入 ${successfulScans.length}/${scanRecords.length} 条扫描记录`);
  
  // 显示统计信息
  const stats = {};
  successfulScans.forEach(record => {
    if (!stats[record.device_id]) {
      stats[record.device_id] = 0;
    }
    stats[record.device_id]++;
  });
  
  console.log('\n📊 扫码枪统计:');
  Object.entries(stats).forEach(([scanner, count]) => {
    console.log(`  ${scanner}: ${count} 次扫描`);
  });
  
  console.log('\n📋 生成的扫描记录:');
  successfulScans.forEach((record, index) => {
    const time = new Date(record.timestamp).toLocaleString('zh-CN');
    console.log(`  ${index + 1}. ${record.barcode} - ${record.device_id} - ${time}`);
  });
}

// 主函数
async function main() {
  console.log('🔧 模拟扫码枪数据生成器');
  console.log('=' .repeat(50));
  
  // 初始化fetch
  await initFetch();
  
  await generateScannerData();
  
  console.log('\n✨ 数据生成完成!');
  process.exit(0);
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateScannerData };