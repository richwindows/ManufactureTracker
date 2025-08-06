import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 获取扫码记录
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    let query = supabase.from('barcode_scans').select('*')
    
    if (startDate || endDate) {
      if (startDate) {
        const startDateTime = new Date(startDate)
        startDateTime.setHours(0, 0, 0, 0)
        query = query.gte('created_at', startDateTime.toISOString())
      }
      
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endDateTime.toISOString())
      }
    }
    
    const { data: scans, error } = await query.order('last_scan_time', { ascending: false })
    
    if (error) {
      console.error('获取扫码记录失败:', error)
      throw error
    }
    
    return NextResponse.json(scans || [])
  } catch (error) {
    console.error('Error fetching barcode scans:', error)
    return NextResponse.json({ error: '获取扫码记录失败' }, { status: 500 })
  }
}

// PUT - 更新扫码记录状态或条码内容
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const data = await request.json()
    
    console.log('PUT request received:', { id, data })
    
    if (!id) {
      return NextResponse.json({ error: '缺少扫码记录ID' }, { status: 400 })
    }

    // 检查是更新状态还是更新条码内容
    if (data.barcode_data !== undefined) {
      console.log('Updating barcode content:', data.barcode_data)
      
      // 更新条码内容
      if (!data.barcode_data.trim()) {
        return NextResponse.json({ error: '条码内容不能为空' }, { status: 400 })
      }

      // 尝试使用 barcode_scans 表而不是 barcode_scans_new
      const { data: barcodeScan, error } = await supabase
        .from('barcode_scans')
        .update({ barcode_data: data.barcode_data.trim() })
        .eq('id', parseInt(id))
        .select()
        .single()
      
      if (error) {
        console.error('更新条码内容失败:', error)
        console.error('Supabase error details:', JSON.stringify(error, null, 2))
        return NextResponse.json({ 
          error: '更新条码内容失败', 
          details: error.message 
        }, { status: 500 })
      }
      
      console.log('Barcode content updated successfully:', barcodeScan)
      return NextResponse.json(barcodeScan)
    } else if (data.status) {
      // 更新状态（原有逻辑）
      const updateData = {}
      const now = new Date().toISOString()
      
      switch (data.status) {
        case 'scheduled':
          updateData.status_1_scheduled = true
          updateData.status_1_time = now
          break
        case '已切割':
          updateData.status_2_cut = true
          updateData.status_2_time = now
          break
        case '已清角':
          updateData.status_3_cleaned = true
          updateData.status_3_time = now
          break
        case '已入库':
          updateData.status_4_stored = true
          updateData.status_4_time = now
          break
        case '部分出库':
          updateData.status_5_partial_out = true
          updateData.status_5_time = now
          break
        case '已出库':
          updateData.status_6_shipped = true
          updateData.status_6_time = now
          break
        default:
          return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
      }
      
      const { data: barcodeScan, error } = await supabase
        .from('barcode_scans')
        .update(updateData)
        .eq('id', parseInt(id))
        .select()
        .single()
      
      if (error) {
        console.error('更新扫码记录状态失败:', error)
        console.error('Supabase error details:', JSON.stringify(error, null, 2))
        return NextResponse.json({ 
          error: '更新扫码记录状态失败', 
          details: error.message 
        }, { status: 500 })
      }
      
      return NextResponse.json(barcodeScan)
    } else {
      return NextResponse.json({ error: '缺少更新数据' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating barcode scan:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ 
      error: '更新扫码记录失败', 
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE - 删除扫码记录
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: '缺少扫码记录ID' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('barcode_scans')
      .delete()
      .eq('id', parseInt(id))
    
    if (error) {
      console.error('删除扫码记录失败:', error)
      throw error
    }
    
    return NextResponse.json({ message: '扫码记录删除成功' })
  } catch (error) {
    console.error('Error deleting barcode scan:', error)
    return NextResponse.json({ error: '删除扫码记录失败' }, { status: 500 })
  }
}