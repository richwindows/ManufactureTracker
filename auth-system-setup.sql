-- 用户认证和权限管理系统数据库设置
-- 在Supabase SQL编辑器中运行此脚本

-- ========================================
-- 1. 创建用户表
-- ========================================

-- 用户基础信息表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    department VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加角色检查约束
ALTER TABLE users ADD CONSTRAINT check_user_role 
CHECK (role IN ('admin', 'operator', 'viewer'));

-- ========================================
-- 2. 创建会话管理表
-- ========================================

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. 创建权限配置表
-- ========================================

-- 权限定义表
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL, -- products, barcodes, users, etc.
    action VARCHAR(20) NOT NULL,   -- create, read, update, delete
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- ========================================
-- 4. 创建操作日志表
-- ========================================

-- 用户操作日志表
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50),
    resource_id INTEGER,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 5. 创建索引
-- ========================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- 会话表索引
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- 权限表索引
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- 日志表索引
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON user_activity_logs(created_at);

-- ========================================
-- 6. 插入基础权限数据
-- ========================================

-- 插入权限定义
INSERT INTO permissions (name, description, resource, action) VALUES
-- 产品管理权限
('products.create', '创建产品', 'products', 'create'),
('products.read', '查看产品', 'products', 'read'),
('products.update', '更新产品', 'products', 'update'),
('products.delete', '删除产品', 'products', 'delete'),
('products.bulk_import', '批量导入产品', 'products', 'bulk_import'),

-- 条码管理权限
('barcodes.create', '创建条码记录', 'barcodes', 'create'),
('barcodes.read', '查看条码记录', 'barcodes', 'read'),
('barcodes.update', '更新条码记录', 'barcodes', 'update'),
('barcodes.delete', '删除条码记录', 'barcodes', 'delete'),

-- 统计数据权限
('stats.read', '查看统计数据', 'stats', 'read'),
('stats.export', '导出统计数据', 'stats', 'export'),

-- 用户管理权限
('users.create', '创建用户', 'users', 'create'),
('users.read', '查看用户', 'users', 'read'),
('users.update', '更新用户', 'users', 'update'),
('users.delete', '删除用户', 'users', 'delete'),

-- 系统管理权限
('system.logs', '查看系统日志', 'system', 'logs'),
('system.settings', '系统设置', 'system', 'settings')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 7. 配置角色权限
-- ========================================

-- 管理员权限（所有权限）
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- 操作员权限（产品和条码的完整操作权限）
INSERT INTO role_permissions (role, permission_id)
SELECT 'operator', id FROM permissions 
WHERE resource IN ('products', 'barcodes', 'stats') 
   OR name IN ('stats.read', 'stats.export')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 查看者权限（只读权限）
INSERT INTO role_permissions (role, permission_id)
SELECT 'viewer', id FROM permissions 
WHERE action = 'read'
ON CONFLICT (role, permission_id) DO NOTHING;

-- ========================================
-- 8. 创建默认管理员用户
-- ========================================

-- 插入默认管理员用户（密码：admin123）
-- 注意：实际部署时应该修改默认密码
INSERT INTO users (username, email, password_hash, full_name, role, department)
VALUES (
    'admin',
    'admin@company.com',
    '$2b$10$rQZ8kHWiZ8.Nt8Nt8Nt8NuGKjhGKjhGKjhGKjhGKjhGKjhGKjhGKjh', -- 需要实际的bcrypt哈希
    '系统管理员',
    'admin',
    'IT部门'
)
ON CONFLICT (username) DO NOTHING;

-- 插入测试操作员用户
INSERT INTO users (username, email, password_hash, full_name, role, department)
VALUES (
    'operator1',
    'operator1@company.com',
    '$2b$10$rQZ8kHWiZ8.Nt8Nt8Nt8NuGKjhGKjhGKjhGKjhGKjhGKjhGKjhGKjh',
    '操作员一号',
    'operator',
    '生产部门'
),
(
    'viewer1',
    'viewer1@company.com',
    '$2b$10$rQZ8kHWiZ8.Nt8Nt8Nt8NuGKjhGKjhGKjhGKjhGKjhGKjhGKjhGKjh',
    '查看员一号',
    'viewer',
    '质检部门'
)
ON CONFLICT (username) DO NOTHING;

-- ========================================
-- 9. 创建辅助函数
-- ========================================

-- 检查用户权限的函数
CREATE OR REPLACE FUNCTION check_user_permission(
    user_role VARCHAR(20),
    required_permission VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = user_role 
          AND p.name = required_permission
    );
