# Supabase API 配置指南

本指南将帮助你配置 Supabase PostgreSQL 数据库和 API，为你的产品管理系统提供云端数据库支持。

## 📋 准备工作

在开始之前，请确保你已经：
- 完成了从 SQLite 到 PostgreSQL 的代码迁移
- 安装了最新的依赖包
- 有一个 Supabase 账户

## 🚀 第一步：创建 Supabase 项目

### 1.1 注册并创建项目

1. **访问 Supabase**
   - 前往 [https://supabase.com](https://supabase.com)
   - 点击 "Start your project" 注册或登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择组织（Organization）
   - 填写项目信息：
     - **Name**: `product-management` 或你喜欢的名称
     - **Database Password**: 设置一个强密码（记住这个密码！）
     - **Region**: 选择离你最近的区域
   - 点击 "Create new project"

### 1.2 等待项目初始化

项目创建需要几分钟时间，请耐心等待直到显示 "Project is ready"。

## 🔧 第二步：获取配置信息

### 2.1 获取 API 配置

在项目 Dashboard 中：

1. **获取 API Keys**
   - 点击左侧菜单 "Settings" → "API"
   - 复制以下信息：
     - **Project URL**: `https://[your-project-ref].supabase.co`
     - **Anon (public) key**: `eyJ...` (用于客户端)
     - **Service Role key**: `eyJ...` (用于服务端，可选)

2. **获取数据库连接字符串**
   - 点击左侧菜单 "Settings" → "Database"
   - 在 "Connection string" 部分选择 "URI"
   - 复制连接字符串：`postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

### 2.2 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# Supabase 项目配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 数据库连接（用于 Prisma）
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1

# 可选：服务端密钥
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**重要提示**：
- 将 `your-project-ref` 替换为你的实际项目引用
- 将 `your-password` 替换为你设置的数据库密码
- 将密钥替换为从 Supabase 复制的实际值

## 🗄️ 第三步：设置数据库架构

### 3.1 推送 Prisma 架构

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 推送数据库架构到 Supabase
npx prisma db push
```

### 3.2 验证数据库设置

运行以下查询验证表是否正确创建：

```sql
-- 检查表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'products';

-- 检查产品表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products';
```

## 🛠️ 第四步：配置应用

### 4.1 安装和启动应用

```bash
# 安装 Supabase JavaScript 客户端（已添加）
npm install @supabase/supabase-js

# 启动开发服务器
npm run dev
```

### 4.2 测试连接

访问 [http://localhost:3000](http://localhost:3000)，应用应该能正常运行并连接到 Supabase 数据库。

## 📊 第五步：使用新功能

### 5.1 API 端点测试

你现在可以使用以下 API 端点：

**产品管理**：
```bash
# 获取产品列表
GET /api/products

# 创建新产品
POST /api/products
{
  "customer": "客户名称",
  "productId": "产品ID",
  "style": "样式",
  "size": "尺寸",
  "frame": "框架",
  "glass": "玻璃",
  "grid": "网格",
  "po": "采购订单",
  "batchNo": "批次号"
}

# 删除产品
DELETE /api/products?id=1
```

**统计数据**：
```bash
# 获取产品统计信息
GET /api/products/stats

# 获取状态统计信息
GET /api/products/status-stats
```

## 🔒 第六步：安全配置（推荐）

### 6.1 配置 Row Level Security (RLS)

如果你的应用需要多用户或安全控制，可以启用 RLS：

```sql
-- 启用 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略（根据需要修改）
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
```

### 6.2 API 密钥安全

- **Anon Key**: 可以在客户端使用，有限制权限
- **Service Role Key**: 仅在服务端使用，拥有完整权限
- **不要**将 Service Role Key 暴露给客户端

## 📈 第七步：性能优化

### 7.1 连接池配置

Supabase 提供连接池，在 `DATABASE_URL` 中添加参数：

```
?pgbouncer=true&connection_limit=1
```

### 7.2 索引优化

项目已包含常用索引，如需添加更多索引：

```sql
-- 例：为特定查询模式添加索引
CREATE INDEX idx_products_customer_date ON products(customer, created_at DESC);
```

## 🚀 第八步：生产部署

### 8.1 环境变量配置

在你的部署平台（Vercel、Netlify 等）中配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.ref.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

### 8.2 数据库备份

Supabase 提供自动备份，你也可以手动创建备份：

1. 在 Supabase Dashboard 中点击 "Settings" → "Database"
2. 滚动到 "Backups" 部分
3. 点击 "Create backup"

## 🔧 故障排除

### 常见问题

**Q: 连接数据库失败**
```
Error: P1001: Can't reach database server
```
**A**: 检查网络连接和数据库 URL 是否正确，确保密码包含特殊字符时已正确编码。

**Q: Prisma 迁移失败**
```
Error: P3014: The datasource provider does not match
```
**A**: 确保 `prisma/schema.prisma` 中的 provider 设置为 `postgresql`。

**Q: API 请求失败**
```
Error: Invalid API key
```
**A**: 检查环境变量是否正确设置，确保使用正确的 Anon Key。

### 调试技巧

1. **检查环境变量**：
   ```bash
   # 在组件中临时添加
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```

2. **测试数据库连接**：
   ```bash
   npx prisma studio
   ```

3. **查看 Supabase 日志**：
   - 在 Supabase Dashboard 中点击 "Logs"
   - 查看 API 和数据库日志

## 📚 相关资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Prisma + Supabase 指南](https://supabase.com/docs/guides/integrations/prisma)
- [Next.js + Supabase 教程](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## 🎉 完成！

恭喜！你已经成功配置了 Supabase API。你的产品管理系统现在运行在强大的云端 PostgreSQL 数据库上，支持：

- ✅ 云端数据存储
- ✅ 高性能查询
- ✅ 自动备份
- ✅ 扩展性支持
- ✅ 实时数据同步

如有任何问题，请参考故障排除部分或查阅 Supabase 官方文档。 