-- Fix barcodes table to match API expectations
-- Run this in Supabase SQL Editor

-- 1. Drop existing table if it exists (to start fresh)
DROP TABLE IF EXISTS barcodes CASCADE;

-- 2. Create barcodes table with correct field names
CREATE TABLE barcodes (
    id SERIAL PRIMARY KEY,
    barcode_data VARCHAR(100) NOT NULL, -- 条码数据，支持设备前缀格式如 "1@Rich-07212025-01"
    device_id VARCHAR(10), -- 设备标识，如 "1", "2", "3"
    scanned_at TIMESTAMPTZ DEFAULT NOW(), -- 扫描时间
    created_at TIMESTAMPTZ DEFAULT NOW() -- 创建时间
);

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode_data ON barcodes(barcode_data);
CREATE INDEX IF NOT EXISTS idx_barcodes_device_id ON barcodes(device_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_scanned_at ON barcodes(scanned_at);
CREATE INDEX IF NOT EXISTS idx_barcodes_created_at ON barcodes(created_at);
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode_device ON barcodes(barcode_data, device_id);

-- 4. 添加表和字段注释
COMMENT ON TABLE barcodes IS '条码扫描记录表';
COMMENT ON COLUMN barcodes.barcode_data IS '条码数据，支持设备前缀格式';
COMMENT ON COLUMN barcodes.device_id IS '扫码枪设备标识，如1, 2, 3';
COMMENT ON COLUMN barcodes.scanned_at IS '扫描时间';
COMMENT ON COLUMN barcodes.created_at IS '创建时间';

-- 5. 插入一些测试数据
INSERT INTO barcodes (barcode_data, device_id, scanned_at) VALUES
('1@Rich-07212025-01', '1', NOW() - INTERVAL '2 hours'),
('1@Rich-07212025-02', '1', NOW() - INTERVAL '1 hour 30 minutes'),
('2@Rich-07212025-01', '2', NOW() - INTERVAL '1 hour'),
('2@Rich-07212025-03', '2', NOW() - INTERVAL '30 minutes'),
('3@Rich-07212025-01', '3', NOW() - INTERVAL '15 minutes'),
('3@Rich-07212025-04', '3', NOW() - INTERVAL '5 minutes');

-- 6. 创建获取最高记录的函数
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

SELECT 'Barcodes table created successfully with correct field names (barcode_data, device_id)!' as status;