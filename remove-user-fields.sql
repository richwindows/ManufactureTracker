-- 删除users表中的email、full_name、department、phone字段
-- 在Supabase SQL编辑器中运行此脚本

-- ========================================
-- 1. 备份现有数据（强烈推荐）
-- ========================================

-- 创建备份表
CREATE TABLE users_backup_before_field_removal AS SELECT * FROM users;

-- ========================================
-- 2. 删除依赖的视图
-- ========================================

-- 删除依赖full_name字段的视图
DROP VIEW IF EXISTS user_permissions_view CASCADE;
DROP VIEW IF EXISTS active_sessions_view CASCADE;

-- ========================================
-- 3. 删除相关索引
-- ========================================

-- 删除email字段的索引
DROP INDEX IF EXISTS idx_users_email;

-- ========================================
-- 4. 删除字段
-- ========================================

-- 删除email字段
ALTER TABLE users DROP COLUMN IF EXISTS email;

-- 删除full_name字段
ALTER TABLE users DROP COLUMN IF EXISTS full_name;

-- 删除department字段
ALTER TABLE users DROP COLUMN IF EXISTS department;

-- 删除phone字段
ALTER TABLE users DROP COLUMN IF EXISTS phone;

-- ========================================
-- 5. 重新创建视图（如果需要的话，去掉full_name字段）
-- ========================================

-- 重新创建user_permissions_view（不包含full_name）
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id,
    u.username,
    u.role,
    u.is_active,
    u.last_login_at,
    u.created_at,
    u.updated_at,
    array_agg(p.name) as permissions
FROM users u
LEFT JOIN role_permissions rp ON u.role = rp.role
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.role, u.is_active, u.last_login_at, u.created_at, u.updated_at;

-- 重新创建active_sessions_view（不包含full_name）
CREATE OR REPLACE VIEW active_sessions_view AS
SELECT 
    s.id,
    s.session_token,
    s.expires_at,
    s.ip_address,
    s.user_agent,
    s.created_at,
    u.id as user_id,
    u.username,
    u.role
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > NOW() AND u.is_active = true;

-- ========================================
-- 6. 验证表结构
-- ========================================

-- 查看修改后的表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- 7. 显示操作结果
-- ========================================

SELECT '✅ 用户表字段删除完成！' as status,
       '已删除字段: email, full_name, department, phone' as removed_fields,
       '已重新创建视图: user_permissions_view, active_sessions_view' as recreated_views,
       '备份表: users_backup_before_field_removal' as backup_info;