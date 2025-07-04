import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
        const existing = await db.product.findFirst({
          where: {
            productId: row.productId.trim(),
            batchNo: row.batchNo.trim()
          }
        })
        
        if (existing) {
          results.failed++
          results.errors.push(`第${i + 1}行: 产品ID ${row.productId} 批次号 ${row.batchNo} 已存在`)
          continue
        }
        
        // 创建产品
        await db.product.create({
          data: {
            customer: row.customer.trim(),
            productId: row.productId.trim(),
            style: row.style.trim(),
            size: row.size.trim(),
            frame: row.frame.trim(),
            glass: row.glass.trim(),
            grid: row.grid ? row.grid.trim() : '',
            po: row.po ? row.po.trim() : '',
            batchNo: row.batchNo.trim(),
            status: 'scheduled' // 默认状态为已排产
          }
        })
        
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