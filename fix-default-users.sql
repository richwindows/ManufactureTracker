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