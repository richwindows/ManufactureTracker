import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 根据设备ID映射状态
const getStatusFromDeviceId = (deviceId) => {
  switch (deviceId) {
    case '1': return 'cut'        // 已切割
    case '2': return 'corner_cleaned'  // 已清角
    case '3': return 'stored'     // 已入库
    default: return null
  }
}

export async function POST() {
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
      .order('scanned_at', { ascending: false })

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
      .select('id, barcode, status')

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return Response.json(
        { error: 'Failed to fetch product data' },
        { status: 500 }
      )
    }

    // 创建条码到最新扫描状态的映射
    const barcodeStatusMap = new Map()
    
    barcodes.forEach(barcode => {
      // 提取条码后缀（去掉设备前缀）
      let cleanBarcode = barcode.barcode_data
      if (cleanBarcode && cleanBarcode.includes('@')) {
        cleanBarcode = cleanBarcode.split('@')[1]
      }
      
      // 获取对应的状态
      const status = getStatusFromDeviceId(barcode.device_id)
      if (status && !barcodeStatusMap.has(cleanBarcode)) {
        // 只保存最新的扫描状态（因为已按时间倒序排列）
        barcodeStatusMap.set(cleanBarcode, {
          status,
          scannedAt: barcode.scanned_at,
          deviceId: barcode.device_id
        })
      }
    })

    // 找出需要更新的产品
    const updatesNeeded = []
    products.forEach(product => {
      if (product.barcode && barcodeStatusMap.has(product.barcode)) {
        const scanInfo = barcodeStatusMap.get(product.barcode)
        // 如果产品状态与扫描状态不同，则需要更新
        if (product.status !== scanInfo.status) {
          updatesNeeded.push({
            id: product.id,
            barcode: product.barcode,
            oldStatus: product.status,
            newStatus: scanInfo.status,
            scannedAt: scanInfo.scannedAt,
            deviceId: scanInfo.deviceId
          })
        }
      }
    })

    // 批量更新产品状态
    const updateResults = []
    for (const update of updatesNeeded) {
      const { data, error } = await supabase
        .from('products')
        .update({ 
          status: update.newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)
        .select()

      if (error) {
        console.error(`Error updating product ${update.id}:`, error)
        updateResults.push({
          ...update,
          success: false,
          error: error.message
        })
      } else {
        updateResults.push({
          ...update,
          success: true,
          updatedData: data
        })
      }
    }

    // 统计结果
    const successCount = updateResults.filter(r => r.success).length
    const failureCount = updateResults.filter(r => !r.success).length

    return Response.json({
      message: 'Status sync completed',
      totalScanned: barcodeStatusMap.size,
      totalProducts: products.length,
      updatesNeeded: updatesNeeded.length,
      successfulUpdates: successCount,
      failedUpdates: failureCount,
      updateResults,
      summary: {
        scannedBarcodes: Array.from(barcodeStatusMap.entries()).map(([barcode, info]) => ({
          barcode,
          status: info.status,
          scannedAt: info.scannedAt,
          deviceId: info.deviceId
        }))
      }
    })

  } catch (error) {
    console.error('Error in sync status API:', error)
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET方法用于预览需要同步的数据
export async function GET() {
  try {
    console.log('🔍 Starting sync-status GET request...')
    console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing')
    console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase configuration missing')
      return Response.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created')

    // 获取所有条码扫描记录
    console.log('📊 Fetching barcodes...')
    const { data: barcodes, error: barcodesError } = await supabase
      .from('barcodes')
      .select('barcode_data, device_id, scanned_at')
      .order('scanned_at', { ascending: false })

    if (barcodesError) {
      console.error('❌ Error fetching barcodes:', barcodesError)
      return Response.json({ error: 'Failed to fetch barcode data', details: barcodesError.message }, { status: 500 })
    }
    console.log('✅ Barcodes fetched:', barcodes?.length || 0)

    // 获取所有产品记录
    console.log('📦 Fetching products...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, barcode, status')

    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
      return Response.json({ error: 'Failed to fetch product data', details: productsError.message }, { status: 500 })
    }
    console.log('✅ Products fetched:', products?.length || 0)

    // 创建条码到最新扫描状态的映射
    const barcodeStatusMap = new Map()
    
    barcodes.forEach(barcode => {
      let cleanBarcode = barcode.barcode_data
      if (cleanBarcode && cleanBarcode.includes('@')) {
        cleanBarcode = cleanBarcode.split('@')[1]
      }
      
      const status = getStatusFromDeviceId(barcode.device_id)
      if (status && !barcodeStatusMap.has(cleanBarcode)) {
        barcodeStatusMap.set(cleanBarcode, {
          status,
          scannedAt: barcode.scanned_at,
          deviceId: barcode.device_id
        })
      }
    })

    // 找出需要更新的产品（预览模式）
    const previewUpdates = []
    products.forEach(product => {
      if (product.barcode && barcodeStatusMap.has(product.barcode)) {
        const scanInfo = barcodeStatusMap.get(product.barcode)
        if (product.status !== scanInfo.status) {
          previewUpdates.push({
            barcode: product.barcode,
            currentStatus: product.status,
            newStatus: scanInfo.status,
            scannedAt: scanInfo.scannedAt,
            deviceId: scanInfo.deviceId
          })
        }
      }
    })

    return Response.json({
      message: 'Preview of status sync',
      totalScanned: barcodeStatusMap.size,
      totalProducts: products.length,
      updatesNeeded: previewUpdates.length,
      previewUpdates
    })

  } catch (error) {
    console.error('Error in preview sync status API:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}