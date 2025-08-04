-- 重新添加 Shipping 系统
-- 在 Supabase SQL 编辑器中运行此脚本

-- ========================================
-- 1. 添加 shipping 相关权限
-- ========================================

-- 插入出货相关权限
INSERT INTO permissions (name, description, resource, action) VALUES
('products:shipping', '产品出货操作', 'products', 'shipping'),
('products:partial_shipping', '产品部分出货操作', 'products', 'partial_shipping')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 2. 更新用户表角色约束
-- ========================================

-- 删除旧的角色约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;

-- 添加新的角色约束，包含 shipping_receiving
ALTER TABLE users ADD CONSTRAINT check_user_role 
CHECK (role IN ('admin', 'operator', 'viewer', 'shipping_receiving'));

-- ========================================
-- 3. 为 shipping_receiving 角色分配权限
-- ========================================

-- 为 shipping_receiving 角色分配权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'shipping_receiving', id FROM permissions 
WHERE name IN (
    'products:view',
    'products:search', 
    'products:update',
    'products:shipping',
    'products:partial_shipping'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- ========================================
-- 4. 创建默认 shipping 用户
-- ========================================

-- 插入默认 shipping 用户（密码：123456）
INSERT INTO users (username, email, password_hash, full_name, role, department)
VALUES (
    'shipping',
    'shipping@company.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 密码: password
    '出货管理员',
    'shipping_receiving',
    '出货部门'
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    department = EXCLUDED.department;

-- ========================================
-- 5. 验证设置
-- ========================================

-- 查看 shipping_receiving 角色的权限
SELECT 
    rp.role,
    p.name as permission_name,
    p.description 
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role = 'shipping_receiving'
ORDER BY p.name;

-- 查看 shipping 用户信息
SELECT username, email, full_name, role, department, is_active, created_at 
FROM users 
WHERE username = 'shipping';

-- 测试权限查询函数
SELECT * FROM get_user_permissions('shipping_receiving');