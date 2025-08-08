-- ========================================
-- 重置权限系统 - 删除所有权限，默认所有角色拥有全部权限
-- ========================================

-- 1. 备份现有权限数据（可选）
-- CREATE TABLE permissions_backup AS SELECT * FROM permissions;
-- CREATE TABLE role_permissions_backup AS SELECT * FROM role_permissions;

-- ========================================
-- 1.5. 删除现有冲突的函数
-- ========================================

-- 删除所有可能存在的 get_user_permissions 函数版本
DROP FUNCTION IF EXISTS get_user_permissions(text);
DROP FUNCTION IF EXISTS get_user_permissions(varchar);
DROP FUNCTION IF EXISTS get_user_permissions(character varying);

-- 删除所有可能存在的 check_user_permission 函数版本
DROP FUNCTION IF EXISTS check_user_permission(text, text);
DROP FUNCTION IF EXISTS check_user_permission(varchar, varchar);
DROP FUNCTION IF EXISTS check_user_permission(character varying, character varying);

-- ========================================
-- 2. 清空现有权限数据
-- ========================================

-- 删除所有角色权限关联
DELETE FROM role_permissions;

-- 删除所有权限定义
DELETE FROM permissions;

-- ========================================
-- 3. 重置权限检查函数 - 默认所有角色拥有所有权限
-- ========================================

-- 修改权限检查函数，默认返回 TRUE（所有角色都有权限）
CREATE OR REPLACE FUNCTION check_user_permission(
    user_role TEXT,
    required_permission TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 默认所有角色都有所有权限
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 修改获取用户权限函数，返回空结果（因为没有权限限制）
-- 修改获取用户权限函数，为管理员返回特殊权限标识
CREATE OR REPLACE FUNCTION get_user_permissions(user_role TEXT)
RETURNS TABLE(
    permission_name VARCHAR(50),
    description TEXT,
    resource VARCHAR(50),
    action VARCHAR(20)
) AS $$
BEGIN
    -- 如果是管理员，返回一个特殊的全权限标识
    IF user_role = 'admin' THEN
        RETURN QUERY
        SELECT 
            'admin_all_permissions'::VARCHAR(50) as permission_name,
            '管理员拥有所有权限'::TEXT as description,
            'all'::VARCHAR(50) as resource,
            'all'::VARCHAR(20) as action;
    ELSE
        -- 其他角色返回空结果，因为默认所有角色都有所有权限
        RETURN QUERY
        SELECT 
            'default_all_permissions'::VARCHAR(50) as permission_name,
            '默认拥有所有权限'::TEXT as description,
            'all'::VARCHAR(50) as resource,
            'all'::VARCHAR(20) as action
        WHERE FALSE; -- 返回空结果集
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. 更新用户权限视图
-- ========================================

-- 简化用户权限视图，显示所有用户都有全部权限
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.username,
    u.role,
    'all_permissions' as permission_name,
    '默认拥有所有权限' as permission_description,
    'all' as resource,
    'all' as action
FROM users u
WHERE u.is_active = true;

-- ========================================
-- 5. 创建添加权限的辅助函数
-- ========================================

-- 创建添加新权限的函数
CREATE OR REPLACE FUNCTION add_permission(
    p_name VARCHAR(50),
    p_description TEXT,
    p_resource VARCHAR(50),
    p_action VARCHAR(20)
)
RETURNS INTEGER AS $$
DECLARE
    permission_id INTEGER;
BEGIN
    INSERT INTO permissions (name, description, resource, action)
    VALUES (p_name, p_description, p_resource, p_action)
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        resource = EXCLUDED.resource,
        action = EXCLUDED.action
    RETURNING id INTO permission_id;
    
    RETURN permission_id;
END;
$$ LANGUAGE plpgsql;

-- 创建为角色分配权限的函数
CREATE OR REPLACE FUNCTION assign_permission_to_role(
    p_role VARCHAR(20),
    p_permission_name VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    permission_id INTEGER;
BEGIN
    -- 获取权限ID
    SELECT id INTO permission_id 
    FROM permissions 
    WHERE name = p_permission_name;
    
    IF permission_id IS NULL THEN
        RAISE NOTICE '权限 % 不存在', p_permission_name;
        RETURN FALSE;
    END IF;
    
    -- 分配权限给角色
    INSERT INTO role_permissions (role, permission_id)
    VALUES (p_role, permission_id)
    ON CONFLICT (role, permission_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 创建从角色移除权限的函数
CREATE OR REPLACE FUNCTION remove_permission_from_role(
    p_role VARCHAR(20),
    p_permission_name VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    permission_id INTEGER;
BEGIN
    -- 获取权限ID
    SELECT id INTO permission_id 
    FROM permissions 
    WHERE name = p_permission_name;
    
    IF permission_id IS NULL THEN
        RAISE NOTICE '权限 % 不存在', p_permission_name;
        RETURN FALSE;
    END IF;
    
    -- 从角色移除权限
    DELETE FROM role_permissions 
    WHERE role = p_role AND permission_id = permission_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. 更新权限检查逻辑（当有权限限制时）
-- ========================================

-- 创建智能权限检查函数
CREATE OR REPLACE FUNCTION check_user_permission_smart(
    user_role TEXT,
    required_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    has_any_permissions BOOLEAN;
BEGIN
    -- 检查是否有任何权限限制
    SELECT EXISTS(SELECT 1 FROM permissions LIMIT 1) INTO has_any_permissions;
    
    -- 如果没有定义任何权限，默认所有角色都有权限
    IF NOT has_any_permissions THEN
        RETURN TRUE;
    END IF;
    
    -- 管理员始终拥有所有权限
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

-- ========================================
-- 7. 验证重置结果
-- ========================================

-- 检查权限表状态
SELECT 
    'permissions' as table_name, 
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ 已清空' ELSE '⚠️ 仍有数据' END as status
FROM permissions
UNION ALL
SELECT 
    'role_permissions' as table_name, 
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ 已清空' ELSE '⚠️ 仍有数据' END as status
FROM role_permissions;

-- 测试权限检查函数
SELECT 
    'admin' as role,
    check_user_permission('admin', 'any.permission') as has_permission,
    '应该返回 TRUE（默认有所有权限）' as expected;

SELECT 
    'viewer' as role,
    check_user_permission('viewer', 'any.permission') as has_permission,
    '应该返回 TRUE（默认有所有权限）' as expected;

-- ========================================
-- 8. 使用示例
-- ========================================

-- 示例：如何添加权限并分配给角色
/*
-- 添加一个新权限
SELECT add_permission('users.create', '创建用户', 'users', 'create');

-- 只给admin角色分配这个权限
SELECT assign_permission_to_role('admin', 'users.create');

-- 这时需要切换到智能权限检查函数
-- 将 check_user_permission 替换为 check_user_permission_smart
*/

-- ========================================
-- 完成提示
-- ========================================

SELECT 
    '🎉 权限系统已重置！' as status,
    '所有权限已删除，默认所有角色拥有全部权限' as message,
    '使用 add_permission() 添加新权限' as add_permission_tip,
    '使用 assign_permission_to_role() 分配权限给角色' as assign_permission_tip,
    '添加权限后请将代码中的 check_user_permission 改为 check_user_permission_smart' as important_note;