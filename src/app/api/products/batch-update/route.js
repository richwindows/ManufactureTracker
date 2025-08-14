import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - 批量更新产品状态
export async function POST(request) {
  try {
    const { productIds, status, customer } = await request.json()
    
    console.log('批量更新请求:', { productIds, status, customer })
    
    if (!status) {
      return NextResponse.json({ error: '缺少状态信息' }, { status: 400 })
    }

    let updateQuery = supabase
      .from('products')
      .update({ 
        status: status,
        scanned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    // 如果提供了产品ID列表，按ID更新
    if (productIds && productIds.length > 0) {
      updateQuery = updateQuery.in('id', productIds)
    }
    // 如果提供了客户名称，按客户更新
    else if (customer) {
      updateQuery = updateQuery.eq('customer', customer)
    }
    else {
      return NextResponse.json({ error: '必须提供产品ID列表或客户名称' }, { status: 400 })
    }

    const { data, error, count } = await updateQuery.select()
    
    if (error) {
      console.error('批量更新失败:', error)
      throw error
    }
    
    console.log(`批量更新成功: ${count || data?.length || 0} 个产品`)
    
    return NextResponse.json({ 
      success: true, 
      updatedCount: count || data?.length || 0,
      message: `成功更新 ${count || data?.length || 0} 个产品状态为 ${status}`
    })
    
  } catch (error) {
    console.error('批量更新产品状态错误:', error)
    return NextResponse.json({ 
      error: '批量更新失败: ' + error.message 
    }, { status: 500 })
  }
}