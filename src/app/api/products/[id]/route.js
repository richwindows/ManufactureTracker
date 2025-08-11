import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// PUT - 更新产品状态
export async function PUT(request, { params }) {
  try {
    const { id } = await params  // 添加 await
    const data = await request.json()
    
    console.log('PUT request received:', { id, data })
    
    if (!id) {
      console.error('Missing product ID')
      return NextResponse.json({ error: '缺少产品ID' }, { status: 400 })
    }

    if (!data.status) {
      console.error('Missing status information')
      return NextResponse.json({ error: '缺少状态信息' }, { status: 400 })
    }
    
    // 检查是否是仅扫码数据（ID格式为 scan_xxx）
    if (id.startsWith('scan_')) {
      console.log('Updating scan-only data status:', { id, status: data.status })
      
      // 提取真实的扫码ID
      const scanId = parseInt(id.replace('scan_', ''))
      if (isNaN(scanId)) {
        console.error('Invalid scan ID format:', id)
        return NextResponse.json({ error: '扫码ID格式无效' }, { status: 400 })
      }
      
      const currentTime = new Date().toISOString()
      
      // 根据状态确定要更新的字段
      let updateData = {
        updated_at: currentTime
      }
      
      switch (data.status) {
        case '已排产':
        case 'scheduled':
          updateData.status_1_scheduled = true
          updateData.status_1_time = currentTime
          break
        case '已切割':
          updateData.status_2_cut = true
          updateData.status_2_time = currentTime
          break
        case '已清角':
          updateData.status_3_cleaned = true
          updateData.status_3_time = currentTime
          break
        case '已入库':
          updateData.status_4_stored = true
          updateData.status_4_time = currentTime
          break
        case '部分出库':
          updateData.status_5_partial_out = true
          updateData.status_5_time = currentTime
          break
        case '已出库':
          updateData.status_6_shipped = true
          updateData.status_6_time = currentTime
          break
        default:
          console.error('Unknown status for scan data:', data.status)
          return NextResponse.json({ error: '未知的状态类型' }, { status: 400 })
      }
      
      console.log('Updating scan data with:', updateData)
      
      // 更新 barcode_scans 表
      const { data: scanData, error: scanError } = await supabase
        .from('barcode_scans')
        .update(updateData)
        .eq('id', scanId)
        .select()
        .single()
      
      if (scanError) {
        console.error('Supabase scan update error:', scanError)
        return NextResponse.json({ 
          error: '更新扫码数据状态失败', 
          details: scanError.message,
          code: scanError.code 
        }, { status: 500 })
      }
      
      if (!scanData) {
        console.error('No scan data found with ID:', scanId)
        return NextResponse.json({ error: '未找到指定扫码数据' }, { status: 404 })
      }
      
      console.log('Scan data updated successfully:', scanData)
      
      // 返回格式化的产品格式数据
      const formattedScanData = {
        id: `scan_${scanData.id}`,
        customer: scanData.barcode_data || '仅扫码',
        product_id: null,
        style: null,
        size: null,
        frame: null,
        glass: null,
        grid: null,
        p_o: null,
        batch_no: null,
        barcode: scanData.barcode_data,
        status: scanData.current_status,
        scanned_at: scanData.last_scan_time,
        created_at: scanData.created_at,
        updated_at: scanData.updated_at,
        isScannedOnly: true
      }
      
      return NextResponse.json(formattedScanData)
    }
    
    // 确保ID是数字（真实产品）
    const numericId = parseInt(id)
    if (isNaN(numericId)) {
      console.error('Invalid product ID format:', id)
      return NextResponse.json({ error: '产品ID格式无效' }, { status: 400 })
    }
    
    console.log('Updating product:', { id: numericId, status: data.status })
    
    const currentTime = new Date().toISOString()
    
    const { data: product, error } = await supabase
      .from('products')
      .update({
        status: data.status,
        scanned_at: currentTime,  // 更新扫描时间为当前时间
        updated_at: currentTime
      })
      .eq('id', numericId)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ 
        error: '更新产品状态失败', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }
    
    if (!product) {
      console.error('No product found with ID:', numericId)
      return NextResponse.json({ error: '未找到指定产品' }, { status: 404 })
    }
    
    console.log('Product updated successfully:', product)
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product status:', error)
    return NextResponse.json({ 
      error: '更新产品状态失败', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// DELETE - 删除产品
export async function DELETE(request, { params }) {
  try {
    const { id } = await params  // 添加 await
    
    console.log('DELETE request received:', { id })
    
    if (!id) {
      console.error('Missing product ID')
      return NextResponse.json({ error: '缺少产品ID' }, { status: 400 })
    }
    
    // 检查是否是仅扫码数据
    if (id.startsWith('scan_')) {
      console.log('Attempting to delete scan-only data, which is not supported')
      return NextResponse.json({ 
        error: '无法删除仅扫码数据', 
        message: '仅扫码数据不支持删除操作' 
      }, { status: 400 })
    }
    
    // 确保ID是数字
    const numericId = parseInt(id)
    if (isNaN(numericId)) {
      console.error('Invalid product ID format:', id)
      return NextResponse.json({ error: '产品ID格式无效' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', numericId)
    
    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ 
        error: '删除产品失败', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }
    
    console.log('Product deleted successfully:', numericId)
    return NextResponse.json({ message: '产品删除成功' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ 
      error: '删除产品失败', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}