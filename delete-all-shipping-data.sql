-- 完全删除所有 shipping 相关的数据库记录
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 删除 shipping 用户的会话记录
DELETE FROM user_sessions WHERE user_id IN (
    SELECT id FROM users WHERE username = 'shipping' OR role = 'shipping_receiving'
);

-- 2. 删除 shipping 用户的活动日志
DELETE FROM user_activity_logs WHERE user_id IN (
    SELECT id FROM users WHERE username = 'shipping' OR role = 'shipping_receiving'
);

-- 3. 删除 shipping_receiving 角色的权限映射
DELETE FROM role_permissions WHERE role = 'shipping_receiving';

-- 4. 删除 shipping 相关的权限
DELETE FROM permissions WHERE name LIKE '%shipping%' OR name LIKE '%partial_shipping%';

-- 5. 删除 shipping 用户
DELETE FROM users WHERE username = 'shipping' OR role = 'shipping_receiving';

-- 6. 从角色约束中移除 shipping_receiving
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE users ADD CONSTRAINT check_user_role 
CHECK (role IN ('admin', 'operator', 'viewer'));

-- 7. 验证删除结果
SELECT 'Users' as table_name, COUNT(*) as count FROM users WHERE username = 'shipping' OR role = 'shipping_receiving'
UNION ALL
SELECT 'Permissions' as table_name, COUNT(*) as count FROM permissions WHERE name LIKE '%shipping%'
UNION ALL
SELECT 'Role Permissions' as table_name, COUNT(*) as count FROM role_permissions WHERE role = 'shipping_receiving'
UNION ALL
SELECT 'Sessions' as table_name, COUNT(*) as count FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE username = 'shipping')
UNION ALL
SELECT 'Activity Logs' as table_name, COUNT(*) as count FROM user_activity_logs WHERE user_id IN (SELECT id FROM users WHERE username = 'shipping');