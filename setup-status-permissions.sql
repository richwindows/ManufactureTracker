-- 设置状态查看权限系统
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 插入状态查看权限
INSERT INTO permissions (name, description, resource, action) VALUES
('status.view_scheduled', '查看已排产状态', 'status', 'view'),
('status.view_cut', '查看已切割状态', 'status', 'view'),
('status.view_cleaned', '查看已清角状态', 'status', 'view'),
('status.view_warehoused', '查看已入库状态', 'status', 'view'),
('status.view_partial_out', '查看部分出库状态', 'status', 'view'),
('status.view_out', '查看已出库状态', 'status', 'view'),
('status.view_scanned', '查看已扫描状态', 'status', 'view')
ON CONFLICT (name) DO NOTHING;

-- 2. 为管理员角色分配所有状态查看权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions 
WHERE name IN (
    'status.view_scheduled',
    'status.view_cut',
    'status.view_cleaned',
    'status.view_warehoused',
    'status.view_partial_out',
    'status.view_out',
    'status.view_scanned'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- 3. 为操作员角色分配部分状态查看权限（示例：只能查看已入库、部分出库、已出库）
INSERT INTO role_permissions (role, permission_id)
SELECT 'operator', id FROM permissions 
WHERE name IN (
    'status.view_warehoused',
    'status.view_partial_out',
    'status.view_out'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- 4. 为查看者角色分配基本状态查看权限（示例：只能查看已入库、已出库）
INSERT INTO role_permissions (role, permission_id)
SELECT 'viewer', id FROM permissions 
WHERE name IN (
    'status.view_warehoused',
    'status.view_out'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- 5. 创建便捷函数：为用户分配特定状态查看权限
CREATE OR REPLACE FUNCTION assign_status_permissions_to_role(
    p_role TEXT,
    p_statuses TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
    status_name TEXT;
    permission_name TEXT;
    permission_id INTEGER;
BEGIN
    -- 遍历状态数组
    FOREACH status_name IN ARRAY p_statuses
    LOOP
        -- 构建权限名称
        permission_name := 'status.view_' || status_name;
        
        -- 获取权限ID
        SELECT id INTO permission_id 
        FROM permissions 
        WHERE name = permission_name;
        
        IF permission_id IS NOT NULL THEN
            -- 分配权限给角色
            INSERT INTO role_permissions (role, permission_id)
            VALUES (p_role, permission_id)
            ON CONFLICT (role, permission_id) DO NOTHING;
            
            RAISE NOTICE '已为角色 % 分配权限 %', p_role, permission_name;
        ELSE
            RAISE NOTICE '权限 % 不存在', permission_name;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. 使用示例：
-- 为某个角色分配特定状态查看权限
-- SELECT assign_status_permissions_to_role('custom_role', ARRAY['warehoused', 'partial_out', 'out']);

-- 7. 查看当前权限分配情况
SELECT 
    rp.role,
    p.name as permission_name,
    p.description as permission_description
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name LIKE 'status.view_%'
ORDER BY rp.role, p.name;