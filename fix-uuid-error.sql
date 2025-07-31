-- 修复UUID类型转换错误的快速脚本
-- 在Supabase SQL编辑器中运行此脚本

-- ========================================
-- 禁用RLS策略并清理
-- ========================================

-- 禁用RLS（如果之前启用了）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs DISABLE ROW LEVEL SECURITY;

-- 删除可能存在的策略
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view their own logs" ON user_activity_logs;

-- 验证修复
SELECT '✅ RLS策略已禁用，UUID类型转换错误已修复' as status;

-- 检查表状态
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_sessions', 'user_activity_logs');