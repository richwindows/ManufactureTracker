-- Create barcodes table in Supabase
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS barcodes (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(4) UNIQUE NOT NULL, -- 4位数字条码
    scanned_at TIMESTAMPTZ DEFAULT NOW(), -- 扫描时间
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode ON barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_barcodes_scanned_at ON barcodes(scanned_at);
CREATE INDEX IF NOT EXISTS idx_barcodes_created_at ON barcodes(created_at);

-- 添加约束确保条码格式正确（4位数字）
ALTER TABLE barcodes ADD CONSTRAINT check_barcode_format 
    CHECK (barcode ~ '^\d{4}$');

COMMENT ON TABLE barcodes IS '条码扫描记录表';
COMMENT ON COLUMN barcodes.barcode IS '4位数字条码';
COMMENT ON COLUMN barcodes.scanned_at IS '扫描时间';
COMMENT ON COLUMN barcodes.created_at IS '创建时间';

-- 创建获取最高记录的函数
CREATE OR REPLACE FUNCTION get_highest_barcode_record()
RETURNS TABLE(
    date DATE,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(scanned_at) as date,
        COUNT(*) as count
    FROM barcodes 
    GROUP BY DATE(scanned_at) 
    ORDER BY count DESC 
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;