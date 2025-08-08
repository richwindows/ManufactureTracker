-- 修复权限系统以支持角色管理
-- 临时修改 get_user_permissions 函数，为管理员返回特殊权限

CREATE OR REPLACE FUNCTION get_user_permissions(user_role VARCHAR(20))
RETURNS TABLE(permission_name VARCHAR(50)) AS $$
BEGIN
    -- 如果是管理员，返回一个特殊权限标识
    IF user_role = 'admin' THEN
        RETURN QUERY SELECT 'admin_all_permissions'::VARCHAR(50) as permission_name;
    ELSE
        -- 其他角色返回空，但不影响基本功能
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 测试函数
SELECT 'Testing get_user_permissions function:' as status;
SELECT * FROM get_user_permissions('admin');
SELECT * FROM get_user_permissions('viewer');
SELECT * FROM get_user_permissions('shipping');