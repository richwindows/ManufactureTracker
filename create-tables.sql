-- 快速创建基础表 - 在 Supabase SQL Editor 中运行
-- 这个脚本会创建产品管理所需的基础表

-- 创建 products 表
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    customer VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    style VARCHAR(255) NOT NULL,
    size VARCHAR(255) NOT NULL,
    frame VARCHAR(255) NOT NULL,
    glass VARCHAR(255) NOT NULL,
    grid VARCHAR(255),
    p_o VARCHAR(255),
    batch_no VARCHAR(255) NOT NULL,
    barcode VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建基本索引
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);
CREATE INDEX IF NOT EXISTS idx_products_batch_no ON products(batch_no);
CREATE INDEX IF NOT EXISTS idx_products_customer ON products(customer);

-- 创建 updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 products 表添加触发器
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建产品状态统计函数
CREATE OR REPLACE FUNCTION get_product_status_stats()
RETURNS TABLE(
    status VARCHAR(50),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.status,
        COUNT(*) as count
    FROM products p
    GROUP BY p.status
    ORDER BY p.status;
END;
$$ LANGUAGE plpgsql; 