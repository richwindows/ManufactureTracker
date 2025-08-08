-- 设置用户管理权限
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 插入用户管理相关权限
INSERT INTO permissions (name, description, resource, action) VALUES
('users.read', '查看用户列表', 'users', 'read'),
('users.create', '创建用户', 'users', 'create'),
('users.update', '更新用户', 'users', 'update'),
('users.delete', '删除用户', 'users', 'delete'),
('users.manage', '用户管理完整权限', 'users', 'manage')
ON CONFLICT (name) DO NOTHING;

-- 2. 为管理员角色分配所有用户管理权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions 
WHERE name IN ('users.read', 'users.create', 'users.update', 'users.delete', 'users.manage')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 3. 默认情况下，其他角色不分配用户管理权限
-- viewer 和 shipping 角色默认没有用户管理权限

-- 4. 更新 get_user_permissions 函数，确保返回正确的权限
CREATE OR REPLACE FUNCTION get_user_permissions(user_role TEXT)
RETURNS TABLE(permission_name TEXT) AS $$
BEGIN
    -- 如果是管理员，返回所有权限
    IF user_role = 'admin' THEN
        RETURN QUERY
        SELECT 'admin_all_permissions'::TEXT;
    ELSE
        -- 其他角色返回具体分配的权限，显式转换为TEXT类型
        RETURN QUERY
        SELECT p.name::TEXT
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = user_role;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. 测试权限设置
SELECT 'admin权限:' as label, array_agg(permission_name) as permissions
FROM get_user_permissions('admin')
UNION ALL
SELECT 'viewer权限:' as label, array_agg(permission_name) as permissions
FROM get_user_permissions('viewer')
UNION ALL
SELECT 'shipping权限:' as label, array_agg(permission_name) as permissions
FROM get_user_permissions('shipping');

-- 显示成功消息
SELECT '✅ 用户管理权限设置完成！' as status,
       'admin角色拥有所有用户管理权限' as admin_info,
       '其他角色默认无用户管理权限' as other_roles_info;