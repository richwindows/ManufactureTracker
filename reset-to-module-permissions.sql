-- 重置为模块权限系统
-- 在Supabase SQL编辑器中运行此脚本

-- ========================================
-- 1. 清理现有权限数据
-- ========================================

-- 删除现有的角色权限关联
DELETE FROM role_permissions;

-- 删除现有的权限定义
DELETE FROM permissions;

-- ========================================
-- 2. 插入新的模块权限
-- ========================================

-- 只保留模块级别的权限
INSERT INTO permissions (name, description, resource, action) VALUES
('module.counting_windows', '计数窗口模块', 'module', 'access'),
('module.bulk_import', '批量导入模块', 'module', 'access'),
('module.user_management', '用户管理模块', 'module', 'access'),
('module.status_stats', '状态统计模块', 'module', 'access'),
('module.product_sync', '产品同步模块', 'module', 'access'),
('module.search_filter', '搜索过滤模块', 'module', 'access'),
('module.product_list', '产品列表模块', 'module', 'access');

-- ========================================
-- 3. 为各角色分配模块权限
-- ========================================

-- admin角色：拥有所有模块权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

-- operator角色：拥有大部分模块权限，但不包括用户管理
INSERT INTO role_permissions (role, permission_id)
SELECT 'operator', id FROM permissions 
WHERE name IN (
    'module.counting_windows',
    'module.bulk_import', 
    'module.status_stats',
    'module.product_sync',
    'module.search_filter',
    'module.product_list'
);

-- viewer角色：只有查看相关的模块权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'viewer', id FROM permissions 
WHERE name IN (
    'module.status_stats',
    'module.search_filter',
    'module.product_list'
);

-- shipping_receiving角色：只有出货相关的模块权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'shipping_receiving', id FROM permissions 
WHERE name IN (
    'module.search_filter',
    'module.product_list'
);

-- ========================================
-- 4. 更新权限检查函数
-- ========================================

-- 先删除现有函数
DROP FUNCTION IF EXISTS get_user_permissions(TEXT);

-- 重新创建 get_user_permissions 函数，只返回模块权限
CREATE FUNCTION get_user_permissions(user_role TEXT)
RETURNS TABLE(permission_name TEXT) AS $$
BEGIN
    -- 如果是管理员，返回特殊标识（保持兼容性）
    IF user_role = 'admin' THEN
        RETURN QUERY
        SELECT 'admin_all_permissions'::TEXT;
    ELSE
        -- 其他角色返回具体的模块权限
        RETURN QUERY
        SELECT p.name::TEXT
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = user_role;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. 验证权限设置
-- ========================================

-- 显示所有模块权限
SELECT 
    '📋 所有模块权限:' as title,
    p.name,
    p.description
FROM permissions p
ORDER BY p.name;

-- 显示各角色的权限分配
SELECT 'admin角色权限:' as label, array_agg(permission_name) as permissions
FROM get_user_permissions('admin')
UNION ALL
SELECT 'operator角色权限:' as label, array_agg(permission_name) as permissions
FROM get_user_permissions('operator')
UNION ALL
SELECT 'viewer角色权限:' as label, array_agg(permission_name) as permissions
FROM get_user_permissions('viewer')
UNION ALL
SELECT 'shipping角色权限:' as label, array_agg(permission_name) as permissions
FROM get_user_permissions('shipping_receiving');

-- 显示权限分配详情表
SELECT 
    p.name as 模块权限,
    p.description as 描述,
    string_agg(rp.role, ', ') as 分配给角色
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
GROUP BY p.id, p.name, p.description
ORDER BY p.name;

-- ========================================
-- 6. 显示成功消息
-- ========================================

SELECT 
    '✅ 模块权限系统重置完成！' as status,
    '现在只有7个模块权限' as info1,
    '每个模块可以单独控制显示/隐藏' as info2;