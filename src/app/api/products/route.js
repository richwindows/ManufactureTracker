import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 获取产品（支持日期范围筛选和搜索）
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const date = searchParams.get('date') // 保持向后兼容
    const search = searchParams.get('search') // 添加搜索参数
    
    let query = supabase.from('products').select('*')
    
    // 处理搜索功能
    if (search) {
      const searchTerm = search.trim()
      query = query.or(`customer.ilike.%${searchTerm}%,product_id.ilike.%${searchTerm}%,style.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
    }
    
    if (date) {
      // 如果指定了单个日期，筛选指定日期的数据（向后兼容）
      // 将洛杉矶时区的日期转换为UTC时间范围
      const laStartTime = new Date(`${date}T00:00:00-08:00`) // 洛杉矶时区开始时间
      const laEndTime = new Date(`${date}T23:59:59.999-08:00`) // 洛杉矶时区结束时间
      
      console.log('Products API 单日期过滤 (洛杉矶->UTC):', { 
        date, 
        laStartTime: laStartTime.toISOString(), 
        laEndTime: laEndTime.toISOString() 
      })
      
      // 修改：使用 OR 条件，包含创建日期或扫描日期在范围内的产品
      query = query.or(
        `and(created_at.gte.${laStartTime.toISOString()},created_at.lte.${laEndTime.toISOString()}),` +
        `and(scanned_at.gte.${laStartTime.toISOString()},scanned_at.lte.${laEndTime.toISOString()})`
      )
    } else if (startDate || endDate) {
      // 如果指定了日期范围，同样使用 OR 条件
      // 将洛杉矶时区的日期转换为UTC时间范围
      if (startDate && endDate) {
        const laStartTime = new Date(`${startDate}T00:00:00-08:00`)
        const laEndTime = new Date(`${endDate}T23:59:59.999-08:00`)
        
        console.log('Products API 日期范围过滤 (洛杉矶->UTC):', { 
          startDate, 
          endDate, 
          laStartTime: laStartTime.toISOString(), 
          laEndTime: laEndTime.toISOString() 
        })
        
        query = query.or(
          `and(created_at.gte.${laStartTime.toISOString()},created_at.lte.${laEndTime.toISOString()}),` +
          `and(scanned_at.gte.${laStartTime.toISOString()},scanned_at.lte.${laEndTime.toISOString()})`
        )
      } else if (startDate) {
        const laStartTime = new Date(`${startDate}T00:00:00-08:00`)
        query = query.or(
          `created_at.gte.${laStartTime.toISOString()},` +
          `scanned_at.gte.${laStartTime.toISOString()}`
        )
      } else if (endDate) {
        const laEndTime = new Date(`${endDate}T23:59:59.999-08:00`)
        query = query.or(
          `created_at.lte.${laEndTime.toISOString()},` +
          `scanned_at.lte.${laEndTime.toISOString()}`
        )
      }
    }
    // 如果没有指定任何日期参数，显示所有数据
    
    const { data: products, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('获取产品失败:', error)
      throw error
    }
    
    // 如果是搜索请求，返回特定格式
    if (search) {
      return NextResponse.json({
        products: products || [],
        total: products?.length || 0,
        searchTerm: search
      })
    }
    
    return NextResponse.json(products || [])
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: '获取产品失败' }, { status: 500 })
  }
}

// POST - 创建新产品
export async function POST(request) {
  try {
    const data = await request.json()
    
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        customer: data.customer,
        product_id: data.productId,
        style: data.style,
        size: data.size,
        frame: data.frame,
        glass: data.glass,
        grid: data.grid || '',
        p_o: data.po,
        batch_no: data.batchNo,
        barcode: data.barcode || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('创建产品失败:', error)
      throw error
    }
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: '创建产品失败' }, { status: 500 })
  }
}

// PUT - 更新产品状态
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const data = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: '缺少产品ID' }, { status: 400 })
    }

    if (!data.status) {
      return NextResponse.json({ error: '缺少状态信息' }, { status: 400 })
    }
    
    const { data: product, error } = await supabase
      .from('products')
      .update({
        status: data.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .select()
      .single()
    
    if (error) {
      console.error('更新产品状态失败:', error)
      throw error
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product status:', error)
    return NextResponse.json({ error: '更新产品状态失败' }, { status: 500 })
  }
}

// DELETE - 删除产品
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: '缺少产品ID' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', parseInt(id))
    
    if (error) {
      console.error('删除产品失败:', error)
      throw error
    }
    
    return NextResponse.json({ message: '产品删除成功' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: '删除产品失败' }, { status: 500 })
  }
}