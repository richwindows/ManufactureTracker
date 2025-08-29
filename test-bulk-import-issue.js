// 测试批量导入问题的脚本
const { supabase } = require('./src/lib/supabase')

async function testProductExists() {
  console.log('=== 测试产品是否存在 ===')
  
  const productId = '53'
  const batchNo = '08272025-03-12'
  
  // 检查products表
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('product_id', productId)
    .eq('batch_no', batchNo)
  
  console.log('产品查询结果:')
  console.log('错误:', productError)
  console.log('数据:', products)
  console.log('记录数:', products ? products.length : 0)
  
  // 检查是否有类似的记录
  const { data: similarProducts, error: similarError } = await supabase
    .from('products')
    .select('*')
    .or(`product_id.eq.${productId},batch_no.eq.${batchNo}`)
    .limit(10)
  
  console.log('\n类似产品记录:')
  console.log('错误:', similarError)
  console.log('数据:', similarProducts)
  
  // 检查barcode_scans表
  const { data: scans, error: scanError } = await supabase
    .from('barcode_scans')
    .select('*')
    .like('barcode_data', '%Rich-082725-12-53%')
  
  console.log('\n扫描记录:')
  console.log('错误:', scanError)
  console.log('数据:', scans)
}

async function testBulkImport() {
  console.log('\n=== 测试批量导入 ===')
  
  const testData = [{
    customer: 'Daxin108443',
    productId: '53',
    style: 'PW',
    size: '29 7/8x47 1/2',
    frame: 'Block-slop 1 3/4',
    glass: 'CL/LE3+Argon',
    grid: 'None',
    pO: '6784',
    batchNo: '08272025-03-12',
    barcode: 'Rich-082725-12-53'
  }]
  
  try {
    const response = await fetch('http://localhost:3000/api/products/bulk-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: testData })
    })
    
    const result = await response.json()
    console.log('批量导入结果:', result)
  } catch (error) {
    console.error('批量导入错误:', error)
  }
}

async function main() {
  await testProductExists()
  await testBulkImport()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testProductExists, testBulkImport }