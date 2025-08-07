-- 自动同步barcode_scans表的数据到products表
-- 创建触发器实现实时自动同步
-- 在Supabase SQL编辑器中运行此脚本

-- ========================================
-- 方案1：数据库触发器（实时双向同步）
-- ========================================

-- 1. 创建从barcode_scans同步到products的函数
CREATE OR REPLACE FUNCTION sync_product_from_barcode_scan()
RETURNS TRIGGER AS $$
DECLARE
    clean_barcode TEXT;
BEGIN
    -- 提取干净的条码（去掉设备前缀）
    clean_barcode := CASE 
        WHEN NEW.barcode_data LIKE '%@%' THEN SPLIT_PART(NEW.barcode_data, '@', 2)
        ELSE NEW.barcode_data
    END;
    
    -- 当barcode_scans表有新增或更新时，自动更新对应的products记录
    UPDATE products 
    SET 
        status = NEW.current_status,
        scanned_at = NEW.last_scan_time,
        updated_at = NOW()
    WHERE barcode = clean_barcode
      AND clean_barcode IS NOT NULL 
      AND clean_barcode != '';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建从products检查barcode_scans的函数
CREATE OR REPLACE FUNCTION check_scan_data_for_new_product()
RETURNS TRIGGER AS $$
DECLARE
    latest_scan_record RECORD;
BEGIN
    -- 当products表有新增时，检查是否有对应的扫描记录
    SELECT 
        current_status,
        last_scan_time
    INTO latest_scan_record
    FROM barcode_scans
    WHERE (barcode_data = NEW.barcode OR SPLIT_PART(barcode_data, '@', 2) = NEW.barcode)
      AND NEW.barcode IS NOT NULL 
      AND NEW.barcode != ''
    ORDER BY last_scan_time DESC
    LIMIT 1;
    
    -- 如果找到扫描记录，更新产品状态
    IF latest_scan_record IS NOT NULL THEN
        UPDATE products 
        SET 
            status = latest_scan_record.current_status,
            scanned_at = latest_scan_record.last_scan_time,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建barcode_scans表的触发器（INSERT时触发）
DROP TRIGGER IF EXISTS trigger_sync_product_on_scan_insert ON barcode_scans;
CREATE TRIGGER trigger_sync_product_on_scan_insert
    AFTER INSERT ON barcode_scans
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_from_barcode_scan();

-- 4. 创建barcode_scans表的触发器（UPDATE时触发）
DROP TRIGGER IF EXISTS trigger_sync_product_on_scan_update ON barcode_scans;
CREATE TRIGGER trigger_sync_product_on_scan_update
    AFTER UPDATE ON barcode_scans
    FOR EACH ROW
    WHEN (OLD.current_status IS DISTINCT FROM NEW.current_status 
          OR OLD.last_scan_time IS DISTINCT FROM NEW.last_scan_time)
    EXECUTE FUNCTION sync_product_from_barcode_scan();

-- 5. 创建products表的触发器（INSERT时触发）
DROP TRIGGER IF EXISTS trigger_check_scan_on_product_insert ON products;
CREATE TRIGGER trigger_check_scan_on_product_insert
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_scan_data_for_new_product();

-- ========================================
-- 方案2：定时任务函数（定期批量同步）
-- ========================================

-- 6. 创建批量同步函数（从barcode_scans到products）
CREATE OR REPLACE FUNCTION batch_sync_products_from_scans()
RETURNS TEXT AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- 批量更新products表
    UPDATE products 
    SET 
        status = bs.current_status,
        scanned_at = bs.last_scan_time,
        updated_at = NOW()
    FROM (
        SELECT 
            CASE 
                WHEN barcode_data LIKE '%@%' THEN SPLIT_PART(barcode_data, '@', 2)
                ELSE barcode_data
            END as clean_barcode,
            current_status,
            last_scan_time,
            ROW_NUMBER() OVER (
                PARTITION BY CASE 
                    WHEN barcode_data LIKE '%@%' THEN SPLIT_PART(barcode_data, '@', 2)
                    ELSE barcode_data
                END
                ORDER BY last_scan_time DESC
            ) as rn
        FROM barcode_scans
        WHERE barcode_data IS NOT NULL 
          AND barcode_data != ''
    ) bs
    WHERE products.barcode = bs.clean_barcode
      AND bs.rn = 1
      AND (products.status != bs.current_status 
           OR products.scanned_at != bs.last_scan_time
           OR products.scanned_at IS NULL);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN '批量同步完成，更新了 ' || updated_count || ' 条产品记录';
