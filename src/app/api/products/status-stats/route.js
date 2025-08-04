import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 获取产品状态统计
export async function GET(request) {
  try {
    console.log('🔍 获取产品状态统计...')

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('📅 时间范围参数:', { startDate, endDate })

    // 检查环境变量配置
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase 配置缺失:', {
        url: !!supabaseUrl,
        key: !!supabaseKey
      })
      
      // 返回默认数据和配置错误信息
      const fallbackStats = {
        total: 0,
        todayScanned: 0,
        byStatus: {
          scheduled: 0,
          '已切割': 0,
          '已清角': 0,
          '已入库': 0,
          '部分出库': 0,
          '已出库': 0
        },
        error: 'Supabase 配置未完成。请参考 SUPABASE_SETUP_GUIDE.md 完成配置。',
        needsSetup: true
      }
      
      return NextResponse.json(fallbackStats, { status: 200 })
    }

    // 构建查询
    let query = supabase
      .from('products')
      .select('status, scanned_at, created_at')

    // 如果有时间范围参数，添加过滤条件
    if (startDate && endDate) {
      // 使用 created_at 字段进行时间过滤（产品创建时间）
      const startDateTime = `${startDate}T00:00:00.000Z`
      const endDateTime = `${endDate}T23:59:59.999Z`
      
      query = query
        .gte('created_at', startDateTime)
        .lte('created_at', endDateTime)
      
      console.log('🔍 应用时间过滤:', { startDateTime, endDateTime })
    }

    const { data: products, error: productsError } = await query

    if (productsError) {
      console.error('获取产品数据失败:', productsError)
      
      // 检查是否是表不存在的错误
      if (productsError.code === 'PGRST116' || productsError.message.includes('relation "public.products" does not exist')) {
        const fallbackStats = {
          total: 0,
          todayScanned: 0,
          byStatus: {
            scheduled: 0,
            '已切割': 0,
            '已清角': 0,
            '已入库': 0,
            '部分出库': 0,
            '已出库': 0
          },
          error: '数据库表未创建。请运行 `npx prisma db push` 创建数据库架构。',
          needsSchema: true
        }
        
        return NextResponse.json(fallbackStats, { status: 200 })
      }
      
      throw productsError
    }

    // 确保 products 是数组
    const productsArray = Array.isArray(products) ? products : []

    // 计算总数
    const total = productsArray.length

    // 计算今日扫描统计（如果没有时间范围限制，则计算今天的；如果有时间范围，则计算范围内的）
    let todayScanned = 0
    if (startDate && endDate) {
      // 如果有时间范围，计算范围内有扫描记录的产品
      todayScanned = productsArray.filter(product => {
        if (!product.scanned_at) return false
        const scannedDate = new Date(product.scanned_at)
        const rangeStart = new Date(`${startDate}T00:00:00.000Z`)
        const rangeEnd = new Date(`${endDate}T23:59:59.999Z`)
        return scannedDate >= rangeStart && scannedDate <= rangeEnd
      }).length
    } else {
      // 如果没有时间范围，计算今天的扫描
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      todayScanned = productsArray.filter(product => {
        if (!product.scanned_at) return false
        const scannedDate = new Date(product.scanned_at)
        return scannedDate >= today
      }).length
    }

    // 按状态分组统计
    const statusCounts = productsArray.reduce((acc, product) => {
      const status = product.status || 'scheduled'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // 格式化统计数据 - 只包含新状态
    const formattedStats = {
      total,
      todayScanned,
      byStatus: {
        scheduled: statusCounts.scheduled || 0,
        '已切割': statusCounts['已切割'] || 0,
        '已清角': statusCounts['已清角'] || 0,
        '已入库': statusCounts['已入库'] || 0,
        '部分出库': statusCounts['部分出库'] || 0,
        '已出库': statusCounts['已出库'] || 0
      },
      // 添加时间范围信息到响应中
      dateRange: startDate && endDate ? { startDate, endDate } : null
    }

    // 添加任何其他状态
    Object.keys(statusCounts).forEach(status => {
      if (!formattedStats.byStatus.hasOwnProperty(status)) {
        formattedStats.byStatus[status] = statusCounts[status]
      }
    })

    console.log('✅ 状态统计获取成功:', formattedStats)
    return NextResponse.json(formattedStats)
    
  } catch (error) {
    console.error('💥 获取状态统计失败:', error)
    
    // 返回安全的默认数据
    const fallbackStats = {
      total: 0,
      todayScanned: 0,
      byStatus: {
        scheduled: 0,
        '已切割': 0,
        '已清角': 0,
        '已入库': 0,
        '部分出库': 0,
        '已出库': 0
      }
    }
    
    return NextResponse.json(fallbackStats, { status: 200 })
  }
}