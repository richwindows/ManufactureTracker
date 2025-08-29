-- 检查条码 Rich-082725-12-53 在数据库中的存在情况
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 检查products表中是否存在该条码
SELECT 
    'products表查询结果:' as table_name,
    id,
    customer,
    product_id,
    batch_no,
    barcode,
    status,
    scanned_at,
    created_at,
    updated_at
FROM products 
WHERE barcode = 'Rich-082725-12-53'
ORDER BY created_at DESC;

-- 2. 检查products表中是否有类似的条码（模糊匹配）
SELECT 
    'products表模糊匹配结果:' as table_name,
    id,
    customer,
    product_id,
    batch_no,
    barcode,
    status,
    scanned_at,
    created_at
FROM products 
WHERE barcode LIKE '%082725-12-53%' OR barcode LIKE '%Rich-082725%'
ORDER BY created_at DESC
LIMIT 10;

-- 3. 检查barcode_scans表中是否有该条码的扫描记录
SELECT 
    'barcode_scans表查询结果:' as table_name,
    id,
    barcode_data,
    current_status,
    last_scan_time,
    device_port,
    created_at
FROM barcode_scans 
WHERE barcode_data = 'Rich-082725-12-53'
ORDER BY last_scan_time DESC;

-- 4. 检查barcode_scans表中是否有类似的扫描记录（包括设备前缀）
SELECT 
    'barcode_scans表模糊匹配结果:' as table_name,
    id,
    barcode_data,
    current_status,
    last_scan_time,
    device_port,
    created_at
FROM barcode_scans 
WHERE barcode_data LIKE '%Rich-082725-12-53%' 
   OR barcode_data LIKE '%082725-12-53%'
ORDER BY last_scan_time DESC
LIMIT 10;

-- 5. 统计信息
SELECT 
    'Rich-082725-12-53数据统计:' as summary,
    (
        SELECT COUNT(*) 
        FROM products 
        WHERE barcode = 'Rich-082725-12-53'
    ) as products_exact_match,
    (
        SELECT COUNT(*) 
        FROM products 
        WHERE barcode LIKE '%082725-12-53%'
    ) as products_fuzzy_match,
    (
        SELECT COUNT(*) 
        FROM barcode_scans 
        WHERE barcode_data = 'Rich-082725-12-53'
    ) as scans_exact_match,
    (
        SELECT COUNT(*) 
        FROM barcode_scans 
        WHERE barcode_data LIKE '%Rich-082725-12-53%'
    ) as scans_fuzzy_match;

-- 6. 如果存在数据，显示最新的匹配记录
WITH latest_product AS (
    SELECT *
    FROM products 
    WHERE barcode LIKE '%082725-12-53%'
    ORDER BY created_at DESC
    LIMIT 1
),
latest_scan AS (
    SELECT *
    FROM barcode_scans 
    WHERE barcode_data LIKE '%082725-12-53%'
    ORDER BY last_scan_time DESC
    LIMIT 1
)
SELECT 
    'Rich-082725-12-53最新记录对比:' as comparison,
    p.barcode as product_barcode,
    p.status as product_status,
    p.scanned_at as product_scanned_at,
    p.created_at as product_created_at,
    s.barcode_data as scan_barcode,
    s.current_status as scan_status,
    s.last_scan_time as scan_time,
    s.created_at as scan_created_at,
    CASE 
        WHEN p.barcode IS NOT NULL AND s.barcode_data IS NOT NULL THEN '产品和扫描都存在'
        WHEN p.barcode IS NOT NULL AND s.barcode_data IS NULL THEN '仅产品存在'
        WHEN p.barcode IS NULL AND s.barcode_data IS NOT NULL THEN '仅扫描存在'
        ELSE '都不存在'
    END as data_status
FROM latest_product p
FULL OUTER JOIN latest_scan s ON TRUE;