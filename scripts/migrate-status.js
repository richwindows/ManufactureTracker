// 状态完全迁移脚本 - 将旧状态完全替换为新状态
// 运行: node scripts/migrate-status.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// 状态完全替换映射表
const statusMapping = {
  '开料': '已切割',
  '焊接': '已切割',    // 焊接合并到已切割
  '清角': '已清角',
  '组装': '已入库',    // 组装合并到已入库  
  '入库': '已入库',
  '出库': '已出库',
  'pending': 'scheduled',  // 待处理改为已排产
  'scanned': '已切割'      // 已扫描改为已切割
  // 'scheduled' 保持不变
  // '部分出库' 是新状态，不需要映射
}

async function migrateStatus() {
  try {
    console.log('🔄 开始完全状态迁移...\n')
    console.log('⚠️  注意：此操作将完全替换旧状态，不保留向后兼容性！\n')
    
    // 获取所有产品统计
    const allProducts = await prisma.product.findMany({
      select: { id: true, status: true, customer: true, productId: true },
      orderBy: { id: 'asc' }
    })
    
    console.log(`📊 总共有 ${allProducts.length} 个产品需要检查\n`)
    
    // 统计当前状态分布
    const currentStats = {}
    allProducts.forEach(product => {
      const status = product.status || 'scheduled'
      currentStats[status] = (currentStats[status] || 0) + 1
    })
    
    console.log('📈 当前状态分布:')
    Object.entries(currentStats).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} 个`)
    })
    console.log()
    
    // 执行迁移
    let migratedCount = 0
    const migrationResults = {}
    
    for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
      const productsToUpdate = allProducts.filter(p => p.status === oldStatus)
      
      if (productsToUpdate.length > 0) {
        console.log(`🔄 正在迁移 "${oldStatus}" -> "${newStatus}": ${productsToUpdate.length} 个产品`)
        
        const { count } = await prisma.product.updateMany({
          where: { status: oldStatus },
          data: { status: newStatus }
        })
        
        migratedCount += count
        migrationResults[`${oldStatus} -> ${newStatus}`] = count
        console.log(`   ✅ 成功更新 ${count} 个产品`)
      }
    }
    
    console.log(`\n🎉 迁移完成！共更新了 ${migratedCount} 个产品的状态\n`)
    
    // 显示迁移结果
    if (Object.keys(migrationResults).length > 0) {
      console.log('📋 迁移详情:')
      Object.entries(migrationResults).forEach(([mapping, count]) => {
        console.log(`   ${mapping}: ${count} 个`)
      })
      console.log()
    }
    
    // 获取迁移后的统计
    const updatedProducts = await prisma.product.findMany({
      select: { status: true }
    })
    
    const newStats = {}
    updatedProducts.forEach(product => {
      const status = product.status || 'scheduled'
      newStats[status] = (newStats[status] || 0) + 1
    })
    
    console.log('📊 迁移后状态分布:')
    Object.entries(newStats).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} 个`)
    })
    
    // 验证只有新状态存在
    const validNewStatuses = ['scheduled', '已切割', '已清角', '已入库', '部分出库', '已出库']
    const invalidStatuses = Object.keys(newStats).filter(status => !validNewStatuses.includes(status))
    
    if (invalidStatuses.length > 0) {
      console.log('\n⚠️  发现未预期的状态:')
      invalidStatuses.forEach(status => {
        console.log(`   ${status}: ${newStats[status]} 个`)
      })
      console.log('   建议手动检查这些状态')
    } else {
      console.log('\n✅ 所有状态都是有效的新状态！')
    }
    
    console.log('\n✨ 状态完全迁移成功完成！')
    console.log('\n💡 新的状态流程: scheduled(已排产) → 已切割 → 已清角 → 已入库 → 部分出库 → 已出库')
    console.log('🚫 旧状态已完全移除，不再支持向后兼容')
    
  } catch (error) {
    console.error('❌ 迁移过程中出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateStatus()
    .then(() => {
      console.log('\n🔄 可以使用 npm run dev 启动应用查看新的状态系统')
      process.exit(0)
    })
    .catch((error) => {
      console.error('迁移失败:', error)
      process.exit(1)
    })
}

module.exports = { migrateStatus, statusMapping } 