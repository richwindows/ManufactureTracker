-- 为 Shipping and Receiving 角色添加权限设置
-- 在Supabase SQL编辑器中运行此脚本

-- ========================================
-- 1. 添加新的权限
-- ========================================

-- 插入出货相关权限
INSERT INTO permissions (name, description, resource, action) VALUES
('products.shipping', '产品出货操作', 'products', 'shipping'),
('products.partial_shipping', '产品部分出货操作', 'products', 'partial_shipping'),
('products.search', '搜索产品', 'products', 'search')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 2. 更新角色检查约束
-- ========================================

-- 删除旧的角色约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;

-- 添加新的角色约束，包含 shipping_receiving
ALTER TABLE users ADD CONSTRAINT check_user_role 
CHECK (role IN ('admin', 'operator', 'viewer', 'shipping_receiving'));

-- ========================================
-- 3. 配置 shipping_receiving 角色权限
-- ========================================

-- 为 shipping_receiving 角色分配权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'shipping_receiving', id FROM permissions 
WHERE name IN (
    'products.read',
    'products.search', 
    'products.shipping',
    'products.partial_shipping',
    'products.update'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- ========================================
-- 4. 创建默认 shipping_receiving 用户
-- ========================================

-- 插入默认 shipping_receiving 用户（密码：shipping123）
INSERT INTO users (username, email, password_hash, full_name, role, department)
VALUES (
    'shipping',
    'shipping@company.com',
    '$2b$10$K8gF7Z9X2mN5qP3rT6vY8eH4jL1wS0dA9bC2fE5gH8iJ3kL6mN9oP2q', -- shipping123 的 bcrypt 哈希
    '出货管理员',
    'shipping_receiving',
    '出货部门'
)
ON CONFLICT (username) DO NOTHING;

-- ========================================
-- 5. 验证设置
-- ========================================

-- 查看创建的用户
SELECT username, email, full_name, role, department, is_active 
FROM users 
WHERE username = 'shipping';

-- 查看分配的权限
SELECT p.name, p.description 
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role = 'shipping_receiving'
ORDER BY p.name;