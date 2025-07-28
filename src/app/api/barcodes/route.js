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
          .from('barcodes')
          .select('*', { count: 'exact', head: true })
          .gte('scanned_at', `${today}T00:00:00Z`)
          .lt('scanned_at', `${today}T23:59:59Z`);
        
        if (todayError) {
          console.error('Error fetching today count:', todayError);
          return NextResponse.json({ error: 'Failed to fetch today count' }, { status: 500 });
        }
        return NextResponse.json({ count: todayCount || 0 });

      case 'highest-record':
        try {
          const { data: records, error: recordError } = await supabase
            .rpc('get_highest_barcode_record');
          
          if (recordError) {
            console.error('Error in highest-record RPC:', recordError);
            // Fallback: get all records and group manually
            const { data: allBarcodes, error: fallbackError } = await supabase
              .from('barcodes')
              .select('scanned_at');
            
            if (fallbackError) {
              console.error('Fallback query failed:', fallbackError);
              return NextResponse.json({ count: 0, date: '' });
            }
            
            // Group by date and count
            const dateGroups = {};
            allBarcodes.forEach(barcode => {
              const date = new Date(barcode.scanned_at).toISOString().split('T')[0];
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
          }
          
          const record = records?.[0] || { count: 0, date: null };
          return NextResponse.json({ 
            count: Number(record.count) || 0, 
            date: record.date || '' 
          });
        } catch (error) {
          console.error('Error in highest-record:', error);
          return NextResponse.json({ count: 0, date: '' });
        }

      case 'date-count':
        if (!date) {
          return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
        }
        const { count: dateCount, error: dateError } = await supabase
          .from('barcodes')
          .select('*', { count: 'exact', head: true })
          .gte('scanned_at', `${date}T00:00:00Z`)
          .lt('scanned_at', `${date}T23:59:59Z`);
        
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
          .from('barcodes')
          .select('*', { count: 'exact', head: true })
          .gte('scanned_at', `${startDate}T00:00:00Z`)
          .lt('scanned_at', `${endDate}T23:59:59Z`);
        
        if (rangeError) {
          console.error('Error fetching range count:', rangeError);
          return NextResponse.json({ error: 'Failed to fetch range count' }, { status: 500 });
        }
        return NextResponse.json({ count: rangeCount || 0 });

      case 'recent':
        const recentLimit = limit ? parseInt(limit) : 10;
        const { data: recentBarcodes, error: recentError } = await supabase
          .from('barcodes')
          .select('id, barcode, scanned_at')
          .order('scanned_at', { ascending: false })
          .limit(recentLimit);
        
        if (recentError) {
          console.error('Error fetching recent barcodes:', recentError);
          return NextResponse.json({ error: 'Failed to fetch recent barcodes' }, { status: 500 });
        }
        
        // Convert scanned_at to scannedAt for consistency
        const formattedBarcodes = recentBarcodes?.map(barcode => ({
          ...barcode,
          scannedAt: barcode.scanned_at
        })) || [];
        
        return NextResponse.json(formattedBarcodes);

      default:
        const defaultLimit = limit ? parseInt(limit) : 50;
        const { data: allBarcodes, error: allError } = await supabase
          .from('barcodes')
          .select('*')
          .order('scanned_at', { ascending: false })
          .limit(defaultLimit);
        
        if (allError) {
          console.error('Error fetching all barcodes:', allError);
          return NextResponse.json({ error: 'Failed to fetch barcodes' }, { status: 500 });
        }
        
        // Convert scanned_at to scannedAt for consistency
        const formattedAllBarcodes = allBarcodes?.map(barcode => ({
          ...barcode,
          scannedAt: barcode.scanned_at
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

    // 验证条码格式（支持多种格式）
    if (!barcode || barcode.length < 1 || barcode.length > 50) {
      return NextResponse.json({ 
        error: 'Invalid barcode format. Must be 1-50 characters.' 
      }, { status: 400 });
    }

    // 检查条码是否已存在
    const { data: existingBarcode, error: checkError } = await supabase
      .from('barcodes')
      .select('id')
      .eq('barcode', barcode)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing barcode:', checkError);
      return NextResponse.json({ error: 'Failed to check barcode' }, { status: 500 });
    }

    if (existingBarcode) {
      return NextResponse.json({ 
        error: 'Barcode already exists in database.' 
      }, { status: 409 });
    }

    // 创建新条码记录
    const { data: newBarcode, error: createError } = await supabase
      .from('barcodes')
      .insert({
        barcode,
        device_id: device_id || null,
        scanned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating barcode:', createError);
      return NextResponse.json({ error: 'Failed to create barcode' }, { status: 500 });
    }

    // Convert scanned_at to scannedAt for consistency
    const formattedBarcode = {
      ...newBarcode,
      scannedAt: newBarcode.scanned_at
    };

    return NextResponse.json(formattedBarcode, { status: 201 });
  } catch (error) {
    console.error('Error creating barcode:', error);
    return NextResponse.json({ error: 'Failed to create barcode' }, { status: 500 });
  }
}