END;
$$ LANGUAGE plpgsql;

-- 7. 创建反向批量同步函数（为新产品查找扫描记录）
CREATE OR REPLACE FUNCTION batch_sync_new_products_with_scans()
RETURNS TEXT AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- 为没有扫描时间的产品查找最新扫描记录
    UPDATE products 
    SET 
        status = bs.current_status,
        scanned_at = bs.last_scan_time,
        updated_at = NOW()
    FROM (
        SELECT 
            CASE 
                WHEN barcode_data LIKE '%@%' THEN SPLIT_PART(barcode_data, '@', 2)
                ELSE barcode_data
            END as clean_barcode,
            current_status,
            last_scan_time,
            ROW_NUMBER() OVER (
                PARTITION BY CASE 
                    WHEN barcode_data LIKE '%@%' THEN SPLIT_PART(barcode_data, '@', 2)
                    ELSE barcode_data
                END
                ORDER BY last_scan_time DESC
            ) as rn
        FROM barcode_scans
        WHERE barcode_data IS NOT NULL 
          AND barcode_data != ''
    ) bs
    WHERE products.barcode = bs.clean_barcode
      AND bs.rn = 1
      AND (products.scanned_at IS NULL 
           OR products.status = 'scheduled');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN '新产品同步完成，更新了 ' || updated_count || ' 条产品记录';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 方案3：完整双向同步函数
-- ========================================

-- 8. 创建完整的双向同步函数
CREATE OR REPLACE FUNCTION full_bidirectional_sync()
RETURNS TEXT AS $$
DECLARE
    scan_to_product_count INTEGER;
    product_to_scan_count INTEGER;
    result_text TEXT;
BEGIN
    -- 第一步：从barcode_scans同步到products
    SELECT batch_sync_products_from_scans() INTO result_text;
    scan_to_product_count := CAST(regexp_replace(result_text, '[^0-9]', '', 'g') AS INTEGER);
    
    -- 第二步：为新产品查找扫描记录
    SELECT batch_sync_new_products_with_scans() INTO result_text;
    product_to_scan_count := CAST(regexp_replace(result_text, '[^0-9]', '', 'g') AS INTEGER);
    
    RETURN '完整双向同步完成！' || 
           '从扫描记录更新产品：' || scan_to_product_count || ' 条，' ||
           '为新产品匹配扫描记录：' || product_to_scan_count || ' 条';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 方案4：手动调用批量同步
-- ========================================

-- 9. 执行一次性完整双向同步
SELECT full_bidirectional_sync() as sync_result;

-- ========================================
-- 管理和监控
-- ========================================

-- 10. 查看触发器状态
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%sync_product%' 
   OR trigger_name LIKE '%check_scan%';

