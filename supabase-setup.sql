-- Supabase 完整设置脚本
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 自动更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. 为 products 表创建或更新触发器
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. 产品统计函数
CREATE OR REPLACE FUNCTION get_product_stats(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    total_products BIGINT,
    by_status JSONB,
    by_date JSONB
) AS $$
DECLARE
    date_filter_start TIMESTAMPTZ;
    date_filter_end TIMESTAMPTZ;
BEGIN
    -- 设置日期过滤器
    IF start_date IS NOT NULL THEN
        date_filter_start := start_date::TIMESTAMPTZ;
    ELSE
        date_filter_start := '-infinity'::TIMESTAMPTZ;
    END IF;
    
    IF end_date IS NOT NULL THEN
        date_filter_end := (end_date + INTERVAL '1 day')::TIMESTAMPTZ;
    ELSE
        date_filter_end := 'infinity'::TIMESTAMPTZ;
    END IF;

    RETURN QUERY
    WITH product_stats AS (
        SELECT 
            COUNT(*) as total,
            jsonb_object_agg(
                status, 
                status_count
            ) as status_stats,
            jsonb_object_agg(
                date_key,
                date_count
            ) as date_stats
        FROM (
            SELECT 
                p.status,
                COUNT(*) as status_count,
                DATE(p.created_at) as date_key,
                COUNT(*) OVER (PARTITION BY DATE(p.created_at)) as date_count
            FROM products p
            WHERE p.created_at >= date_filter_start 
              AND p.created_at < date_filter_end
            GROUP BY p.status, DATE(p.created_at)
        ) sub
    )
    SELECT 
        ps.total,
        ps.status_stats,
        ps.date_stats
    FROM product_stats ps;
END;
$$ LANGUAGE plpgsql;

-- 4. 产品搜索函数
CREATE OR REPLACE FUNCTION search_products(
    search_term TEXT,
    status_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    id INTEGER,
    customer TEXT,
    product_id TEXT,
    style TEXT,
    size TEXT,
    frame TEXT,
    glass TEXT,
    grid TEXT,
    p_o TEXT,
    batch_no TEXT,
    barcode TEXT,
    status TEXT,
    scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.customer,
        p.product_id,
        p.style,
        p.size,
        p.frame,
        p.glass,
        p.grid,
        p.p_o,
        p.batch_no,
        p.barcode,
        p.status,
        p.scanned_at,
        p.created_at,
        p.updated_at
    FROM products p
    WHERE (
        search_term IS NULL OR
        p.customer ILIKE '%' || search_term || '%' OR
        p.product_id ILIKE '%' || search_term || '%' OR
        p.style ILIKE '%' || search_term || '%' OR
        p.barcode ILIKE '%' || search_term || '%'
    )
    AND (status_filter IS NULL OR p.status = status_filter)
    ORDER BY p.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 5. 性能优化索引
CREATE INDEX IF NOT EXISTS idx_products_search_text 
ON products USING GIN (
    to_tsvector('simple', 
        COALESCE(customer, '') || ' ' ||
        COALESCE(product_id, '') || ' ' ||
        COALESCE(style, '') || ' ' ||
        COALESCE(barcode, '')
    )
);

CREATE INDEX IF NOT EXISTS idx_products_status_date 
ON products(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_customer_date 
ON products(customer, created_at DESC);

-- 6. 数据一致性约束
ALTER TABLE products 
ADD CONSTRAINT chk_product_id_not_empty 
CHECK (length(trim(product_id)) > 0);

ALTER TABLE products 
ADD CONSTRAINT chk_customer_not_empty 
CHECK (length(trim(customer)) > 0);

-- 7. 创建视图用于常用查询
CREATE OR REPLACE VIEW product_summary AS
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created
FROM products 
GROUP BY status
ORDER BY status;

-- 8. 注释说明
COMMENT ON TABLE products IS '产品信息表 - 存储所有产品的基本信息和状态';
COMMENT ON COLUMN products.status IS '产品状态: scheduled(已排产), 已切割, 已清角, 已入库, 部分出库, 已出库';
COMMENT ON FUNCTION get_product_stats IS '获取产品统计信息，包括状态分布和日期分布';
COMMENT ON FUNCTION search_products IS '产品搜索函数，支持文本搜索和状态过滤';

-- 完成提示
SELECT 'SUCCESS: Supabase 产品管理系统设置完成！' as message; 