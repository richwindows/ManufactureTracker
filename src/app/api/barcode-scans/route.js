import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 获取扫码记录
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    let query = supabase.from('barcode_scans_new').select('*')
    
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

// PUT - 更新扫码记录状态
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const data = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: '缺少扫码记录ID' }, { status: 400 })
    }

    if (!data.status) {
      return NextResponse.json({ error: '缺少状态信息' }, { status: 400 })
    }
    
    // 根据状态名称确定要更新的字段
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
      .from('barcode_scans_new')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single()
    
    if (error) {
      console.error('更新扫码记录状态失败:', error)
      throw error
    }
    
    return NextResponse.json(barcodeScan)
  } catch (error) {
    console.error('Error updating barcode scan status:', error)
    return NextResponse.json({ error: '更新扫码记录状态失败' }, { status: 500 })
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
      .from('barcode_scans_new')
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