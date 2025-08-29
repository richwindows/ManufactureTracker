import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - 批量导入产品
export async function POST(request) {
  try {
    const { data } = await request.json()
    
    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: '数据格式不正确' }, { status: 400 })
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    }
    
    // 获取当前时间作为导入时间（扫描时间）
    const importTime = new Date().toISOString()
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      
      try {
        // 验证必填字段 (P.O不是必填的)
        const requiredFields = ['customer', 'productId', 'style', 'size', 'frame', 'glass', 'batchNo']
        const missingFields = requiredFields.filter(field => !row[field] || row[field].trim() === '')
        
        if (missingFields.length > 0) {
          results.failed++
          results.errors.push(`第${i + 1}行: 缺少必填字段 ${missingFields.join(', ')}`)
          continue
        }
        
        // 检查是否已存在相同的产品ID和批次号
        const productId = row.productId.toString().trim()
        const batchNo = row.batchNo.toString().trim()
        
        const { data: existing, error: checkError } = await supabase
          .from('products')
          .select('id, product_id, batch_no')
          .eq('product_id', productId)
          .eq('batch_no', batchNo)
          .limit(1)
        
        if (checkError) {
          console.error('检查重复产品失败:', checkError)
          throw checkError
        }
        
        // 添加调试信息
        console.log(`检查产品: productId=${productId}, batchNo=${batchNo}, 找到记录数: ${existing ? existing.length : 0}`)
        if (existing && existing.length > 0) {
          console.log('找到的记录:', existing[0])
        }
        
        if (existing && existing.length > 0) {
          results.failed++
          results.errors.push(`第${i + 1}行: 产品ID ${productId} 批次号 ${batchNo} 已存在 (记录ID: ${existing[0].id})`)
          continue
        }
        
        // 检查是否有对应的扫描数据，如果有则使用扫描数据的状态和时间
        let productStatus = 'scheduled'
        let scanTime = new Date().toISOString()
        
        if (row.barcode) {
          const { data: scanData, error: scanError } = await supabase
            .from('barcode_scans')
            .select('current_status, last_scan_time')
            .or(`barcode_data.eq.${row.barcode.trim()},barcode_data.like.%@${row.barcode.trim()}`)
            .order('last_scan_time', { ascending: false })
            .limit(1)
          
          if (!scanError && scanData && scanData.length > 0) {
            // 将扫描状态映射到产品状态
            const statusMapping = {
              '已排产': 'scheduled',
              '生产中': 'in_production', 
              '已完成': 'completed',
              '已发货': 'shipped'
            }
            productStatus = statusMapping[scanData[0].current_status] || 'scheduled'
            scanTime = scanData[0].last_scan_time || scanTime
          }
        }
        
        // 创建产品
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            customer: row.customer.trim(),
            product_id: productId,
            style: row.style.trim(),
            size: row.size.trim(),
            frame: row.frame.trim(),
            glass: row.glass.trim(),
            grid: row.grid ? row.grid.trim() : '',
            p_o: row.pO ? row.pO.trim() : '',
            batch_no: batchNo,
            barcode: row.barcode ? row.barcode.trim() : '',
            status: productStatus, // 使用从扫描数据获取的状态
            scanned_at: scanTime // 使用从扫描数据获取的时间
          })
        
        if (insertError) {
          console.error('创建产品失败:', insertError)
          throw insertError
        }
        
        results.success++
        
      } catch (error) {
        results.failed++
        results.errors.push(`第${i + 1}行: ${error.message}`)
      }
    }
    
    return NextResponse.json({
      message: `批量导入完成！成功 ${results.success} 条，失败 ${results.failed} 条`,
      results
    })
    
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json({ error: '批量导入失败' }, { status: 500 })
  }
}