

-- First, create the trigger function
CREATE OR REPLACE FUNCTION sync_product_to_barcode_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only execute sync when status or scanned_at fields change
    IF (OLD.status IS DISTINCT FROM NEW.status OR OLD.scanned_at IS DISTINCT FROM NEW.scanned_at) THEN
        
        -- Update corresponding barcode record in barcode_scans table
        UPDATE barcode_scans 
        SET 
            -- Update status fields based on new status
            status_1_scheduled = CASE WHEN NEW.status = '已排产' THEN TRUE ELSE status_1_scheduled END,
            status_1_time = CASE WHEN NEW.status = '已排产' THEN NOW() ELSE status_1_time END,
            
            status_2_cut = CASE WHEN NEW.status = '已切割' THEN TRUE ELSE status_2_cut END,
            status_2_time = CASE WHEN NEW.status = '已切割' THEN NOW() ELSE status_2_time END,
            
            status_3_cleaned = CASE WHEN NEW.status = '已清角' THEN TRUE ELSE status_3_cleaned END,
            status_3_time = CASE WHEN NEW.status = '已清角' THEN NOW() ELSE status_3_time END,
            
            status_4_stored = CASE WHEN NEW.status = '已入库' THEN TRUE ELSE status_4_stored END,
            status_4_time = CASE WHEN NEW.status = '已入库' THEN NOW() ELSE status_4_time END,
            
            status_5_partial_out = CASE WHEN NEW.status = '部分出库' THEN TRUE ELSE status_5_partial_out END,
            status_5_time = CASE WHEN NEW.status = '部分出库' THEN NOW() ELSE status_5_time END,
            
            status_6_shipped = CASE WHEN NEW.status = '已出库' THEN TRUE ELSE status_6_shipped END,
            status_6_time = CASE WHEN NEW.status = '已出库' THEN NOW() ELSE status_6_time END,
            
            -- 只更新 updated_at，移除对生成列的更新
            -- current_status 和 last_scan_time 是生成列，会根据状态字段自动计算
            updated_at = NOW()
            
        WHERE barcode_data = NEW.barcode;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Then create the trigger
DROP TRIGGER IF EXISTS sync_product_to_barcode_status ON products;
CREATE TRIGGER sync_product_to_barcode_status
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_to_barcode_status();