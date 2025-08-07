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

    // 如果有时间范围参数，获取所有产品数据，稍后再过滤
    // 这样可以确保我们不会遗漏任何相关数据
    
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

    // 2. 获取所有扫码数据
    const { data: allScans, error: scansError } = await supabase
      .from('barcode_scans')
      .select('id, barcode_data, last_scan_time, current_status')

    if (scansError) {
      console.error('获取扫码数据失败:', scansError)
    }

    // 3. 创建扫码数据的映射表，用于快速查找
    const scanMap = {}
    if (allScans) {
      allScans.forEach(scan => {
        const barcodeData = scan.barcode_data
        
        if (!scanMap[barcodeData]) {
          scanMap[barcodeData] = scan
        } else {
          // 如果有多个扫码记录，保留最新的
          const currentTime = new Date(scan.last_scan_time)
          const existingTime = new Date(scanMap[barcodeData].last_scan_time)
          
          if (currentTime > existingTime) {
            scanMap[barcodeData] = scan
          }
        }
      })
    }

    // 4. 处理产品数据，如果产品的条码在扫码表中存在，则使用扫码表的状态和时间
    const productsArray = Array.isArray(products) ? products : []
    let processedProducts = productsArray.map(product => {
      if (product.barcode && scanMap[product.barcode]) {
        const scanData = scanMap[product.barcode]
        return {
          ...product,
          status: scanData.current_status || product.status || 'scheduled',
          scanned_at: scanData.last_scan_time || product.scanned_at
        }
      }
      return {
        ...product,
        status: product.status || 'scheduled'
      }
    })

    // 5. 获取仅扫码数据（没有对应产品的扫码记录）
    const productBarcodes = productsArray
      .filter(p => p.barcode)
      .map(p => p.barcode)

    const scannedOnlyBarcodes = Object.values(scanMap).filter(scan => 
      !productBarcodes.includes(scan.barcode_data)
    )

    // 6. 如果有时间范围参数，应用时间过滤
    let filteredProducts = processedProducts
    let filteredScannedOnlyBarcodes = scannedOnlyBarcodes

    if (startDate && endDate) {
      const startDateTime = new Date(`${startDate}T00:00:00.000Z`)
      const endDateTime = new Date(`${endDate}T23:59:59.999Z`)
      
      console.log('🔍 Status-stats API 时间过滤 (UTC):', { 
        startDate, 
        endDate, 
        startDateTime: startDateTime.toISOString(), 
        endDateTime: endDateTime.toISOString() 
      })
      
      // 对产品数据应用时间过滤 - 修复：包含当天创建或扫描的产品
      filteredProducts = processedProducts.filter(product => {
        const createdDate = new Date(product.created_at)
        const scannedDate = product.scanned_at ? new Date(product.scanned_at) : null
        
        // 包含当天创建的产品或当天扫描的产品
        const createdInRange = createdDate >= startDateTime && createdDate <= endDateTime
        const scannedInRange = scannedDate && scannedDate >= startDateTime && scannedDate <= endDateTime
        
        return createdInRange || scannedInRange
      })
      
      // 对仅扫码数据应用时间过滤
      filteredScannedOnlyBarcodes = scannedOnlyBarcodes.filter(scan => {
        const scanTime = new Date(scan.last_scan_time)
        return scanTime >= startDateTime && scanTime <= endDateTime
      })
      
      console.log('📊 Status-stats 时间过滤详情 (UTC):', {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        产品过滤前: processedProducts.length,
        产品过滤后: filteredProducts.length,
        扫码过滤前: scannedOnlyBarcodes.length,
        扫码过滤后: filteredScannedOnlyBarcodes.length
      })
    }

    console.log('📊 数据统计:', {
      allProducts: processedProducts.length,
      filteredProducts: filteredProducts.length,
      scannedOnlyTotal: scannedOnlyBarcodes.length,
      scannedOnlyFiltered: filteredScannedOnlyBarcodes.length,
      totalBarcodes: productBarcodes.length
    })

    // 7. 计算总数（过滤后的产品数据 + 过滤后的仅扫码数据）
    const total = filteredProducts.length + filteredScannedOnlyBarcodes.length

    // 8. 计算今日扫描统计
    let todayScanned = 0
    if (startDate && endDate) {
      // 如果有时间范围，计算范围内有扫描记录的产品
      todayScanned = filteredProducts.filter(product => {
        if (!product.scanned_at) return false
        const scannedDate = new Date(product.scanned_at)
        const rangeStart = new Date(`${startDate}T00:00:00.000Z`)
        const rangeEnd = new Date(`${endDate}T23:59:59.999Z`)
        return scannedDate >= rangeStart && scannedDate <= rangeEnd
      }).length + filteredScannedOnlyBarcodes.length
    } else {
      // 如果没有时间范围，计算今天的扫描 (UTC)
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const todayEnd = new Date(today)
      todayEnd.setUTCHours(23, 59, 59, 999)
      
      const todayProducts = filteredProducts.filter(product => {
        if (!product.scanned_at) return false
        const scannedDate = new Date(product.scanned_at)
        return scannedDate >= today && scannedDate <= todayEnd
      }).length

      const todayScannedOnly = filteredScannedOnlyBarcodes.filter(scan => {
        const scannedDate = new Date(scan.last_scan_time)
        return scannedDate >= today && scannedDate <= todayEnd
      }).length

      todayScanned = todayProducts + todayScannedOnly
    }

    // 9. 按状态分组统计
    // 统计过滤后的产品数据的状态
    const statusCounts = filteredProducts.reduce((acc, product) => {
      const status = product.status || 'scheduled'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // 统计过滤后的仅扫码数据的状态
    filteredScannedOnlyBarcodes.forEach(scan => {
      const status = scan.current_status || '已扫描'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // 9. 格式化统计数据
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
        productsCount: processedProducts.length,
        scannedOnlyCount: filteredScannedOnlyBarcodes.length,
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