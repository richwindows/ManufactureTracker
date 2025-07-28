-- 批量更新products表：根据barcodes表的数据更新产品的扫描时间和状态
-- 在Supabase SQL编辑器中运行此脚本
-- 注意：根据用户界面显示，实际表名可能是barcode_scans，请根据实际情况调整

-- ========================================
-- 方案1：直接批量更新（推荐）
-- ========================================

-- 1. 更新products表的scanned_at和status字段
-- 根据barcodes表中的scanned_at和status
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

-- ========================================
-- 方案2：逐步更新（用于调试）
-- ========================================

-- 2. 查看将要更新的数据预览
SELECT 
    p.id as product_id,
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
        WHEN p.scanned_at IS NULL OR p.scanned_at != bs.scan_time THEN '扫描时间将更新'
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
ORDER BY p.id;

-- ========================================
-- 方案3：安全的分步更新
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

-- 4. 查看临时表数据
SELECT 
    COUNT(*) as total_products_to_update,
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

-- ========================================
-- 验证更新结果
-- ========================================

-- 6. 验证更新结果
SELECT 
    '更新完成' as message,
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
    SPLIT_PART(barcode_data, '@', 2) as clean_barcode,
    COUNT(*) as scan_count,
    MAX(scan_time) as latest_scan
FROM barcode_scans
WHERE barcode_data LIKE '%@%'
  AND SPLIT_PART(barcode_data, '@', 2) NOT IN (
      SELECT barcode FROM products WHERE barcode IS NOT NULL
  )
GROUP BY SPLIT_PART(barcode_data, '@', 2)
ORDER BY scan_count DESC;

-- ========================================
-- 清理临时表
-- ========================================

-- 9. 清理临时表
DROP TABLE IF EXISTS temp_product_updates;

SELECT '🎉 批量更新完成！所有扫描记录的时间和状态已同步到products表。' as final_status;