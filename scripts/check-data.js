const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('=== 检查数据库中的产品数据 ===\n')
    
    // 获取所有产品
    const allProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`总产品数量: ${allProducts.length}\n`)
    
    // 按状态分组统计
    const statusStats = {}
    allProducts.forEach(product => {
      const status = product.status || '未设置'
      statusStats[status] = (statusStats[status] || 0) + 1
    })
    
    console.log('=== 状态分布 ===')
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`${status}: ${count}`)
    })
    console.log()
    
    // 显示所有产品详情
    console.log('=== 所有产品列表 ===')
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ID: ${product.id}`)
      console.log(`   客户: ${product.customer}`)
      console.log(`   产品ID: ${product.productId}`)
      console.log(`   状态: ${product.status || '未设置'}`)
      console.log(`   条码: ${product.barcode || '无'}`)
      console.log(`   创建时间: ${product.createdAt.toISOString().split('T')[0]}`)
      console.log()
    })
    
    // 检查今天的数据
    const today = new Date().toISOString().split('T')[0]
    const todayProducts = allProducts.filter(p => 
      p.createdAt.toISOString().split('T')[0] === today
    )
    
    console.log(`=== 今天创建的产品 (${today}) ===`)
    console.log(`数量: ${todayProducts.length}`)
    
  } catch (error) {
    console.error('检查数据时出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData() 