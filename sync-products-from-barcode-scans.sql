-- 同步barcode_scans表的数据到products表
-- 根据条码匹配，更新products表的status和scanned_at字段
-- 在Supabase SQL编辑器中运行此脚本

-- ========================================
-- 方案1：直接批量更新（推荐）
-- ========================================

-- 1. 更新products表的status和scanned_at字段
-- 根据barcode_scans表中的current_status和last_scan_time
UPDATE products 
SET 
    status = bs.current_status,
    scanned_at = bs.last_scan_time,
    updated_at = NOW()
FROM (
    SELECT 
        barcode_data as barcode,
        current_status,
        last_scan_time,
        ROW_NUMBER() OVER (
            PARTITION BY barcode_data 
            ORDER BY last_scan_time DESC
        ) as rn
    FROM barcode_scans
    WHERE barcode_data IS NOT NULL 
      AND barcode_data != ''
) bs
WHERE products.barcode = bs.barcode
  AND bs.rn = 1; -- 只使用每个条码的最新扫描记录

-- ========================================
-- 方案2：预览将要更新的数据
-- ========================================

-- 2. 查看将要更新的数据预览
SELECT 
    p.id as product_id,
    p.barcode,
    p.status as current_product_status,
    p.scanned_at as current_product_scanned_at,
    bs.current_status as new_status,
    bs.last_scan_time as new_scanned_at,
    CASE 
        WHEN p.status != bs.current_status THEN '状态将更新'
        ELSE '状态无变化'
    END as status_change,
    CASE 
        WHEN p.scanned_at IS NULL OR p.scanned_at != bs.last_scan_time THEN '扫描时间将更新'
        ELSE '扫描时间无变化'
    END as time_change
FROM products p
JOIN (
    SELECT 
        barcode_data as barcode,
        current_status,
        last_scan_time,
        ROW_NUMBER() OVER (
            PARTITION BY barcode_data 
            ORDER BY last_scan_time DESC
        ) as rn
    FROM barcode_scans
    WHERE barcode_data IS NOT NULL 
      AND barcode_data != ''
) bs ON p.barcode = bs.barcode AND bs.rn = 1
ORDER BY p.id;

-- ========================================
-- 方案3：安全的分步更新
-- ========================================

-- 3. 创建临时表存储更新数据
CREATE TEMP TABLE temp_product_sync AS
SELECT 
    p.id as product_id,
    p.barcode,
    bs.last_scan_time as new_scanned_at,
    bs.current_status as new_status
FROM products p
JOIN (
    SELECT 
        barcode_data as barcode,
        current_status,
        last_scan_time,
        ROW_NUMBER() OVER (
            PARTITION BY barcode_data 
            ORDER BY last_scan_time DESC
        ) as rn
    FROM barcode_scans
    WHERE barcode_data IS NOT NULL 
      AND barcode_data != ''
) bs ON p.barcode = bs.barcode AND bs.rn = 1;

-- 4. 查看临时表数据统计
SELECT 
    COUNT(*) as total_products_to_update,
    COUNT(DISTINCT barcode) as unique_barcodes,
    MIN(new_scanned_at) as earliest_scan,
    MAX(new_scanned_at) as latest_scan
FROM temp_product_sync;

-- 5. 执行更新
UPDATE products 
SET 
    scanned_at = tps.new_scanned_at,
    status = tps.new_status,
    updated_at = NOW()
FROM temp_product_sync tps
WHERE products.id = tps.product_id;

-- ========================================
-- 验证更新结果
-- ========================================

-- 6. 验证更新结果
SELECT 
    '同步完成' as message,
    COUNT(*) as updated_products,
    COUNT(DISTINCT status) as unique_statuses,
    MIN(scanned_at) as earliest_scan_time,
    MAX(scanned_at) as latest_scan_time
FROM products 
WHERE scanned_at IS NOT NULL;

-- 7. 按状态统计更新后的产品
SELECT 
    status,
    COUNT(*) as product_count,
    MIN(scanned_at) as earliest_scan,
    MAX(scanned_at) as latest_scan
FROM products 
WHERE scanned_at IS NOT NULL
GROUP BY status
ORDER BY product_count DESC;

-- 8. 检查是否有未匹配的扫描记录
SELECT 
    bs.barcode_data,
    bs.current_status,
    bs.last_scan_time,
    COUNT(*) as scan_count
FROM barcode_scans bs
WHERE bs.barcode_data NOT IN (
    SELECT barcode FROM products WHERE barcode IS NOT NULL
)
GROUP BY bs.barcode_data, bs.current_status, bs.last_scan_time
ORDER BY bs.last_scan_time DESC;

-- ========================================
-- 清理临时表
-- ========================================

-- 9. 清理临时表
DROP TABLE IF EXISTS temp_product_sync;

SELECT '🎉 同步完成！barcode_scans表的数据已同步到products表。' as final_status;