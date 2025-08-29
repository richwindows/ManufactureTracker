-- 检查产品ID 53 批次号 08272025-03-12 是否存在
SELECT 
    id,
    customer,
    product_id,
    batch_no,
    barcode,
    status,
    scanned_at,
    created_at
FROM products 
WHERE product_id = '53' AND batch_no = '08272025-03-12';

-- 也检查一下是否有类似的记录
SELECT 
    id,
    customer,
    product_id,
    batch_no,
    barcode,
    status,
    scanned_at,
    created_at
FROM products 
WHERE product_id = '53' OR batch_no = '08272025-03-12'
ORDER BY created_at DESC
LIMIT 10;

-- 检查barcode_scans表中是否有相关扫描记录
SELECT 
    id,
    barcode_data,
    current_status,
    last_scan_time,
    device_port
FROM barcode_scans 
WHERE barcode_data LIKE '%Rich-082725-12-53%'
ORDER BY last_scan_time DESC
LIMIT 10;