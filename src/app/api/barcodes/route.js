import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

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
        const todayCount = await db.barcode.count({
          where: {
            scannedAt: {
              gte: new Date(`${today}T00:00:00Z`),
              lt: new Date(`${today}T23:59:59Z`)
            }
          }
        });
        return NextResponse.json({ count: todayCount });

      case 'highest-record':
        const records = await db.$queryRaw`
          SELECT DATE(scanned_at) as date, COUNT(*) as count 
          FROM barcodes 
          GROUP BY DATE(scanned_at) 
          ORDER BY count DESC 
          LIMIT 1
        `;
        const record = records[0] || { count: 0, date: null };
        return NextResponse.json({ 
          count: Number(record.count), 
          date: record.date ? record.date.toISOString().split('T')[0] : '' 
        });

      case 'date-count':
        if (!date) {
          return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
        }
        const dateCount = await db.barcode.count({
          where: {
            scannedAt: {
              gte: new Date(`${date}T00:00:00Z`),
              lt: new Date(`${date}T23:59:59Z`)
            }
          }
        });
        return NextResponse.json({ count: dateCount });

      case 'range-count':
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Start and end date parameters required' }, { status: 400 });
        }
        const rangeCount = await db.barcode.count({
          where: {
            scannedAt: {
              gte: new Date(`${startDate}T00:00:00Z`),
              lt: new Date(`${endDate}T23:59:59Z`)
            }
          }
        });
        return NextResponse.json({ count: rangeCount });

      case 'recent':
        const recentLimit = limit ? parseInt(limit) : 10;
        const recentBarcodes = await db.barcode.findMany({
          orderBy: { scannedAt: 'desc' },
          take: recentLimit,
          select: {
            id: true,
            barcode: true,
            scannedAt: true
          }
        });
        return NextResponse.json(recentBarcodes);

      default:
        const allBarcodes = await db.barcode.findMany({
          orderBy: { scannedAt: 'desc' },
          take: limit ? parseInt(limit) : 50
        });
        return NextResponse.json(allBarcodes);
    }
  } catch (error) {
    console.error('Error fetching barcodes:', error);
    return NextResponse.json({ error: 'Failed to fetch barcodes' }, { status: 500 });
  }
}

// POST - 添加新条码
export async function POST(request) {
  try {
    const { barcode } = await request.json();

    // 验证条码格式（4位数字）
    const pattern = /^\d{4}$/;
    if (!pattern.test(barcode)) {
      return NextResponse.json({ 
        error: 'Invalid barcode format. Must be 4 digits.' 
      }, { status: 400 });
    }

    // 检查条码是否已存在
    const existingBarcode = await db.barcode.findUnique({
      where: { barcode }
    });

    if (existingBarcode) {
      return NextResponse.json({ 
        error: 'Barcode already exists in database.' 
      }, { status: 409 });
    }

    // 创建新条码记录
    const newBarcode = await db.barcode.create({
      data: {
        barcode,
        scannedAt: new Date()
      }
    });

    return NextResponse.json(newBarcode, { status: 201 });
  } catch (error) {
    console.error('Error creating barcode:', error);
    return NextResponse.json({ error: 'Failed to create barcode' }, { status: 500 });
  }
}