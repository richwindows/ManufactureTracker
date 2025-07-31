# 多权限登录系统设置指南

## 系统概述

本系统实现了一个完整的多权限登录系统，包括：
- 用户认证和会话管理
- 基于角色的权限控制（RBAC）
- 三种用户角色：管理员(admin)、操作员(operator)、查看者(viewer)
- JWT令牌认证
- 操作日志记录

## 用户角色和权限

### 管理员 (admin)
- 所有权限
- 用户管理
- 系统设置
- 查看系统日志

### 操作员 (operator)
- 产品和条码的完整操作权限
- 批量导入产品
- 查看和导出统计数据
- 无用户管理权限

### 查看者 (viewer)
- 只读权限
- 查看产品、条码、统计数据
- 无创建、更新、删除权限

## 安装步骤

### 1. 数据库设置

#### 方法A：使用修复后的脚本（推荐）

1. 首先运行UUID错误修复脚本：
```sql
-- 在Supabase SQL编辑器中运行
-- 复制 fix-uuid-error.sql 的内容并执行
```

2. 然后运行主设置脚本：
```sql
-- 在Supabase SQL编辑器中运行
-- 复制 auth-system-setup.sql 的内容并执行
```

3. 最后运行默认用户修复脚本：
```sql
-- 在Supabase SQL编辑器中运行
-- 复制 fix-default-users.sql 的内容并执行
```

#### 方法B：如果遇到UUID类型转换错误

如果在运行`auth-system-setup.sql`时遇到以下错误：
```
ERROR: 42846: cannot cast type uuid to integer
```

请按以下步骤解决：

1. 运行修复脚本：
```bash
# 在Supabase SQL编辑器中运行 fix-uuid-error.sql
```

2. 重新运行主设置脚本：
```bash
# 在Supabase SQL编辑器中运行 auth-system-setup.sql
```

### 2. 环境变量配置

在`.env.local`文件中添加：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT密钥（生产环境请使用强密钥）
JWT_SECRET=your_jwt_secret_key
```

### 3. 安装依赖

```bash
npm install jsonwebtoken bcryptjs react-icons
```

## 默认用户账号

系统会自动创建以下测试账号：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 完整系统权限 |
| operator1 | operator123 | 操作员 | 产品操作权限 |
| viewer1 | viewer123 | 查看者 | 只读权限 |

**⚠️ 重要：生产环境中请立即修改这些默认密码！**

## 使用说明

### 登录
1. 访问 `/login` 页面
2. 使用上述默认账号登录
3. 登录成功后会重定向到主页

### 权限控制
- 页面会根据用户角色显示不同的功能
- 管理员可以看到"用户管理"按钮
- 操作员可以进行产品操作但无法管理用户
- 查看者只能查看数据

### 用户管理（仅管理员）
1. 点击"用户管理"按钮
2. 可以创建、编辑、删除用户
3. 可以分配角色和权限

## API端点

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/verify` - 验证会话

### 用户管理
- `GET /api/users` - 获取用户列表（管理员）
- `POST /api/users` - 创建用户（管理员）
- `PUT /api/users` - 更新用户（管理员/自己）
- `DELETE /api/users` - 删除用户（管理员）

## 安全特性

### 密码安全
- 使用bcrypt加密存储密码
- 密码强度验证
- 防止密码重用

### 会话管理
- JWT令牌认证
- 会话过期控制
- 自动清理过期会话

### 权限控制
- 基于角色的访问控制（RBAC）
- API级别的权限验证
- 前端组件级别的权限控制

### 操作日志
- 记录所有用户操作
- 包含IP地址和用户代理
- 支持审计追踪

## 故障排除

### 常见问题

#### 1. UUID类型转换错误
```
ERROR: 42846: cannot cast type uuid to integer
```
**解决方案：** 运行`fix-uuid-error.sql`脚本

#### 2. 登录失败 - "用户名或密码错误"
**原因：** 数据库中的默认用户密码哈希值不正确
**解决方案：** 运行`fix-default-users.sql`脚本来修复密码哈希

其他可能原因：
- 检查用户名和密码是否正确
- 确认用户账号是否激活（is_active = true）
- 检查数据库连接

#### 3. 权限问题
- 确认用户角色配置正确
- 检查role_permissions表中的权限分配
- 验证JWT令牌是否有效

#### 4. 数据库连接问题
- 检查Supabase配置
- 确认环境变量设置正确
- 验证数据库表是否创建成功

### 验证安装

运行以下SQL查询验证安装：

```sql
-- 检查表是否创建
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_sessions', 'permissions', 'role_permissions');

-- 检查默认用户
SELECT username, role, is_active FROM users;

-- 检查权限配置
SELECT role, COUNT(*) as permission_count 
FROM role_permissions 
GROUP BY role;
```

## 自定义配置

### 添加新权限

1. 在permissions表中添加新权限：
```sql
INSERT INTO permissions (name, description, resource, action) 
VALUES ('new_permission', '新权限描述', 'resource_name', 'action_name');
```

2. 分配给角色：
```sql
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE name = 'new_permission';
```

### 修改密码策略

在`src/lib/auth.js`中修改密码验证规则：

```javascript
function validatePassword(password) {
  // 自定义密码规则
  return password.length >= 8; // 示例：最少8位
}
```

## 生产部署检查清单

- [ ] 修改所有默认密码
- [ ] 设置强JWT密钥
- [ ] 配置HTTPS
- [ ] 启用数据库备份
- [ ] 设置监控和日志
- [ ] 配置防火墙规则
- [ ] 测试所有权限场景
- [ ] 设置会话超时策略
- [ ] 配置错误报告
- [ ] 进行安全审计

## 技术支持

如果遇到问题，请检查：
1. 控制台错误信息
2. 数据库日志
3. 网络连接状态
4. 环境变量配置

更多详细信息请参考：
- `UUID_TYPE_CONVERSION_FIX.md` - UUID错误修复指南
- `auth-system-setup.sql` - 数据库设置脚本
- `fix-uuid-error.sql` - 错误修复脚本