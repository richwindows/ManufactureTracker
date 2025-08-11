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
        // 获取洛杉矶时区的今天日期
        const now = new Date();
        const losAngelesTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        
        const year = losAngelesTime.getFullYear();
        const month = String(losAngelesTime.getMonth() + 1).padStart(2, '0');
        const day = String(losAngelesTime.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const { count: todayCount, error: todayError } = await supabase
          .from('barcode_scans')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${todayStr}T00:00:00-08:00`)
          .lt('created_at', `${todayStr}T23:59:59-08:00`);
        
        if (todayError) {
          console.error('Error fetching today count:', todayError);
          return NextResponse.json({ error: 'Failed to fetch today count' }, { status: 500 });
        }
        return NextResponse.json({ count: todayCount || 0 });

      case 'today-list':
        // 获取洛杉矶时区的今天日期
        const nowForList = new Date();
        const losAngelesTimeForList = new Date(nowForList.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        
        const yearForList = losAngelesTimeForList.getFullYear();
        const monthForList = String(losAngelesTimeForList.getMonth() + 1).padStart(2, '0');
        const dayForList = String(losAngelesTimeForList.getDate()).padStart(2, '0');
        const todayStrForList = `${yearForList}-${monthForList}-${dayForList}`;
        
        const { data: todayBarcodes, error: todayListError } = await supabase
          .from('barcode_scans')
          .select('id, barcode_data, created_at, device_port, current_status')
          .gte('created_at', `${todayStrForList}T00:00:00-08:00`)
          .lt('created_at', `${todayStrForList}T23:59:59-08:00`)
          .order('created_at', { ascending: false });
        
        if (todayListError) {
          console.error('Error fetching today list:', todayListError);
          return NextResponse.json({ error: 'Failed to fetch today list' }, { status: 500 });
        }
        
        // 转换字段名以保持兼容性
        const formattedTodayBarcodes = todayBarcodes?.map(barcode => ({
          id: barcode.id,
          barcode: barcode.barcode_data,
          scannedAt: barcode.created_at,
          device_port: barcode.device_port,
          status: barcode.current_status
        })) || [];
        
        return NextResponse.json(formattedTodayBarcodes);

      case 'highest-record':
        try {
          // 手动查询所有记录并按日期分组
          const { data: allBarcodes, error: fallbackError } = await supabase
            .from('barcode_scans')
            .select('created_at');
          
          if (fallbackError) {
            console.error('Fallback query failed:', fallbackError);
            return NextResponse.json({ count: 0, date: '' });
          }
          
          // Group by date and count
          const dateGroups = {};
          allBarcodes.forEach(barcode => {
            const date = new Date(barcode.created_at).toISOString().split('T')[0];
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
          .gte('created_at', `${date}T00:00:00Z`)
          .lt('created_at', `${date}T23:59:59Z`);
        
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
          .gte('created_at', `${startDate}T00:00:00Z`)
          .lt('created_at', `${endDate}T23:59:59Z`);
        
        if (rangeError) {
          console.error('Error fetching range count:', rangeError);
          return NextResponse.json({ error: 'Failed to fetch range count' }, { status: 500 });
        }
        return NextResponse.json({ count: rangeCount || 0 });

      case 'recent':
        const recentLimit = limit ? parseInt(limit) : 10;
        const { data: recentBarcodes, error: recentError } = await supabase
          .from('barcode_scans')
          .select('id, barcode_data, created_at, current_status')
          .order('created_at', { ascending: false })
          .limit(recentLimit);
        
        if (recentError) {
          console.error('Error fetching recent barcodes:', recentError);
          return NextResponse.json({ error: 'Failed to fetch recent barcodes' }, { status: 500 });
        }
        
        // 转换字段名以保持兼容性
        const formattedBarcodes = recentBarcodes?.map(barcode => ({
          id: barcode.id,
          barcode: barcode.barcode_data,
          scannedAt: barcode.created_at,
          status: barcode.current_status
        })) || [];
        
        return NextResponse.json(formattedBarcodes);

      default:
        const defaultLimit = limit ? parseInt(limit) : 50;
        const { data: allBarcodes, error: allError } = await supabase
          .from('barcode_scans')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(defaultLimit);
        
        if (allError) {
          console.error('Error fetching all barcodes:', allError);
          return NextResponse.json({ error: 'Failed to fetch barcodes' }, { status: 500 });
        }
        
        // 转换字段名以保持兼容性
        const formattedAllBarcodes = allBarcodes?.map(barcode => ({
          id: barcode.id,
          barcode: barcode.barcode_data,
          scannedAt: barcode.created_at,
          device_port: barcode.device_port,
          status: barcode.current_status
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
    const { barcode, device_id, status } = await request.json();

    // 验证条码格式
    if (!barcode || barcode.length < 1 || barcode.length > 100) {
      return NextResponse.json({ 
        error: 'Invalid barcode format. Must be 1-100 characters.' 
      }, { status: 400 });
    }

    // 检查条码是否已存在
    const { data: existingBarcode, error: checkError } = await supabase
      .from('barcode_scans')
      .select('id')
      .eq('barcode_data', barcode)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing barcode:', checkError);
      return NextResponse.json({ error: 'Failed to check existing barcode' }, { status: 500 });
    }

    // 根据状态映射到对应的时间字段和布尔字段（使用正确的字段名）
    const statusMapping = {
      '已排产': { timeField: 'status_1_time', boolField: 'status_1_scheduled' },
      '已切割': { timeField: 'status_2_time', boolField: 'status_2_cut' }, 
      '已清角': { timeField: 'status_3_time', boolField: 'status_3_cleaned' },
      '已入库': { timeField: 'status_4_time', boolField: 'status_4_stored' },
      '部分出库': { timeField: 'status_5_time', boolField: 'status_5_partial_out' },
      '已出库': { timeField: 'status_6_time', boolField: 'status_6_shipped' }
    };

    const selectedStatus = status || '已切割'; // 默认状态
    const statusConfig = statusMapping[selectedStatus];
    const currentTime = new Date().toISOString();

    if (existingBarcode) {
      // 如果条码已存在，更新状态
      const updateData = {
        updated_at: currentTime
      };

      if (statusConfig) {
        updateData[statusConfig.timeField] = currentTime;
        updateData[statusConfig.boolField] = true;
      }

      const { data: updatedBarcode, error: updateError } = await supabase
        .from('barcode_scans')
        .update(updateData)
        .eq('id', existingBarcode.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating barcode:', updateError);
        return NextResponse.json({ error: 'Failed to update barcode' }, { status: 500 });
      }

      // 转换字段名以保持兼容性
      const formattedBarcode = {
        id: updatedBarcode.id,
        barcode: updatedBarcode.barcode_data,
        scannedAt: updatedBarcode.created_at,
        device_port: updatedBarcode.device_port,
        status: updatedBarcode.current_status || selectedStatus
      };

      return NextResponse.json(formattedBarcode, { status: 200 });
    } else {
      // 如果条码不存在，创建新记录
      const insertData = {
        barcode_data: barcode,
        device_port: device_id || null,
        created_at: currentTime,
        updated_at: currentTime
      };

      if (statusConfig) {
        insertData[statusConfig.timeField] = currentTime;
        insertData[statusConfig.boolField] = true;
      }

      const { data: newBarcode, error: createError } = await supabase
        .from('barcode_scans')
        .insert(insertData)
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
        scannedAt: newBarcode.created_at,
        device_port: newBarcode.device_port,
        status: newBarcode.current_status || selectedStatus
      };

      return NextResponse.json(formattedBarcode, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating barcode:', error);
    return NextResponse.json({ error: 'Failed to create barcode' }, { status: 500 });
  }
}