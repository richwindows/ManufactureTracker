import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - 获取产品状态统计
export async function GET() {
  try {
    // 获取状态统计
    const stats = await db.product.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    // 获取今日扫描统计
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayScanned = await db.product.count({
      where: {
        scannedAt: {
          gte: today
        }
      }
    })

    // 获取总数
    const total = await db.product.count()

    // 格式化统计数据
    const formattedStats = {
      total,
      todayScanned,
      byStatus: {
        scheduled: 0,
        '开料': 0,
        '焊接': 0,
        '清角': 0,
        '组装': 0,
        '入库': 0,
        '出库': 0
      }
    }

    stats.forEach(stat => {
      const status = stat.status || 'scheduled'
      if (formattedStats.byStatus.hasOwnProperty(status)) {
        formattedStats.byStatus[status] = stat._count.id
      } else {
        // 如果是未知状态，添加到统计中
        formattedStats.byStatus[status] = stat._count.id
      }
    })

    return NextResponse.json(formattedStats)
    
  } catch (error) {
    console.error('Error getting status stats:', error)
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 })
  }
} 