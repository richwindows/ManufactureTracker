# UUID类型转换错误修复指南

## 错误描述
```
ERROR: 42846: cannot cast type uuid to integer
```

## 问题原因
在Supabase中，`auth.uid()`函数返回的是UUID类型，而我们的用户表使用的是INTEGER类型的主键。当尝试在RLS（Row Level Security）策略中进行类型转换时，会出现此错误。

## 解决方案

### 方案1：禁用RLS策略（推荐用于自定义JWT认证）

由于我们使用的是自定义JWT认证系统而不是Supabase内置认证，最简单的解决方案是禁用RLS策略：

```sql
-- 在Supabase SQL编辑器中运行
-- 禁用RLS（如果之前启用了）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs DISABLE ROW LEVEL SECURITY;

-- 删除现有的策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view their own logs" ON user_activity_logs;
```

### 方案2：修改表结构使用UUID主键

如果你想使用Supabase内置认证，需要修改表结构：

```sql
-- 备份现有数据
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE user_sessions_backup AS SELECT * FROM user_sessions;
CREATE TABLE user_activity_logs_backup AS SELECT * FROM user_activity_logs;

-- 删除外键约束
ALTER TABLE user_sessions DROP CONSTRAINT user_sessions_user_id_fkey;
ALTER TABLE user_activity_logs DROP CONSTRAINT user_activity_logs_user_id_fkey;

-- 修改主键类型
ALTER TABLE users ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE user_sessions ALTER COLUMN user_id TYPE UUID;
ALTER TABLE user_activity_logs ALTER COLUMN user_id TYPE UUID;

-- 重新添加外键约束
ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_activity_logs ADD CONSTRAINT user_activity_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

### 方案3：添加auth_user_id字段

为用户表添加一个专门的auth_user_id字段来关联Supabase认证：

```sql
-- 添加auth_user_id字段
ALTER TABLE users ADD COLUMN auth_user_id UUID UNIQUE;

-- 创建索引
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);

-- 更新RLS策略
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS(SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
    );
```

## 推荐解决方案

**对于当前项目，推荐使用方案1**，因为：

1. 我们使用的是自定义JWT认证系统
2. 不依赖Supabase内置认证
3. 权限控制在应用层面处理
4. 避免了复杂的数据库结构修改

## 执行步骤

1. 在Supabase SQL编辑器中运行以下命令：

```sql
-- 禁用RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs DISABLE ROW LEVEL SECURITY;

-- 删除可能存在的策略
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view their own logs" ON user_activity_logs;

SELECT '✅ RLS策略已禁用，UUID类型转换错误已修复' as status;
```

2. 重新运行`auth-system-setup.sql`脚本（现在RLS部分已被注释）

## 验证修复

运行以下查询验证修复是否成功：

```sql
-- 检查表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_sessions', 'permissions', 'role_permissions', 'user_activity_logs');

-- 检查默认用户是否插入成功
SELECT username, role, is_active FROM users;

-- 检查权限配置是否正确
SELECT role, COUNT(*) as permission_count 
FROM role_permissions 
GROUP BY role;
```

## 注意事项

- 禁用RLS后，数据安全完全依赖应用层的权限控制
- 确保API端点都有适当的认证和授权检查
- 定期审查用户权限和访问日志
- 在生产环境中考虑启用数据库级别的访问控制