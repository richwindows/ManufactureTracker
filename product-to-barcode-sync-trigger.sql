-- 产品表到条码扫描表的同步触发器
-- 当products表的status和scanned_at同时变动时，同步更新barcode_scans表

-- 1. 创建同步函数：从products表同步到barcode_scans表
CREATE OR REPLACE FUNCTION sync_barcode_scans_from_product_update()
RETURNS TRIGGER AS $$
DECLARE
    status_field TEXT;
    time_field TEXT;
    sync_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 检查是否同时更新了status和scanned_at
    IF (OLD.status IS DISTINCT FROM NEW.status) AND (OLD.scanned_at IS DISTINCT FROM NEW.scanned_at) THEN
        
        -- 如果条码为空，直接返回
        IF NEW.barcode IS NULL OR NEW.barcode = '' THEN
            RETURN NEW;
        END IF;
        
        -- 使用scanned_at作为同步时间
        sync_time := NEW.scanned_at;
        
        -- 根据新状态确定要更新的字段
        CASE NEW.status
            WHEN 'scheduled', '已排产' THEN
                status_field := 'status_1_scheduled';
                time_field := 'status_1_time';
            WHEN '已切割' THEN
                status_field := 'status_2_cut';
                time_field := 'status_2_time';
            WHEN '已清角' THEN
                status_field := 'status_3_cleaned';
                time_field := 'status_3_time';
            WHEN '已入库' THEN
                status_field := 'status_4_stored';
                time_field := 'status_4_time';
            WHEN '部分出库' THEN
                status_field := 'status_5_partial_out';
                time_field := 'status_5_time';
            WHEN '已出库' THEN
                status_field := 'status_6_shipped';
                time_field := 'status_6_time';
            ELSE
                -- 未知状态，不进行同步
                RAISE NOTICE '未知状态，跳过同步: %', NEW.status;
                RETURN NEW;
        END CASE;
        
        -- 使用动态SQL更新barcode_scans表的状态字段和时间字段
        EXECUTE format('
            UPDATE barcode_scans 
            SET 
                %I = true,
                %I = $1,
                current_status = $2,
                last_scan_time = $3,
                updated_at = NOW()
            WHERE (barcode_data = $4 OR SPLIT_PART(barcode_data, ''@'', 2) = $4)
              AND $4 IS NOT NULL 
              AND $4 != ''''
        ', status_field, time_field)
        USING sync_time, NEW.status, sync_time, NEW.barcode;
        
        -- 记录同步日志
        RAISE NOTICE '产品状态同步完成: 条码=%, 状态=%, 时间=%', NEW.barcode, NEW.status, sync_time;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建products表的UPDATE触发器
DROP TRIGGER IF EXISTS trigger_sync_barcode_scans_on_product_update ON products;
CREATE TRIGGER trigger_sync_barcode_scans_on_product_update
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION sync_barcode_scans_from_product_update();

-- 3. 创建测试函数
CREATE OR REPLACE FUNCTION test_product_barcode_sync()
RETURNS TEXT AS $$
DECLARE
    test_barcode TEXT := 'SYNC_TEST_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    test_time TIMESTAMP WITH TIME ZONE := NOW();
    result_text TEXT;
    scan_status BOOLEAN;
    scan_time TIMESTAMP WITH TIME ZONE;
    current_status_value TEXT;
    last_scan_time_value TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 插入测试扫描记录
    INSERT INTO barcode_scans (barcode_data, current_status, last_scan_time) 
    VALUES ('DEVICE@' || test_barcode, '已排产', test_time - INTERVAL '1 hour');
    
    -- 插入测试产品
    INSERT INTO products (barcode, batch_no, status, scanned_at, customer, product_id, style, size, frame, glass) 
    VALUES (test_barcode, 'SYNC_TEST_BATCH', 'scheduled', test_time - INTERVAL '1 hour', 'TEST_CUSTOMER', 'TEST_PRODUCT', 'TEST_STYLE', 'TEST_SIZE', 'TEST_FRAME', 'TEST_GLASS');
    
    -- 同时更新产品的status和scanned_at（触发同步）
    UPDATE products 
    SET 
        status = '已出库',
        scanned_at = test_time
    WHERE barcode = test_barcode;
    
    -- 等待触发器执行
    PERFORM pg_sleep(0.1);
    
    -- 检查barcode_scans是否被同步更新
    SELECT 
        status_6_shipped, 
        status_6_time,
        current_status,
        last_scan_time
    INTO 
        scan_status, 
        scan_time,
        current_status_value,
        last_scan_time_value
    FROM barcode_scans 
    WHERE barcode_data = 'DEVICE@' || test_barcode;
    
    -- 生成结果
    IF scan_status = true AND scan_time IS NOT NULL AND current_status_value = '已出库' AND last_scan_time_value = test_time THEN
        result_text := '✅ 同步触发器工作正常！' || CHR(10) ||
                      '- 状态字段已更新: status_6_shipped = true' || CHR(10) ||
                      '- 时间字段已更新: status_6_time = ' || scan_time::TEXT || CHR(10) ||
                      '- current_status已更新: ' || current_status_value || CHR(10) ||
                      '- last_scan_time已更新: ' || last_scan_time_value::TEXT;
    ELSE
        result_text := '❌ 同步触发器未正常工作！' || CHR(10) ||
                      '- status_6_shipped: ' || COALESCE(scan_status::TEXT, 'NULL') || CHR(10) ||
                      '- status_6_time: ' || COALESCE(scan_time::TEXT, 'NULL') || CHR(10) ||
                      '- current_status: ' || COALESCE(current_status_value, 'NULL') || CHR(10) ||
                      '- last_scan_time: ' || COALESCE(last_scan_time_value::TEXT, 'NULL');
    END IF;
    
    -- 清理测试数据
    DELETE FROM products WHERE barcode = test_barcode;
    DELETE FROM barcode_scans WHERE barcode_data = 'DEVICE@' || test_barcode;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建批量同步函数（用于同步现有数据）
CREATE OR REPLACE FUNCTION batch_sync_existing_products_to_barcode_scans()
RETURNS TEXT AS $$
DECLARE
    updated_count INTEGER := 0;
    product_record RECORD;
    status_field TEXT;
    time_field TEXT;
BEGIN
    -- 遍历所有有条码且有扫描时间的产品
    FOR product_record IN 
        SELECT id, barcode, status, scanned_at, updated_at
        FROM products 
        WHERE barcode IS NOT NULL 
          AND barcode != ''
          AND scanned_at IS NOT NULL
    LOOP
        -- 根据状态确定要更新的字段
        CASE product_record.status
            WHEN 'scheduled', '已排产' THEN
                status_field := 'status_1_scheduled';
                time_field := 'status_1_time';
            WHEN '已切割' THEN
                status_field := 'status_2_cut';
                time_field := 'status_2_time';
            WHEN '已清角' THEN
                status_field := 'status_3_cleaned';
                time_field := 'status_3_time';
            WHEN '已入库' THEN
                status_field := 'status_4_stored';
                time_field := 'status_4_time';
            WHEN '部分出库' THEN
                status_field := 'status_5_partial_out';
                time_field := 'status_5_time';
            WHEN '已出库' THEN
                status_field := 'status_6_shipped';
                time_field := 'status_6_time';
            ELSE
                -- 跳过未知状态
                CONTINUE;
        END CASE;
        
        -- 使用动态SQL更新barcode_scans表
        EXECUTE format('
            UPDATE barcode_scans 
            SET 
                %I = true,
                %I = $1,
                current_status = $2,
                last_scan_time = $3,
                updated_at = NOW()
            WHERE (barcode_data = $4 OR SPLIT_PART(barcode_data, ''@'', 2) = $4)
        ', status_field, time_field)
        USING 
            product_record.scanned_at,
            product_record.status,
            product_record.scanned_at,
            product_record.barcode;
        
        -- 检查是否有记录被更新
        IF FOUND THEN
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN '批量同步完成，更新了 ' || updated_count || ' 个产品对应的扫码记录';
END;
$$ LANGUAGE plpgsql;

-- 5. 查看触发器状态
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%sync%barcode%' 
   OR trigger_name LIKE '%product%'
ORDER BY event_object_table, trigger_name;

-- 6. 运行测试
SELECT test_product_barcode_sync() as test_result;

-- 7. 执行一次性批量同步（可选）
-- SELECT batch_sync_existing_products_to_barcode_scans() as batch_result;

SELECT '🎉 产品到条码扫描记录的同步触发器已创建完成！' || CHR(10) ||
       '当products表的status和scanned_at同时更新时，会自动同步更新barcode_scans表的：' || CHR(10) ||
       '- 对应的状态字段（如status_6_shipped）' || CHR(10) ||
       '- 对应的时间字段（如status_6_time）' || CHR(10) ||
       '- current_status字段' || CHR(10) ||
       '- last_scan_time字段' as setup_complete;