import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - 获取产品（支持日期筛选）
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    let whereClause = {}
    
    if (date) {
      // 如果指定了日期，筛选指定日期的数据
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      
      whereClause = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }
    // 如果没有指定日期，显示所有数据
    
    const products = await db.product.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: '获取产品失败' }, { status: 500 })
  }
}

// POST - 创建新产品
export async function POST(request) {
  try {
    const data = await request.json()
    
    const product = await db.product.create({
      data: {
        customer: data.customer,
        productId: data.productId,
        style: data.style,
        size: data.size,
        frame: data.frame,
        glass: data.glass,
        grid: data.grid || '',
        po: data.po,
        batchNo: data.batchNo,
        barcode: data.barcode || null
      }
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: '创建产品失败' }, { status: 500 })
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
    
    await db.product.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ message: '产品删除成功' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: '删除产品失败' }, { status: 500 })
  }
} 