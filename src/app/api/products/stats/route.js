import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - 获取产品统计信息
export async function GET() {
  try {
    // 获取最近30天的数据统计
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const products = await db.product.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true
      }
    })
    
    // 按日期分组统计
    const dateStats = {}
    
    products.forEach(product => {
      const date = product.createdAt.toISOString().split('T')[0]
      dateStats[date] = (dateStats[date] || 0) + 1
    })
    
    // 转换为数组格式并排序
    const statsArray = Object.entries(dateStats)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return NextResponse.json({
      recentDates: statsArray,
      totalCount: products.length
    })
    
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: '获取统计信息失败' }, { status: 500 })
  }
} 