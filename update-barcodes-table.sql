-- 更新barcodes表以支持更长的条码和设备标识
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 删除现有的条码格式约束
ALTER TABLE barcodes DROP CONSTRAINT IF EXISTS check_barcode_format;

-- 2. 修改barcode字段类型以支持更长的条码
ALTER TABLE barcodes ALTER COLUMN barcode TYPE VARCHAR(50);

-- 3. 添加device_id字段用于标识扫码枪
ALTER TABLE barcodes ADD COLUMN IF NOT EXISTS device_id VARCHAR(10);

-- 4. 更新注释
COMMENT ON COLUMN barcodes.barcode IS '条码值，支持1-50字符';
COMMENT ON COLUMN barcodes.device_id IS '扫码枪设备标识，如1@, 2@, 3@';

-- 5. 创建新的索引
CREATE INDEX IF NOT EXISTS idx_barcodes_device_id ON barcodes(device_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode_device ON barcodes(barcode, device_id);

-- 6. 更新获取最高记录的函数以包含设备信息
CREATE OR REPLACE FUNCTION get_highest_barcode_record()
RETURNS TABLE(
    date DATE,
    count BIGINT,
    device_stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_counts AS (
        SELECT 
            DATE(scanned_at) as scan_date,
            COUNT(*) as total_count,
            JSONB_OBJECT_AGG(device_id, device_count) as device_breakdown
        FROM (
            SELECT 
                DATE(scanned_at) as scan_date,
                COALESCE(device_id, 'unknown') as device_id,
                COUNT(*) as device_count
            FROM barcodes 
            GROUP BY DATE(scanned_at), device_id
        ) device_daily
        GROUP BY DATE(scanned_at)
        ORDER BY total_count DESC
        LIMIT 1
    )
    SELECT 
        scan_date as date,
        total_count as count,
        device_breakdown as device_stats
    FROM daily_counts;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建按设备统计的函数
CREATE OR REPLACE FUNCTION get_device_scan_stats(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    device_id VARCHAR(10),
    scan_count BIGINT,
    first_scan TIMESTAMPTZ,
    last_scan TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(b.device_id, 'unknown')::VARCHAR(10) as device_id,
        COUNT(*)::BIGINT as scan_count,
        MIN(b.scanned_at) as first_scan,
        MAX(b.scanned_at) as last_scan
    FROM barcodes b
    WHERE 
        (start_date IS NULL OR DATE(b.scanned_at) >= start_date) AND
        (end_date IS NULL OR DATE(b.scanned_at) <= end_date)
    GROUP BY b.device_id
    ORDER BY scan_count DESC;
END;
$$ LANGUAGE plpgsql;

SELECT 'Barcodes table updated successfully! Now supports longer barcodes and device tracking.' as status;