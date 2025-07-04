const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

const sampleProducts = [
  {
    customer: 'Luis107012',
    productId: '21',
    style: 'XO',
    size: '35 1/2 x 23 1/2',
    frame: 'Nailon',
    glass: 'OBS/cl+',
    grid: 'TLC',
    po: '06032025-02-05',
    batchNo: 'BATCH-001',
    barcode: '1234567890123'
  },
  {
    customer: 'Maria201501',
    productId: '35',
    style: 'YZ',
    size: '40 x 25',
    frame: 'Aluminum',
    glass: 'Clear+',
    grid: 'Standard',
    po: '06032025-02-06',
    batchNo: 'BATCH-002',
    barcode: '1234567890124'
  },
  {
    customer: 'John303040',
    productId: '58',
    style: 'AB',
    size: '30 x 20',
    frame: 'Steel',
    glass: 'Tinted',
    grid: 'Heavy',
    po: '06032025-02-07',
    batchNo: 'BATCH-003',
    barcode: '1234567890125'
  }
]

async function main() {
  console.log('开始添加示例数据...')
  
  for (const product of sampleProducts) {
    const result = await prisma.product.create({
      data: product
    })
    console.log(`已添加产品: ${result.customer} - ${result.productId}`)
  }
  
  console.log('示例数据添加完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 