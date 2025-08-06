import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 获取产品状态统计
export async function GET(request) {
  try {
    console.log('🔍 获取产品状态统计...')

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('📅 时间范围参数:', { startDate, endDate })

    // 检查环境变量配置
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase 配置缺失:', {
        url: !!supabaseUrl,
        key: !!supabaseKey
      })
      
      // 返回默认数据和配置错误信息
      const fallbackStats = {
        total: 0,
        todayScanned: 0,
        byStatus: {
          scheduled: 0,
          '已切割': 0,
          '已清角': 0,
          '已入库': 0,
          '部分出库': 0,
          '已出库': 0,
          '已扫描': 0 // 添加仅扫码数据的状态
        },
        error: 'Supabase 配置未完成。请参考 SUPABASE_SETUP_GUIDE.md 完成配置。',
        needsSetup: true
      }
      
      return NextResponse.json(fallbackStats, { status: 200 })
    }

    // 1. 获取产品数据
    let productsQuery = supabase
      .from('products')
      .select('status, scanned_at, created_at, barcode')

    // 如果有时间范围参数，添加过滤条件
    if (startDate && endDate) {
      const startDateTime = `${startDate}T00:00:00.000Z`
      const endDateTime = `${endDate}T23:59:59.999Z`
      
      productsQuery = productsQuery
        .gte('created_at', startDateTime)
        .lte('created_at', endDateTime)
      
      console.log('🔍 应用时间过滤:', { startDateTime, endDateTime })
    }

    const { data: products, error: productsError } = await productsQuery

    if (productsError) {
      console.error('获取产品数据失败:', productsError)
      
      // 检查是否是表不存在的错误
      if (productsError.code === 'PGRST116' || productsError.message.includes('relation "public.products" does not exist')) {
        const fallbackStats = {
          total: 0,
          todayScanned: 0,
          byStatus: {
            scheduled: 0,
            '已切割': 0,
            '已清角': 0,
            '已入库': 0,
            '部分出库': 0,
            '已出库': 0,
            '已扫描': 0
          },
          error: '数据库表未创建。请运行 `npx prisma db push` 创建数据库架构。',
          needsSchema: true
        }
        
        return NextResponse.json(fallbackStats, { status: 200 })
      }
      
      throw productsError
    }

    // 2. 获取仅扫码数据
    // 首先获取所有产品的条码
    const productsArray = Array.isArray(products) ? products : []
    const productBarcodes = productsArray
      .filter(p => p.barcode)
      .map(p => p.barcode)

    // 获取所有扫码数据
    let scansQuery = supabase
      .from('barcode_scans')
      .select('id, barcode_data, scan_time, status')

    // 如果有时间范围参数，也对扫码数据应用过滤
    if (startDate && endDate) {
      const startDateTime = `${startDate}T00:00:00.000Z`
      const endDateTime = `${endDate}T23:59:59.999Z`
      
      scansQuery = scansQuery
        .gte('scan_time', startDateTime)
        .lte('scan_time', endDateTime)
    }

    const { data: allScans, error: scansError } = await scansQuery

    if (scansError) {
      console.error('获取扫码数据失败:', scansError)
    }

    // 过滤出没有对应产品数据的扫码记录
    const scannedOnlyBarcodes = (allScans || []).filter(scan => 
      !productBarcodes.includes(scan.barcode_data)
    )

    // 合并相同barcode_data的记录，保留最新状态
    const mergedBarcodes = {}
    
    scannedOnlyBarcodes.forEach(barcode => {
      const barcodeData = barcode.barcode_data
      
      if (!mergedBarcodes[barcodeData]) {
        mergedBarcodes[barcodeData] = barcode
      } else {
        // 比较时间，保留最新的记录
        const currentTime = new Date(barcode.scan_time)
        const existingTime = new Date(mergedBarcodes[barcodeData].scan_time)
        
        if (currentTime > existingTime) {
          mergedBarcodes[barcodeData] = barcode
        }
      }
    })

    // 将合并后的条码数据转换为数组
    const uniqueScannedOnlyBarcodes = Object.values(mergedBarcodes)

    console.log('📊 数据统计:', {
      products: productsArray.length,
      scannedOnlyOriginal: scannedOnlyBarcodes.length,
      scannedOnlyMerged: uniqueScannedOnlyBarcodes.length,
      totalBarcodes: productBarcodes.length
    })

    // 3. 计算总数（产品数据 + 合并后的仅扫码数据）
    const total = productsArray.length + uniqueScannedOnlyBarcodes.length

    // 4. 计算今日扫描统计
    let todayScanned = 0
    if (startDate && endDate) {
      // 如果有时间范围，计算范围内有扫描记录的产品
      todayScanned = productsArray.filter(product => {
        if (!product.scanned_at) return false
        const scannedDate = new Date(product.scanned_at)
        const rangeStart = new Date(`${startDate}T00:00:00.000Z`)
        const rangeEnd = new Date(`${endDate}T23:59:59.999Z`)
        return scannedDate >= rangeStart && scannedDate <= rangeEnd
      }).length + uniqueScannedOnlyBarcodes.length // 合并后的仅扫码数据在时间范围内已经被过滤了
    } else {
      // 如果没有时间范围，计算今天的扫描
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayProducts = productsArray.filter(product => {
        if (!product.scanned_at) return false
        const scannedDate = new Date(product.scanned_at)
        return scannedDate >= today
      }).length

      const todayScannedOnly = uniqueScannedOnlyBarcodes.filter(scan => {
        const scannedDate = new Date(scan.scan_time)
        return scannedDate >= today
      }).length

      todayScanned = todayProducts + todayScannedOnly
    }

    // 5. 按状态分组统计
    // 统计产品数据的状态
    const statusCounts = productsArray.reduce((acc, product) => {
      const status = product.status || 'scheduled'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // 统计合并后的仅扫码数据的状态
    uniqueScannedOnlyBarcodes.forEach(scan => {
      const status = scan.status || '已扫描'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // 6. 格式化统计数据
    const formattedStats = {
      total,
      todayScanned,
      byStatus: {
        scheduled: statusCounts.scheduled || 0,
        '已切割': statusCounts['已切割'] || 0,
        '已清角': statusCounts['已清角'] || 0,
        '已入库': statusCounts['已入库'] || 0,
        '部分出库': statusCounts['部分出库'] || 0,
        '已出库': statusCounts['已出库'] || 0,
        '已扫描': statusCounts['已扫描'] || 0 // 仅扫码数据的状态
      },
      // 添加时间范围信息到响应中
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      // 添加详细统计信息
      details: {
        productsCount: productsArray.length,
        scannedOnlyCount: uniqueScannedOnlyBarcodes.length,
        originalScannedOnlyCount: scannedOnlyBarcodes.length // 保留原始数量用于调试
      }
    }

    // 添加任何其他状态
    Object.keys(statusCounts).forEach(status => {
      if (!formattedStats.byStatus.hasOwnProperty(status)) {
        formattedStats.byStatus[status] = statusCounts[status]
      }
    })

    console.log('✅ 状态统计获取成功:', formattedStats)
    return NextResponse.json(formattedStats)
    
  } catch (error) {
    console.error('💥 获取状态统计失败:', error)
    
    // 返回安全的默认数据
    const fallbackStats = {
      total: 0,
      todayScanned: 0,
      byStatus: {
        scheduled: 0,
        '已切割': 0,
        '已清角': 0,
        '已入库': 0,
        '部分出库': 0,
        '已出库': 0,
        '已扫描': 0
      }
    }
    
    return NextResponse.json(fallbackStats, { status: 200 })
  }
}