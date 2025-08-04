import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// GET - 获取条码记录
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');

    switch (action) {
      case 'today-count':
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount, error: todayError } = await supabase
          .from('barcode_scans')
          .select('*', { count: 'exact', head: true })
          .gte('scan_time', `${today}T00:00:00Z`)
          .lt('scan_time', `${today}T23:59:59Z`);
        
        if (todayError) {
          console.error('Error fetching today count:', todayError);
          return NextResponse.json({ error: 'Failed to fetch today count' }, { status: 500 });
        }
        return NextResponse.json({ count: todayCount || 0 });

      case 'today-list':
        const todayForList = new Date().toISOString().split('T')[0];
        const { data: todayBarcodes, error: todayListError } = await supabase
          .from('barcode_scans')
          .select('id, barcode_data, scan_time, device_port, status')
          .gte('scan_time', `${todayForList}T00:00:00Z`)
          .lt('scan_time', `${todayForList}T23:59:59Z`)
          .order('scan_time', { ascending: false });
        
        if (todayListError) {
          console.error('Error fetching today list:', todayListError);
          return NextResponse.json({ error: 'Failed to fetch today list' }, { status: 500 });
        }
        
        // 转换字段名以保持兼容性
        const formattedTodayBarcodes = todayBarcodes?.map(barcode => ({
          id: barcode.id,
          barcode: barcode.barcode_data,
          scannedAt: barcode.scan_time,
          device_port: barcode.device_port,
          status: barcode.status
        })) || [];
        
        return NextResponse.json(formattedTodayBarcodes);

      case 'highest-record':
        try {
          // 手动查询所有记录并按日期分组
          const { data: allBarcodes, error: fallbackError } = await supabase
            .from('barcode_scans')
            .select('scan_time');
          
          if (fallbackError) {
            console.error('Fallback query failed:', fallbackError);
            return NextResponse.json({ count: 0, date: '' });
          }
          
          // Group by date and count
          const dateGroups = {};
          allBarcodes.forEach(barcode => {
            const date = new Date(barcode.scan_time).toISOString().split('T')[0];
            dateGroups[date] = (dateGroups[date] || 0) + 1;
          });
          
          // Find highest count
          let maxCount = 0;
          let maxDate = '';
          Object.entries(dateGroups).forEach(([date, count]) => {
            if (count > maxCount) {
              maxCount = count;
              maxDate = date;
            }
          });
          
          return NextResponse.json({ count: maxCount, date: maxDate });
        } catch (error) {
          console.error('Error in highest-record:', error);
          return NextResponse.json({ count: 0, date: '' });
        }

      case 'date-count':
        if (!date) {
          return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
        }
        const { count: dateCount, error: dateError } = await supabase
          .from('barcode_scans')
          .select('*', { count: 'exact', head: true })
          .gte('scan_time', `${date}T00:00:00Z`)
          .lt('scan_time', `${date}T23:59:59Z`);
        
        if (dateError) {
          console.error('Error fetching date count:', dateError);
          return NextResponse.json({ error: 'Failed to fetch date count' }, { status: 500 });
        }
        return NextResponse.json({ count: dateCount || 0 });

      case 'range-count':
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Start and end date parameters required' }, { status: 400 });
        }
        const { count: rangeCount, error: rangeError } = await supabase
          .from('barcode_scans')
          .select('*', { count: 'exact', head: true })
          .gte('scan_time', `${startDate}T00:00:00Z`)
          .lt('scan_time', `${endDate}T23:59:59Z`);
        
        if (rangeError) {
          console.error('Error fetching range count:', rangeError);
          return NextResponse.json({ error: 'Failed to fetch range count' }, { status: 500 });
        }
        return NextResponse.json({ count: rangeCount || 0 });

      case 'recent':
        const recentLimit = limit ? parseInt(limit) : 10;
        const { data: recentBarcodes, error: recentError } = await supabase
          .from('barcode_scans')
          .select('id, barcode_data, scan_time')
          .order('scan_time', { ascending: false })
          .limit(recentLimit);
        
        if (recentError) {
          console.error('Error fetching recent barcodes:', recentError);
          return NextResponse.json({ error: 'Failed to fetch recent barcodes' }, { status: 500 });
        }
        
        // 转换字段名以保持兼容性
        const formattedBarcodes = recentBarcodes?.map(barcode => ({
          id: barcode.id,
          barcode: barcode.barcode_data,
          scannedAt: barcode.scan_time
        })) || [];
        
        return NextResponse.json(formattedBarcodes);

      default:
        const defaultLimit = limit ? parseInt(limit) : 50;
        const { data: allBarcodes, error: allError } = await supabase
          .from('barcode_scans')
          .select('*')
          .order('scan_time', { ascending: false })
          .limit(defaultLimit);
        
        if (allError) {
          console.error('Error fetching all barcodes:', allError);
          return NextResponse.json({ error: 'Failed to fetch barcodes' }, { status: 500 });
        }
        
        // 转换字段名以保持兼容性
        const formattedAllBarcodes = allBarcodes?.map(barcode => ({
          id: barcode.id,
          barcode: barcode.barcode_data,
          scannedAt: barcode.scan_time,
          device_port: barcode.device_port,
          status: barcode.status
        })) || [];
        
        return NextResponse.json(formattedAllBarcodes);
    }
  } catch (error) {
    console.error('Error fetching barcodes:', error);
    return NextResponse.json({ error: 'Failed to fetch barcodes' }, { status: 500 });
  }
}

// POST - 添加新条码
export async function POST(request) {
  try {
    const { barcode, device_id } = await request.json();

    // 验证条码格式
    if (!barcode || barcode.length < 1 || barcode.length > 100) {
      return NextResponse.json({ 
        error: 'Invalid barcode format. Must be 1-100 characters.' 
      }, { status: 400 });
    }

    // 创建新条码记录
    const { data: newBarcode, error: createError } = await supabase
      .from('barcode_scans')
      .insert({
        barcode_data: barcode,
        device_port: device_id || null,
        scan_time: new Date().toISOString(),
        status: '已切割' // 默认状态
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating barcode:', createError);
      return NextResponse.json({ error: 'Failed to create barcode' }, { status: 500 });
    }

    // 转换字段名以保持兼容性
    const formattedBarcode = {
      id: newBarcode.id,
      barcode: newBarcode.barcode_data,
      scannedAt: newBarcode.scan_time,
      device_port: newBarcode.device_port,
      status: newBarcode.status
    };

    return NextResponse.json(formattedBarcode, { status: 201 });
  } catch (error) {
    console.error('Error creating barcode:', error);
    return NextResponse.json({ error: 'Failed to create barcode' }, { status: 500 });
  }
}