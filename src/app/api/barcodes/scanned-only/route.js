import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

// GET - 获取只有扫码数据但没有对应产品数据的条码
export async function GET(request) {
  try {
    console.log('Starting scanned-only API call...')
    
    // 首先获取所有产品的条码
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('barcode')
      .not('barcode', 'is', null);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    console.log('Products with barcodes:', products?.length || 0)

    // 提取所有产品条码
    const productBarcodes = products?.map(p => p.barcode) || [];
    console.log('Product barcodes:', productBarcodes)

    // 获取所有扫码数据 - 使用新的表结构
    const { data: allScans, error: scansError } = await supabase
      .from('barcode_scans')
      .select('id, barcode_data, device_port, created_at, updated_at, current_status, last_scan_time')
      .order('last_scan_time', { ascending: false });

    if (scansError) {
      console.error('Error fetching scans:', scansError);
      return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 });
    }

    console.log('All scans:', allScans?.length || 0)

    // 过滤出没有对应产品数据的扫码记录，并确保状态有默认值
    const scannedOnlyBarcodes = allScans?.filter(scan => 
      !productBarcodes.includes(scan.barcode_data)
    ).map(scan => ({
      ...scan,
      // 使用 current_status 作为状态，如果没有则默认为 '已扫描'
      status: scan.current_status || '已扫描',
      // 使用 last_scan_time 作为扫描时间，如果没有则使用 created_at
      scan_time: scan.last_scan_time || scan.created_at
    })) || [];

    console.log('Scanned-only barcodes:', scannedOnlyBarcodes.length)
    console.log('Sample scanned-only barcode:', scannedOnlyBarcodes[0])

    return NextResponse.json(scannedOnlyBarcodes);
  } catch (error) {
    console.error('Error fetching scanned-only barcodes:', error);
    return NextResponse.json({ error: 'Failed to fetch scanned-only barcodes' }, { status: 500 });
  }
}