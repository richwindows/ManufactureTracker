-- 批量更新products表：根据barcode_scans表的数据更新产品的扫描时间和状态
-- 在Supabase SQL编辑器中运行此脚本
-- 根据用户界面显示的实际表结构：barcode_scans表包含barcode_data, device_port, scan_time, status字段

-- ========================================
-- 方法1：直接批量更新（推荐）
-- ========================================

-- 1. 更新products表的scanned_at和status字段
-- 根据barcode_scans表中的scan_time和status
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
  AND bs.rn = 1; -- 只使用每个条码的最新扫描记录

-- 显示更新结果
SELECT 
    COUNT(*) as updated_products_count,
    'products表已更新完成' as message
FROM products p
WHERE EXISTS (
    SELECT 1 FROM barcode_scans bs 
    WHERE SPLIT_PART(bs.barcode_data, '@', 2) = p.barcode
);

-- ========================================
-- 方法2：预览更新（调试用）
-- ========================================

-- 2. 预览将要更新的数据（不执行实际更新）
SELECT 
    p.barcode,
    p.status as current_status,
    p.scanned_at as current_scanned_at,
    bs.status as new_status,
    bs.scan_time as new_scanned_at,
    CASE 
        WHEN p.status != bs.status THEN '状态将更新'
        ELSE '状态无变化'
    END as status_change,
    CASE 
        WHEN p.scanned_at != bs.scan_time THEN '扫描时间将更新'
        ELSE '扫描时间无变化'
    END as time_change
FROM products p
JOIN (
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
) bs ON p.barcode = bs.clean_barcode AND bs.rn = 1
ORDER BY p.barcode;

-- ========================================
-- 方法3：安全的分步更新
-- ========================================

-- 3. 创建临时表存储更新数据
CREATE TEMP TABLE temp_product_updates AS
SELECT 
    p.id as product_id,
    p.barcode,
    bs.scan_time as new_scanned_at,
    bs.status as new_status
FROM products p
JOIN (
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
) bs ON p.barcode = bs.clean_barcode AND bs.rn = 1;

-- 4. 验证临时表数据
SELECT 
    COUNT(*) as total_updates,
    COUNT(DISTINCT barcode) as unique_barcodes,
    MIN(new_scanned_at) as earliest_scan,
    MAX(new_scanned_at) as latest_scan
FROM temp_product_updates;

-- 5. 执行更新
UPDATE products 
SET 
    scanned_at = tpu.new_scanned_at,
    status = tpu.new_status,
    updated_at = NOW()
FROM temp_product_updates tpu
WHERE products.id = tpu.product_id;

-- 6. 清理临时表
DROP TABLE temp_product_updates;

-- ========================================
-- 验证和统计
-- ========================================

-- 显示更新统计
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN scanned_at IS NOT NULL THEN 1 END) as products_with_scan_time,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as products_with_status,
    COUNT(DISTINCT status) as unique_statuses
FROM products;

-- 显示最近更新的产品
SELECT 
    barcode,
    status,
    scanned_at,
    updated_at
FROM products 
WHERE scanned_at IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- 显示状态分布
SELECT 
    status,
    COUNT(*) as count
FROM products 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY count DESC;