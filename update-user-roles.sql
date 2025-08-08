-- ========================================
-- 更新用户角色系统
-- ========================================

-- 1. 创建角色配置表
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    role_code VARCHAR(20) UNIQUE NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 插入新的角色配置
INSERT INTO user_roles (role_code, role_name, description, sort_order) VALUES
('admin', '管理员', '系统管理员，拥有所有权限', 1),
('viewer', '查看者', '只能查看数据，无法修改', 2),
('shipping', '出货员', '负责产品出货相关操作', 3)
ON CONFLICT (role_code) DO UPDATE SET
    role_name = EXCLUDED.role_name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

-- 3. 更新现有用户的角色（将 operator 改为 shipping）
UPDATE users 
SET role = 'shipping' 
WHERE role = 'operator';

-- 4. 更新角色权限表中的角色（将 operator 改为 shipping）
UPDATE role_permissions 
SET role = 'shipping' 
WHERE role = 'operator';

-- 5. 验证更新结果
SELECT 
    'user_roles' as table_name,
    COUNT(*) as record_count,
    array_agg(role_code ORDER BY sort_order) as roles
FROM user_roles
WHERE is_active = true;

SELECT 
    'users' as table_name,
    role,
    COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY role;

-- 6. 创建获取角色列表的函数
CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS TABLE(
    role_code VARCHAR(20),
    role_name VARCHAR(50),
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.role_code,
        ur.role_name,
        ur.description
    FROM user_roles ur
    WHERE ur.is_active = true
    ORDER BY ur.sort_order;
END;
$$ LANGUAGE plpgsql;

-- 测试函数
SELECT * FROM get_user_roles();

-- ========================================
-- 完成提示
-- ========================================
SELECT 
    '✅ 角色系统更新完成！' as status,
    '角色已更新为：admin, viewer, shipping' as message,
    '请更新前端代码中的角色选项' as next_step;