-- 11. 查看同步状态统计
CREATE OR REPLACE FUNCTION get_sync_status()
RETURNS TABLE(
    total_products BIGINT,
    products_with_scans BIGINT,
    products_without_scans BIGINT,
    total_scans BIGINT,
    scans_with_products BIGINT,
    scans_without_products BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM products WHERE scanned_at IS NOT NULL) as products_with_scans,
        (SELECT COUNT(*) FROM products WHERE scanned_at IS NULL) as products_without_scans,
        (SELECT COUNT(*) FROM barcode_scans) as total_scans,
        (SELECT COUNT(DISTINCT 
            CASE 
                WHEN bs.barcode_data LIKE '%@%' THEN SPLIT_PART(bs.barcode_data, '@', 2)
                ELSE bs.barcode_data
            END
        ) 
         FROM barcode_scans bs 
         INNER JOIN products p ON p.barcode = CASE 
            WHEN bs.barcode_data LIKE '%@%' THEN SPLIT_PART(bs.barcode_data, '@', 2)
            ELSE bs.barcode_data
         END) as scans_with_products,
        (SELECT COUNT(DISTINCT 
            CASE 
                WHEN bs.barcode_data LIKE '%@%' THEN SPLIT_PART(bs.barcode_data, '@', 2)
                ELSE bs.barcode_data
            END
        ) 
         FROM barcode_scans bs 
         LEFT JOIN products p ON p.barcode = CASE 
            WHEN bs.barcode_data LIKE '%@%' THEN SPLIT_PART(bs.barcode_data, '@', 2)
            ELSE bs.barcode_data
         END
         WHERE p.barcode IS NULL) as scans_without_products;
END;
$$ LANGUAGE plpgsql;

-- 12. 查看当前同步状态
SELECT * FROM get_sync_status();

-- ========================================
-- 测试触发器功能
-- ========================================

-- 13. 测试触发器是否工作
CREATE OR REPLACE FUNCTION test_trigger_functionality()
RETURNS TEXT AS $$
DECLARE
    test_barcode TEXT := 'TEST_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    result_text TEXT;
BEGIN
    -- 插入测试产品
    INSERT INTO products (barcode, batch_no, status) 
    VALUES (test_barcode, 'TEST_BATCH', 'scheduled');
    
    -- 插入测试扫描记录
    INSERT INTO barcode_scans (barcode_data, current_status, last_scan_time) 
    VALUES ('DEVICE@' || test_barcode, '已入库', NOW());
    
    -- 检查是否同步成功
    SELECT 
        CASE 
            WHEN status = '已入库' AND scanned_at IS NOT NULL 
            THEN '✅ 触发器工作正常！产品状态已同步为：' || status
            ELSE '❌ 触发器未工作，产品状态仍为：' || COALESCE(status, 'NULL')
        END
    INTO result_text
    FROM products 
    WHERE barcode = test_barcode;
    
    -- 清理测试数据
    DELETE FROM products WHERE barcode = test_barcode;
    DELETE FROM barcode_scans WHERE barcode_data = 'DEVICE@' || test_barcode;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- 14. 运行触发器测试
SELECT test_trigger_functionality() as test_result;

-- ========================================
-- 触发器管理（可选）
-- ========================================

-- 15. 禁用所有触发器（如果需要）
-- ALTER TABLE barcode_scans DISABLE TRIGGER trigger_sync_product_on_scan_insert;
-- ALTER TABLE barcode_scans DISABLE TRIGGER trigger_sync_product_on_scan_update;
-- ALTER TABLE products DISABLE TRIGGER trigger_check_scan_on_product_insert;

-- 16. 启用所有触发器（如果需要）
-- ALTER TABLE barcode_scans ENABLE TRIGGER trigger_sync_product_on_scan_insert;
-- ALTER TABLE barcode_scans ENABLE TRIGGER trigger_sync_product_on_scan_update;
-- ALTER TABLE products ENABLE TRIGGER trigger_check_scan_on_product_insert;

-- 17. 删除所有触发器（如果需要完全移除）
-- DROP TRIGGER IF EXISTS trigger_sync_product_on_scan_insert ON barcode_scans;
-- DROP TRIGGER IF EXISTS trigger_sync_product_on_scan_update ON barcode_scans;
-- DROP TRIGGER IF EXISTS trigger_check_scan_on_product_insert ON products;
-- DROP FUNCTION IF EXISTS sync_product_from_barcode_scan();
-- DROP FUNCTION IF EXISTS check_scan_data_for_new_product();

SELECT '🎉 完整双向自动同步系统已设置完成！字段名已正确修正！' as setup_status;