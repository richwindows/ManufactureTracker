import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 获取所有条码扫描记录
    const { data: barcodes, error: barcodesError } = await supabase
      .from('barcodes')
      .select('barcode_data, device_id, scanned_at')

    if (barcodesError) {
      console.error('Error fetching barcodes:', barcodesError)
      return Response.json(
        { error: 'Failed to fetch barcode data' },
        { status: 500 }
      )
    }

    // 获取所有产品记录
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('barcode, status')

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return Response.json(
        { error: 'Failed to fetch product data' },
        { status: 500 }
      )
    }

    // 创建产品条码到状态的映射
    const productStatusMap = {}
    const allProducts = new Set()
    products.forEach(product => {
      if (product.barcode) {
        allProducts.add(product.barcode)
        if (product.status) {
          productStatusMap[product.barcode] = product.status
        }
      }
    })

    // 创建扫描过的条码集合
    const scannedBarcodes = new Set()
    barcodes.forEach(barcode => {
      let cleanBarcode = barcode.barcode_data
      if (cleanBarcode.includes('@')) {
        cleanBarcode = cleanBarcode.split('@')[1]
      }
      scannedBarcodes.add(cleanBarcode)
    })

    // 处理条码数据并关联状态
    const processedBarcodes = barcodes.map(barcode => {
      // 提取条码后缀（去掉设备前缀，如 "1@Rich-07212025-01" -> "Rich-07212025-01"）
      let cleanBarcode = barcode.barcode_data
      if (cleanBarcode.includes('@')) {
        cleanBarcode = cleanBarcode.split('@')[1]
      }
      
      // 从产品表中查找匹配的状态
      const status = productStatusMap[cleanBarcode] || '未知状态'
      
      // 从设备ID推断扫描阶段
      let scanStage = 'unknown'
      if (barcode.device_id === '1') {
        scanStage = 'cut'
      } else if (barcode.device_id === '2') {
        scanStage = 'corner_cleaned'
      } else if (barcode.device_id === '3') {
        scanStage = 'stored'
      }
      
      return {
        ...barcode,
        clean_barcode: cleanBarcode,
        product_status: status,
        scan_stage: scanStage
      }
    })

    // 计算统计数据
    const totalScans = processedBarcodes.length
    
    // 今天的扫描数量
    const today = new Date().toISOString().split('T')[0]
    const todayScans = processedBarcodes.filter(barcode => 
      barcode.scanned_at && barcode.scanned_at.startsWith(today)
    ).length

    // 按产品状态分组统计
    const statusCounts = {}
    processedBarcodes.forEach(barcode => {
      const status = barcode.product_status
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // 按扫描阶段分组统计
    const stageCounts = {}
    processedBarcodes.forEach(barcode => {
      const stage = barcode.scan_stage
      stageCounts[stage] = (stageCounts[stage] || 0) + 1
    })

    // 按设备分组统计
    const deviceCounts = {}
    processedBarcodes.forEach(barcode => {
      const device = `设备${barcode.device_id}`
      deviceCounts[device] = (deviceCounts[device] || 0) + 1
    })

    // 计算产品扫描统计
    const totalProducts = allProducts.size
    const scannedProducts = Array.from(allProducts).filter(barcode => scannedBarcodes.has(barcode)).length
    const unscannedProducts = totalProducts - scannedProducts

    // 按扫描状态分组产品
    const productScanStatus = {
      'scanned': scannedProducts,
      'not_scanned': unscannedProducts
    }

    // 获取已扫描产品的详细信息
    const scannedProductDetails = Array.from(allProducts)
      .map(barcode => ({
        barcode,
        isScanned: scannedBarcodes.has(barcode),
        status: productStatusMap[barcode] || 'no_status',
        scanCount: processedBarcodes.filter(scan => scan.clean_barcode === barcode).length
      }))
      .sort((a, b) => {
        if (a.isScanned && !b.isScanned) return -1
        if (!a.isScanned && b.isScanned) return 1
        return b.scanCount - a.scanCount
      })

    return Response.json({
      totalScans,
      todayScans,
      totalProducts,
      scannedProducts,
      unscannedProducts,
      productScanStatus,
      statusCounts,
      stageCounts,
      deviceCounts,
      scannedProductDetails,
      recentScans: processedBarcodes
        .sort((a, b) => new Date(b.scanned_at) - new Date(a.scanned_at))
        .slice(0, 10)
    })

  } catch (error) {
    console.error('Error in barcodes stats API:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}