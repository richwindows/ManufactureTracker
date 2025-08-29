import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 获取产品（支持日期范围筛选和搜索）
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const date = searchParams.get('date') // 保持向后兼容
    const search = searchParams.get('search') // 添加搜索参数
    
    // 1. 获取所有产品数据 - 使用分页查询获取所有数据
    let allProducts = []
    let from = 0
    const pageSize = 1000
    let hasMore = true
    
    while (hasMore) {
      const { data: pageProducts, error: pageError } = await supabase
        .from('products')
        .select('*')
        .range(from, from + pageSize - 1)
      
      if (pageError) {
        console.error('获取产品失败:', pageError)
        throw pageError
      }
      
      if (pageProducts && pageProducts.length > 0) {
        allProducts = allProducts.concat(pageProducts)
        from += pageSize
        hasMore = pageProducts.length === pageSize
      } else {
        hasMore = false
      }
    }
    
    const products = allProducts
    const productsError = null

    // 产品数据获取完成
    
    if (productsError) {
      console.error('获取产品失败:', productsError)
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
    
    // 处理产品数组
    
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

    // 5. 应用时间过滤到产品数据
    let filteredProducts = processedProducts

    if (date) {
      // 如果指定了单个日期，筛选指定日期的数据（向后兼容）
      // 使用太平洋时区
      const startTime = new Date(`${date}T00:00:00-08:00`)
      const endTime = new Date(`${date}T23:59:59.999-08:00`)
      
      console.log('Products API 单日期过滤 (太平洋时区):', { 
        date, 
        startTime: startTime.toISOString(), 
        endTime: endTime.toISOString() 
      })
      
      // 过滤产品数据
      filteredProducts = processedProducts.filter(product => {
        const createdDate = new Date(product.created_at)
        const scannedDate = product.scanned_at ? new Date(product.scanned_at) : null
        
        const createdInRange = createdDate >= startTime && createdDate <= endTime
        const scannedInRange = scannedDate && scannedDate >= startTime && scannedDate <= endTime
        
        return createdInRange || scannedInRange
      })
      
    } else if (startDate && endDate) {
      // 如果指定了日期范围，使用太平洋时区
      const startTime = new Date(`${startDate}T00:00:00-08:00`)
      const endTime = new Date(`${endDate}T23:59:59.999-08:00`)
      
      // console.log('Products API 日期范围过滤 (太平洋时区):', { 
      //   startDate, 
      //   endDate, 
      //   startTime: startTime.toISOString(), 
      //   endTime: endTime.toISOString() 
      // })
      
      // 过滤产品数据
      filteredProducts = processedProducts.filter(product => {
        const createdDate = new Date(product.created_at)
        const scannedDate = product.scanned_at ? new Date(product.scanned_at) : null
        
        const createdInRange = createdDate >= startTime && createdDate <= endTime
        const scannedInRange = scannedDate && scannedDate >= startTime && scannedDate <= endTime
        
        return createdInRange || scannedInRange
      })
      

      
    } else if (startDate) {
      const startTime = new Date(`${startDate}T00:00:00-08:00`)
      
      filteredProducts = processedProducts.filter(product => {
        const createdDate = new Date(product.created_at)
        const scannedDate = product.scanned_at ? new Date(product.scanned_at) : null
        
        return createdDate >= startTime || (scannedDate && scannedDate >= startTime)
      })
      

      
    } else if (endDate) {
      const endTime = new Date(`${endDate}T23:59:59.999-08:00`)
      
      filteredProducts = processedProducts.filter(product => {
        const createdDate = new Date(product.created_at)
        const scannedDate = product.scanned_at ? new Date(product.scanned_at) : null
        
        return createdDate <= endTime || (scannedDate && scannedDate <= endTime)
      })
      

    }

    // 6. 基于所有产品数据获取仅扫码数据（修复：使用processedProducts而不是filteredProducts）
    let scannedOnlyBarcodes = Object.values(scanMap).filter(scan => {
      const scanBarcode = scan.barcode_data?.trim()
      return scanBarcode && !processedProducts.some(p => p.barcode?.trim() === scanBarcode)
    })

    // 6.1 对仅扫码数据应用时间过滤
    let filteredScannedOnlyBarcodes = scannedOnlyBarcodes
    if (date) {
      const startTime = new Date(`${date}T00:00:00-08:00`)
      const endTime = new Date(`${date}T23:59:59.999-08:00`)
      filteredScannedOnlyBarcodes = scannedOnlyBarcodes.filter(scan => {
        const scanTime = new Date(scan.last_scan_time)
        return scanTime >= startTime && scanTime <= endTime
      })
    } else if (startDate && endDate) {
      const startTime = new Date(`${startDate}T00:00:00-08:00`)
      const endTime = new Date(`${endDate}T23:59:59.999-08:00`)
      filteredScannedOnlyBarcodes = scannedOnlyBarcodes.filter(scan => {
        const scanTime = new Date(scan.last_scan_time)
        return scanTime >= startTime && scanTime <= endTime
      })
    } else if (startDate) {
      const startTime = new Date(`${startDate}T00:00:00-08:00`)
      filteredScannedOnlyBarcodes = scannedOnlyBarcodes.filter(scan => {
        const scanTime = new Date(scan.last_scan_time)
        return scanTime >= startTime
      })
    } else if (endDate) {
      const endTime = new Date(`${endDate}T23:59:59.999-08:00`)
      filteredScannedOnlyBarcodes = scannedOnlyBarcodes.filter(scan => {
        const scanTime = new Date(scan.last_scan_time)
        return scanTime <= endTime
      })
    }

    // 7. 处理搜索功能
    if (search) {
      const searchTerm = search.trim().toLowerCase()
      
      // 搜索产品数据
      filteredProducts = filteredProducts.filter(product =>
        product.customer?.toLowerCase().includes(searchTerm) ||
        product.product_id?.toLowerCase().includes(searchTerm) ||
        product.style?.toLowerCase().includes(searchTerm) ||
        product.barcode?.toLowerCase().includes(searchTerm)
      )
      
      // 搜索仅扫码数据
      filteredScannedOnlyBarcodes = filteredScannedOnlyBarcodes.filter(scan =>
        scan.barcode_data?.toLowerCase().includes(searchTerm)
      )
    }

    // 8. 将仅扫码数据转换为产品格式
    const scannedOnlyAsProducts = filteredScannedOnlyBarcodes.map(scan => ({
      id: `scan_${scan.id}`,
      customer: '仅扫码',
      product_id: scan.barcode_data,
      style: '',
      size: '',
      frame: '',
      glass: '',
      grid: '',
      p_o: '',
      batch_no: '',
      barcode: scan.barcode_data,
      status: scan.current_status || '已扫描',
      created_at: scan.last_scan_time,
      scanned_at: scan.last_scan_time,
      updated_at: scan.last_scan_time,
      isScannedOnly: true // 标记为仅扫码数据
    }))

    // 9. 合并产品数据和仅扫码数据，避免重复
    // 创建所有产品条码集合，用于去重（包括空字符串检查）
    const allProductBarcodes = new Set(
      processedProducts
        .map(p => p.barcode?.trim())
        .filter(barcode => barcode && barcode !== '')
    )
    
    // 过滤掉与所有产品条码重复的仅扫码数据（这一步实际上已经在第6步完成，这里是双重保险）
    const uniqueScannedOnlyAsProducts = scannedOnlyAsProducts.filter(scan => 
      !allProductBarcodes.has(scan.barcode?.trim())
    )
    
    // 合并去重后的数据
    const allResults = [...filteredProducts, ...uniqueScannedOnlyAsProducts]
    
    // 按创建时间排序
    allResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // console.log('Products API 数据统计:', {
    //   原始产品: productsArray.length,
    //   过滤后产品: filteredProducts.length,
    //   仅扫码数据: filteredScannedOnlyBarcodes.length,
    //   去重后仅扫码数据: uniqueScannedOnlyAsProducts.length,
    //   总结果: allResults.length
    // })

    // 如果是搜索请求，返回特定格式
    if (search) {
      return NextResponse.json({
        products: allResults,
        total: allResults.length,
        searchTerm: search
      })
    }
    
    return NextResponse.json(allResults)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: '获取产品失败' }, { status: 500 })
  }
}

// POST - 创建新产品
export async function POST(request) {
  try {
    const data = await request.json()
    
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        customer: data.customer,
        product_id: data.productId,
        style: data.style,
        size: data.size,
        frame: data.frame,
        glass: data.glass,
        grid: data.grid || '',
        p_o: data.po,
        batch_no: data.batchNo,
        barcode: data.barcode || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('创建产品失败:', error)
      throw error
    }
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: '创建产品失败' }, { status: 500 })
  }
}

// 移除了 PUT 和 DELETE 方法，它们现在在 [id]/route.js 中处理