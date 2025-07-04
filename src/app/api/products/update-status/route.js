import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT - 更新产品状态
export async function PUT(request) {
  try {
    const { productId, barcode, status } = await request.json()
    
    if (!productId || !barcode || !status) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }
    
    // 更新产品状态
    const updatedProduct = await db.product.update({
      where: { id: parseInt(productId) },
      data: {
        barcode: barcode,
        status: status,
        scannedAt: status === 'scanned' ? new Date() : null
      }
    })
    
    return NextResponse.json({
      message: '产品状态更新成功',
      product: updatedProduct
    })
    
  } catch (error) {
    console.error('Error updating product status:', error)
    return NextResponse.json({ error: '更新状态失败' }, { status: 500 })
  }
} 