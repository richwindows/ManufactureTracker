-- 修复产品到条码扫描同步测试函数
-- 解决生成列错误：current_status和last_scan_time都是生成列，不能直接插入值
-- 实际的时间字段是scan_time

-- 创建测试产品到条码扫描同步的函数
CREATE OR REPLACE FUNCTION test_product_to_barcode_sync()
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
    -- 插入测试扫描记录（使用scan_time而不是last_scan_time）
    INSERT INTO barcode_scans (barcode_data, device_port, scan_time)
    VALUES ('DEVICE@' || test_barcode, 'DEVICE@', test_time - INTERVAL '1 hour');
    
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

-- 运行测试
SELECT test_product_to_barcode_sync() as sync_test_result;

-- 创建产品到条码扫描的反向同步触发器
CREATE OR REPLACE FUNCTION sync_barcode_scan_from_product()
RETURNS TRIGGER AS $$
DECLARE
    status_field TEXT;
    time_field TEXT;
BEGIN
    -- 只有当status和scanned_at都被更新时才执行同步
    IF (OLD.status IS DISTINCT FROM NEW.status AND OLD.scanned_at IS DISTINCT FROM NEW.scanned_at) THEN
        -- 根据新状态确定要更新的字段
        CASE NEW.status
            WHEN '已切割' THEN
                status_field := 'status_1_cut';
                time_field := 'status_1_time';
            WHEN '已入库' THEN
                status_field := 'status_2_stored';
                time_field := 'status_2_time';
            WHEN '已分拣' THEN
                status_field := 'status_3_sorted';
                time_field := 'status_3_time';
            WHEN '已包装' THEN
                status_field := 'status_4_packed';
                time_field := 'status_4_time';
            WHEN '部分出库' THEN
                status_field := 'status_5_partial';
                time_field := 'status_5_time';
            WHEN '已出库' THEN
                status_field := 'status_6_shipped';
                time_field := 'status_6_time';
            ELSE
                -- 如果状态不匹配，只更新scan_time（last_scan_time和current_status是生成列会自动更新）
                UPDATE barcode_scans
                SET
                    scan_time = NEW.scanned_at,
                    updated_at = NOW()
                WHERE barcode_data = 'DEVICE@' || NEW.barcode
                   OR barcode_data = NEW.barcode;
                RETURN NEW;
        END CASE;
        
        -- 使用动态SQL更新对应的状态字段（更新scan_time而不是last_scan_time）
        EXECUTE format('
            UPDATE barcode_scans
            SET
                %I = true,
                %I = $1,
                scan_time = $1,
                updated_at = NOW()
            WHERE barcode_data = $2 OR barcode_data = $3',
            status_field, time_field
        ) USING NEW.scanned_at, 'DEVICE@' || NEW.barcode, NEW.barcode;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_sync_barcode_scan_from_product ON products;
CREATE TRIGGER trigger_sync_barcode_scan_from_product
    AFTER UPDATE ON products
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND OLD.scanned_at IS DISTINCT FROM NEW.scanned_at)
    EXECUTE FUNCTION sync_barcode_scan_from_product();

-- 测试反向同步功能
SELECT '🎉 产品到条码扫描的反向同步触发器已创建完成！' as setup_status;