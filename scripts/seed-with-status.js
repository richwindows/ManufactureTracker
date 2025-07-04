const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建带状态的示例数据...')

  // 清空现有数据
  await prisma.product.deleteMany()

  // 创建示例数据 - 包含不同状态
  const products = [
    // 待扫描的产品
    {
      customer: 'Luis107012',
      productId: '21',
      style: 'XO',
      size: '35 1/2 x 23 1/2',
      frame: 'Nailon',
      glass: 'OBS/cl+',
      grid: '',
      po: 'TLC',
      batchNo: '06032025-02-05',
      status: 'pending'
    },
    {
      customer: 'Luis107012',
      productId: '22',
      style: 'XO',
      size: '35 1/2 x 23 1/2',
      frame: 'Nailon',
      glass: 'OBS/cl+',
      grid: '',
      po: 'TLC',
      batchNo: '06032025-02-05',
      status: 'pending'
    },
    {
      customer: 'Luis107012',
      productId: '23',
      style: 'XO',
      size: '35 1/2 x 23 1/2',
      frame: 'Nailon',
      glass: 'OBS/cl+',
      grid: '',
      po: 'TLC',
      batchNo: '06032025-02-05',
      status: 'pending'
    },
    {
      customer: 'Luis107012',
      productId: '24',
      style: 'XO',
      size: '35 1/2 x 23 1/2',
      frame: 'Nailon',
      glass: 'OBS/cl+',
      grid: '',
      po: 'TLC',
      batchNo: '06032025-02-05',
      status: 'pending'
    },
    {
      customer: 'Luis107012',
      productId: '25',
      style: 'XO',
      size: '35 1/2 x 23 1/2',
      frame: 'Nailon',
      glass: 'OBS/cl+',
      grid: '',
      po: 'TLC',
      batchNo: '06032025-02-05',
      status: 'pending'
    },
    // 已扫描的产品
    {
      customer: 'Luis107012',
      productId: '26',
      style: 'SH',
      size: '35 1/2 x 47 1/2',
      frame: 'Nailon',
      glass: 'OBS/cl TP+',
      grid: '',
      po: 'TLC',
      batchNo: '06032025-02-05',
      barcode: 'BC001',
      status: 'scanned',
      scannedAt: new Date()
    },
    {
      customer: 'Luis107012',
      productId: '27',
      style: 'SH',
      size: '35 1/2 x 47 1/2',
      frame: 'Nailon',
      glass: 'OBS/cl TP+',
      grid: '',
      po: 'TLC',
      batchNo: '06032025-02-05',
      barcode: 'BC002',
      status: 'scanned',
      scannedAt: new Date(Date.now() - 3600000) // 1小时前
    },
    // 已完成的产品
    {
      customer: 'Jesus107004',
      productId: '28',
      style: 'XO',
      size: '45 1/2 x 45 1/4',
      frame: 'Retrofit',
      glass: 'cl/le2+',
      grid: '',
      po: '',
      batchNo: '06032025-02-05',
      barcode: 'BC003',
      status: 'completed',
      scannedAt: new Date(Date.now() - 7200000) // 2小时前
    },
    // 更多待扫描产品
    {
      customer: 'Luis107014',
      productId: '29',
      style: 'XO',
      size: '47 1/2 x 71 1/2',
      frame: 'Nailon',
      glass: 'cl/le2+',
      grid: '',
      po: '3288MichiganRd',
      batchNo: '06032025-02-05',
      status: 'pending'
    },
    {
      customer: 'Luis107014',
      productId: '30',
      style: 'XO',
      size: '47 1/2 x 71 1/2',
      frame: 'Nailon',
      glass: 'cl/le2+',
      grid: '',
      po: '3288MichiganRd',
      batchNo: '06032025-02-05',
      status: 'pending'
    }
  ]

  for (const productData of products) {
    await prisma.product.create({
      data: productData
    })
  }

  console.log(`✅ 成功创建 ${products.length} 个示例产品`)
  
  // 显示统计信息
  const stats = await prisma.product.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  })
  
  console.log('\n📊 状态统计:')
  stats.forEach(stat => {
    const statusText = {
      pending: '待扫描',
      scanned: '已扫描',
      completed: '已完成'
    }[stat.status] || stat.status
    console.log(`   ${statusText}: ${stat._count.id} 个`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 