END;
$$ LANGUAGE plpgsql;

-- 获取用户权限列表的函数
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

-- 清理过期会话的函数
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 记录用户活动的函数
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id INTEGER,
    p_action VARCHAR(50),
    p_resource VARCHAR(50) DEFAULT NULL,
    p_resource_id INTEGER DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activity_logs (
        user_id, action, resource, resource_id, 
        details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_action, p_resource, p_resource_id,
        p_details, p_ip_address, p_user_agent
    );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 10. 创建触发器
-- ========================================

-- 更新用户updated_at字段的触发器
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updated_at();

-- ========================================
-- 11. 创建视图
-- ========================================

-- 用户权限视图
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    u.role,
    p.name as permission_name,
    p.description as permission_description,
    p.resource,
    p.action
FROM users u
JOIN role_permissions rp ON u.role = rp.role
JOIN permissions p ON rp.permission_id = p.id
WHERE u.is_active = true;

-- 活跃会话视图
CREATE OR REPLACE VIEW active_sessions_view AS
SELECT 
    s.id as session_id,
    s.session_token,
    u.id as user_id,
    u.username,
    u.full_name,
    u.role,
    s.ip_address,
    s.created_at as login_time,
    s.expires_at
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > NOW()
  AND u.is_active = true;

-- ========================================
-- 12. 设置行级安全策略（RLS）
-- ========================================

-- 注意：以下RLS策略适用于Supabase内置认证
-- 如果使用自定义JWT认证，可能需要调整或禁用这些策略

-- 启用RLS（可选，根据实际需求决定是否启用）
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- 如果启用RLS，以下是示例策略（需要根据实际认证方式调整）
/*
-- 用户表RLS策略（示例）
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (
        -- 如果使用Supabase内置认证
        auth.uid() IS NOT NULL
        -- 或者根据实际需求调整条件
    );

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        -- 根据实际管理员识别方式调整
        EXISTS(SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
    );

-- 会话表RLS策略（示例）
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (
        -- 根据实际需求调整
        auth.uid() IS NOT NULL
    );

-- 活动日志RLS策略（示例）
CREATE POLICY "Users can view their own logs" ON user_activity_logs
    FOR SELECT USING (
        -- 根据实际需求调整
        auth.uid() IS NOT NULL
    );
*/

-- ========================================
-- 完成提示
-- ========================================

SELECT '🎉 用户认证和权限管理系统设置完成！' as status,
       '默认管理员账号: admin / admin123' as admin_info,
       '请及时修改默认密码并配置实际的密码哈希' as security_note;



-- 修复默认用户密码哈希值
-- 在Supabase SQL编辑器中运行此脚本

-- 删除可能存在的旧用户数据
DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin', 'operator', 'viewer'));
DELETE FROM user_activity_logs WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin', 'operator', 'viewer'));
DELETE FROM users WHERE username IN ('admin', 'operator', 'viewer');

-- 插入正确的默认用户（使用真实的bcrypt哈希值）
INSERT INTO users (username, email, password_hash, full_name, role, department) VALUES
(
    'admin',
    'admin@company.com',
    '$2b$10$AYivdUmRNfrV0yajn3j1JOsOYC7CelqvzOpt5rXPKqMtcr2Zc.d0a', -- admin123
    '系统管理员',
    'admin',
    'IT部门'
),
(
    'operator',
    'operator@company.com', 
    '$2b$10$goP9GtanFSPFmf0v/QRf7eFxOZIK.r.c1sMTjnkrLxZEiceh8s2cy', -- operator123
    '操作员',
    'operator',
    '生产部门'
),
(
    'viewer',
    'viewer@company.com',
    '$2b$10$xrw3Xq5EKpVFFtBQX3kcp.kdlm14xeFT1OXxiBTkPtqTUt8bN5WnC', -- viewer123
    '查看者',
    'viewer', 
    '质检部门'
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    is_active = true;

-- 验证用户创建
SELECT 
    username,
    email,
    full_name,
    role,
    department,
    is_active,
    created_at
FROM users 
WHERE username IN ('admin', 'operator', 'viewer')
ORDER BY role;

-- 显示成功消息
SELECT '✅ 默认用户密码已修复！' as status,
       '用户名: admin, 密码: admin123' as admin_account,
       '用户名: operator, 密码: operator123' as operator_account,
       '用户名: viewer, 密码: viewer123' as viewer_account;