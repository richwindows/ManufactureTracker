-- ========================================
-- 简化权限系统 - 统一为基于角色的权限控制
-- ========================================

-- 备份现有数据（可选）
-- CREATE TABLE user_permissions_backup AS SELECT * FROM user_permissions;
-- CREATE TABLE permissions_grouped_backup AS SELECT * FROM permissions_grouped;

-- ========================================
-- 1. 删除多余的权限表和视图
-- ========================================

-- 删除依赖的视图
DROP VIEW IF EXISTS user_permissions_view CASCADE;
DROP VIEW IF EXISTS active_sessions_view CASCADE;

-- 删除多余的权限相关表（根据您的数据库截图）
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS permissions_groups CASCADE;
DROP TABLE IF EXISTS permissions_grouped CASCADE;  -- 添加这个表
DROP TABLE IF EXISTS user_permission_overrides CASCADE;

-- 删除可能存在的其他多余表
DROP TABLE IF EXISTS permission_categories CASCADE;
DROP TABLE IF EXISTS user_role_history CASCADE;
DROP TABLE IF EXISTS permission_audit_log CASCADE;
DROP TABLE IF EXISTS group_permissions CASCADE;
DROP TABLE IF EXISTS permission_groups CASCADE;

-- ========================================
-- 2. 保留核心权限表结构
-- ========================================

-- 保留以下核心表：
-- ✓ users 表（用户基础信息，包含role字段）
-- ✓ permissions 表（权限定义）
-- ✓ role_permissions 表（角色权限关联）
-- ✓ user_sessions 表（用户会话）
-- ✓ user_activity_logs 表（用户活动日志）
-- ✓ barcode_scans 表（条码扫描记录）
-- ✓ products 表（产品信息）

-- ========================================
-- 3. 重新创建简化的视图
-- ========================================

-- 创建简化的用户权限视图（仅基于角色）
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.username,
    u.role,
    p.name as permission_name,
    p.description as permission_description,
    p.resource,
    p.action
FROM users u
JOIN role_permissions rp ON u.role = rp.role
JOIN permissions p ON rp.permission_id = p.id
WHERE u.is_active = true;

-- 创建简化的活跃会话视图
CREATE OR REPLACE VIEW active_sessions_view AS
SELECT 
    s.id as session_id,
    s.session_token,
    u.id as user_id,
    u.username,
    u.role,
    s.ip_address,
    s.created_at as login_time,
    s.expires_at
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > NOW()
  AND u.is_active = true;

-- ========================================
-- 4. 更新权限检查函数（简化版）
-- ========================================

-- 简化的权限检查函数（仅基于角色）
CREATE OR REPLACE FUNCTION check_user_permission(
    user_role VARCHAR(20),
    required_permission VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 管理员拥有所有权限
    IF user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- 检查角色是否有指定权限
    RETURN EXISTS (
        SELECT 1 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = user_role 
          AND p.name = required_permission
    );
END;
$$ LANGUAGE plpgsql;

-- 简化的获取用户权限函数
CREATE OR REPLACE FUNCTION get_user_permissions(user_role VARCHAR(20))
RETURNS TABLE(
    permission_name VARCHAR(50),
    description TEXT,
    resource VARCHAR(50),
    action VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name,
        p.description,
        p.resource,
        p.action
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role = user_role
    ORDER BY p.resource, p.action;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. 清理不必要的索引
-- ========================================

-- 删除已删除表相关的索引
DROP INDEX IF EXISTS idx_user_permissions_user_id;
DROP INDEX IF EXISTS idx_user_permissions_permission_id;
DROP INDEX IF EXISTS idx_permissions_groups_name;
DROP INDEX IF EXISTS idx_permissions_grouped_name;
DROP INDEX IF EXISTS idx_user_permission_overrides_user_id;
DROP INDEX IF EXISTS idx_group_permissions_group_id;
DROP INDEX IF EXISTS idx_permission_groups_name;

-- ========================================
-- 6. 强制删除可能存在的其他权限相关对象
-- ========================================

-- 删除可能存在的函数
DROP FUNCTION IF EXISTS get_user_group_permissions(INTEGER);
DROP FUNCTION IF EXISTS check_group_permission(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS assign_user_to_group(INTEGER, INTEGER);

-- 删除可能存在的触发器
DROP TRIGGER IF EXISTS update_user_permissions_trigger ON users;
DROP TRIGGER IF EXISTS sync_group_permissions_trigger ON permissions_grouped;

-- ========================================
-- 7. 验证简化后的系统
-- ========================================

-- 检查剩余的表
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'permissions', 'role_permissions', 'user_sessions', 'user_activity_logs', 'barcode_scans', 'products') 
        THEN '✓ 保留'
        ELSE '⚠️ 检查是否需要'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY 
    CASE 
        WHEN table_name IN ('users', 'permissions', 'role_permissions', 'user_sessions', 'user_activity_logs', 'barcode_scans', 'products') 
        THEN 1 
        ELSE 2 
    END,
    table_name;

-- 检查保留的核心表记录数
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'permissions' as table_name, COUNT(*) as record_count FROM permissions
UNION ALL
SELECT 'role_permissions' as table_name, COUNT(*) as record_count FROM role_permissions
UNION ALL
SELECT 'user_sessions' as table_name, COUNT(*) as record_count FROM user_sessions
UNION ALL
SELECT 'user_activity_logs' as table_name, COUNT(*) as record_count FROM user_activity_logs;

-- 检查角色权限配置
SELECT 
    role,
    COUNT(*) as permission_count,
    array_agg(p.name ORDER BY p.name) as permissions
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
GROUP BY role
ORDER BY role;

-- 测试权限检查函数
SELECT 
    'admin' as role,
    check_user_permission('admin', 'users.create') as can_create_users,
    check_user_permission('admin', 'products.delete') as can_delete_products;

SELECT 
    'operator' as role,
    check_user_permission('operator', 'users.create') as can_create_users,
    check_user_permission('operator', 'products.update') as can_update_products;

SELECT 
    'viewer' as role,
    check_user_permission('viewer', 'users.create') as can_create_users,
    check_user_permission('viewer', 'products.read') as can_read_products;

-- ========================================
-- 完成提示
-- ========================================

SELECT 
    '🎉 权限系统简化完成！' as status,
    '已删除多余的权限表，统一使用基于角色的权限控制' as message,
    '保留的核心表: users, permissions, role_permissions, user_sessions, user_activity_logs, barcode_scans, products' as core_tables,
    '删除的多余表: user_permissions, permissions_groups, permissions_grouped 等' as removed_tables,
    '请更新相关API代码以适配简化后的权限系统' as next_step;