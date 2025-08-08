-- ========================================
-- 修复 get_user_permissions 函数重载冲突
-- ========================================

-- 1. 删除所有现有的 get_user_permissions 函数
DROP FUNCTION IF EXISTS get_user_permissions(VARCHAR);
DROP FUNCTION IF EXISTS get_user_permissions(TEXT);
DROP FUNCTION IF EXISTS get_user_permissions(VARCHAR(20));
DROP FUNCTION IF EXISTS get_user_permissions(CHARACTER VARYING);

-- 2. 重新创建统一的函数（使用 TEXT 类型以避免长度限制）
CREATE OR REPLACE FUNCTION get_user_permissions(user_role TEXT)
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

-- 3. 同时修复 check_user_permission 函数（保持一致性）
DROP FUNCTION IF EXISTS check_user_permission(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS check_user_permission(TEXT, TEXT);
DROP FUNCTION IF EXISTS check_user_permission(VARCHAR(20), VARCHAR(50));

CREATE OR REPLACE FUNCTION check_user_permission(
    user_role TEXT,
    required_permission TEXT
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

-- 4. 验证函数是否正确创建
SELECT 
    routine_name,
    data_type,
    parameter_name,
    parameter_mode,
    ordinal_position
FROM information_schema.parameters 
WHERE routine_name IN ('get_user_permissions', 'check_user_permission')
ORDER BY routine_name, ordinal_position;

-- 5. 测试函数
SELECT 'Testing get_user_permissions function:' as test_info;
SELECT * FROM get_user_permissions('admin') LIMIT 3;

SELECT 'Testing check_user_permission function:' as test_info;
SELECT 
    check_user_permission('admin', 'users.create') as admin_can_create_users,
    check_user_permission('viewer', 'users.create') as viewer_can_create_users;

-- ========================================
-- 完成提示
-- ========================================

SELECT 
    '✅ 函数重载冲突已修复！' as status,
    'get_user_permissions 和 check_user_permission 函数已重新创建' as message,
    '现在使用统一的 TEXT 参数类型' as details;