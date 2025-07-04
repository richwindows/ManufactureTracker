const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

// 创建不同日期的示例数据
const createSampleData = () => {
  const today = new Date()
  const sampleProducts = []

  // 今天的数据
  sampleProducts.push({
    customer: 'Customer_Today_1',
    productId: 'T001',
    style: 'XO',
    size: '30 x 20',
    frame: 'Steel',
    glass: 'Clear',
    grid: 'Standard',
    po: 'PO-TODAY-001',
    batchNo: 'BATCH-TODAY-001',
    barcode: '2025010401',
    createdAt: new Date()
  })

  sampleProducts.push({
    customer: 'Customer_Today_2',
    productId: 'T002',
    style: 'YZ',
    size: '25 x 15',
    frame: 'Aluminum',
    glass: 'Tinted',
    grid: 'Heavy',
    po: 'PO-TODAY-002',
    batchNo: 'BATCH-TODAY-002',
    barcode: '2025010402',
    createdAt: new Date()
  })

  // 昨天的数据
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  
  sampleProducts.push({
    customer: 'Customer_Yesterday_1',
    productId: 'Y001',
    style: 'AB',
    size: '35 x 25',
    frame: 'Wood',
    glass: 'OBS/cl+',
    grid: 'Light',
    po: 'PO-YESTERDAY-001',
    batchNo: 'BATCH-YESTERDAY-001',
    barcode: '2025010301',
    createdAt: yesterday
  })

  sampleProducts.push({
    customer: 'Customer_Yesterday_2',
    productId: 'Y002',
    style: 'CD',
    size: '28 x 18',
    frame: 'Plastic',
    glass: 'Clear+',
    grid: '',
    po: 'PO-YESTERDAY-002',
    batchNo: 'BATCH-YESTERDAY-002',
    barcode: '2025010302',
    createdAt: yesterday
  })

  // 前天的数据
  const dayBeforeYesterday = new Date(today)
  dayBeforeYesterday.setDate(today.getDate() - 2)
  
  sampleProducts.push({
    customer: 'Customer_2DaysAgo_1',
    productId: 'D001',
    style: 'EF',
    size: '40 x 30',
    frame: 'Metal',
    glass: 'Frosted',
    grid: 'Grid1',
    po: 'PO-2DAYS-001',
    batchNo: 'BATCH-2DAYS-001',
    barcode: '2025010201',
    createdAt: dayBeforeYesterday
  })

  // 一周前的数据
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)
  
  sampleProducts.push({
    customer: 'Customer_WeekAgo_1',
    productId: 'W001',
    style: 'GH',
    size: '32 x 22',
    frame: 'Composite',
    glass: 'Laminated',
    grid: 'Special',
    po: 'PO-WEEK-001',
    batchNo: 'BATCH-WEEK-001',
    barcode: '2024122801',
    createdAt: weekAgo
  })

  sampleProducts.push({
    customer: 'Customer_WeekAgo_2',
    productId: 'W002',
    style: 'IJ',
    size: '38 x 28',
    frame: 'Carbon',
    glass: 'Tempered',
    grid: 'Custom',
    po: 'PO-WEEK-002',
    batchNo: 'BATCH-WEEK-002',
    barcode: '2024122802',
    createdAt: weekAgo
  })

  return sampleProducts
}

async function main() {
  console.log('开始添加不同日期的示例数据...')
  
  const sampleProducts = createSampleData()
  
  for (const product of sampleProducts) {
    const result = await prisma.product.create({
      data: product
    })
    console.log(`已添加产品: ${result.customer} - ${result.productId} (${result.createdAt.toISOString().split('T')[0]})`)
  }
  
  console.log(`\n成功添加 ${sampleProducts.length} 条不同日期的示例数据！`)
  console.log('现在您可以测试日期筛选功能了。')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 