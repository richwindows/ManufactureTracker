-- 测试批量更新功能
-- 在Supabase SQL编辑器中运行此脚本来验证更新功能

-- ========================================
-- 1. 查看当前数据状态
-- ========================================

-- 查看barcode_scans表的数据
SELECT 
    'barcode_scans表数据' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT SPLIT_PART(barcode_data, '@', 2)) as unique_barcodes,
    MIN(scan_time) as earliest_scan,
    MAX(scan_time) as latest_scan
FROM barcode_scans
WHERE barcode_data LIKE '%@%'

UNION ALL

-- 查看products表的数据
SELECT 
    'products表数据' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT barcode) as unique_barcodes,
    COUNT(CASE WHEN scanned_at IS NOT NULL THEN 1 END) as with_scan_time,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as with_status
FROM products;

-- ========================================
-- 2. 预览匹配的数据
-- ========================================

-- 显示可以匹配更新的产品
SELECT 
    p.barcode,
    p.status as current_status,
    p.scanned_at as current_scan_time,
    bs.status as scan_status,
    bs.scan_time as scan_time,
    bs.device_port
FROM products p
JOIN (
    SELECT 
        SPLIT_PART(barcode_data, '@', 2) as clean_barcode,
        scan_time,
        status,
        device_port,
        ROW_NUMBER() OVER (
            PARTITION BY SPLIT_PART(barcode_data, '@', 2) 
            ORDER BY scan_time DESC
        ) as rn
    FROM barcode_scans
    WHERE barcode_data LIKE '%@%'
) bs ON p.barcode = bs.clean_barcode AND bs.rn = 1
ORDER BY bs.scan_time DESC
LIMIT 10;

-- ========================================
-- 3. 执行批量更新
-- ========================================

-- 更新products表
UPDATE products 
SET 
    scanned_at = bs.scan_time,
    status = bs.status,
    updated_at = NOW()
FROM (
    SELECT 
        SPLIT_PART(barcode_data, '@', 2) as clean_barcode,
        scan_time,
        status,
        ROW_NUMBER() OVER (
            PARTITION BY SPLIT_PART(barcode_data, '@', 2) 
            ORDER BY scan_time DESC
        ) as rn
    FROM barcode_scans
    WHERE barcode_data LIKE '%@%'
) bs
WHERE products.barcode = bs.clean_barcode
  AND bs.rn = 1;

-- ========================================
-- 4. 验证更新结果
-- ========================================

-- 显示更新后的统计
SELECT 
    '更新完成统计' as info,
    COUNT(*) as total_products,
    COUNT(CASE WHEN scanned_at IS NOT NULL THEN 1 END) as products_with_scan_time,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as products_with_status
FROM products;

-- 显示最近更新的产品
SELECT 
    '最近更新的产品' as info,
    barcode,
    status,
    scanned_at,
    updated_at
FROM products 
WHERE updated_at > NOW() - INTERVAL '1 minute'
ORDER BY updated_at DESC;

-- 显示状态分布
SELECT 
    '状态分布' as info,
    status,
    COUNT(*) as count
FROM products 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY count DESC;