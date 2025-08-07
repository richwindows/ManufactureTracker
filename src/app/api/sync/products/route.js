import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - 手动触发产品同步
export async function POST(request) {
  try {
    // 调用数据库的批量同步函数
    const { data, error } = await supabase.rpc('batch_sync_products_from_scans')
    
    if (error) {
      console.error('同步失败:', error)
      throw error
    }
    
    return NextResponse.json({
      success: true,
      message: data || '同步完成',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ 
      success: false,
      error: '同步失败: ' + error.message 
    }, { status: 500 })
  }
}

// GET - 获取同步状态
export async function GET(request) {
  try {
    // 检查最近的同步情况
    const { data: syncStats, error } = await supabase
      .from('products')
      .select('id, status, scanned_at, updated_at')
      .not('scanned_at', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      recentSyncs: syncStats,
      lastSyncTime: syncStats[0]?.updated_at || null,
      syncedProductsCount: syncStats.length
    })
    
  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json({ 
      success: false,
      error: '获取同步状态失败: ' + error.message 
    }, { status: 500 })
  }
}