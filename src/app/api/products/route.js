import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 获取产品（支持日期筛选）
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    let query = supabase.from('products').select('*')
    
    if (date) {
      // 如果指定了日期，筛选指定日期的数据
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      
      query = query
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    }
    // 如果没有指定日期，显示所有数据
    
    const { data: products, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('获取产品失败:', error)
      throw error
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