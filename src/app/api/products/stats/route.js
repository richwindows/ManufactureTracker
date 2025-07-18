import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 获取产品统计信息
export async function GET() {
  try {
    // 检查环境变量配置
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase 配置缺失:', {
        url: !!supabaseUrl,
        key: !!supabaseKey
      })
      
      return NextResponse.json({
        error: 'Supabase 配置未完成。请参考 SUPABASE_SETUP_GUIDE.md 完成配置。',
        needsSetup: true,
        missingConfig: {
          url: !supabaseUrl,
          key: !supabaseKey
        },
        recentDates: [],
        totalCount: 0
      }, { status: 500 })
    }
    
    // 获取最近30天的数据统计
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: products, error } = await supabase
      .from('products')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
    
    if (error) {
      console.error('获取产品统计失败:', error)
      
      // 检查是否是表不存在的错误
      if (error.code === 'PGRST116' || error.message.includes('relation "public.products" does not exist')) {
        return NextResponse.json({ 
          error: '数据库表未创建。请运行 `npx prisma db push` 创建数据库架构。',
          needsSchema: true,
          recentDates: [],
          totalCount: 0
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: '获取统计信息失败: ' + error.message,
        sqlError: true,
        recentDates: [],
        totalCount: 0
      }, { status: 500 })
    }
    
    // 确保 products 是数组
    const productsArray = Array.isArray(products) ? products : []
    
    // 按日期分组统计
    const dateStats = {}
    
    productsArray.forEach(product => {
      const date = new Date(product.created_at).toISOString().split('T')[0]
      dateStats[date] = (dateStats[date] || 0) + 1
    })
    
    // 转换为数组格式并排序
    const statsArray = Object.entries(dateStats)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return NextResponse.json({
      recentDates: statsArray,
      totalCount: productsArray.length
    })
    
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ 
      error: '获取统计信息失败: ' + error.message,
      recentDates: [],
      totalCount: 0
    }, { status: 500 })
  }
} 