import { createClient } from '@supabase/supabase-js'

// Supabase 项目配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 如果不需要用户认证，可以设置为 false
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'X-Client-Info': 'product-management-app' },
  },
})

// 数据库操作辅助函数
export const supabaseHelpers = {
  // 获取产品列表
  async getProducts(filters = {}) {
    let query = supabase.from('products').select('*')
    
    if (filters.date) {
      const startDate = new Date(filters.date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(filters.date)
      endDate.setHours(23, 59, 59, 999)
      
      query = query.gte('created_at', startDate.toISOString())
                  .lte('created_at', endDate.toISOString())
    }
    
    return query.order('created_at', { ascending: false })
  },

  // 获取统计数据
  async getStats(filters = {}) {
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    return {
      totalProducts
    }
  }
} 