# 产品管理系统

一个基于 Next.js 的现代化产品管理系统，支持数据库存储和前端展示。

## 功能特点

- 📊 **批量导入**: 支持从Excel/表格复制粘贴数据，快速导入产品信息
- 🏷️ **状态跟踪**: 完整的产品状态管理（已排产→已切割→已清角→已入库→部分出库→已出库）
- 🗄️ **数据库存储**: 使用 Supabase PostgreSQL 数据库存储产品信息
- 🔍 **实时搜索**: 支持按客户名、产品ID、样式、条码等字段搜索
- 📅 **日期筛选**: 默认显示当天数据，可选择任意日期查看历史数据
- 📈 **状态统计**: 实时显示各状态产品数量和进度
- 📊 **快速导航**: 显示最近有数据的日期，一键快速切换
- 📋 **完整CRUD**: 支持产品的增加、查看、删除操作
- 🎨 **现代UI**: 使用 Tailwind CSS 构建的响应式界面
- ⚡ **实时更新**: 数据变更后界面自动更新

## 技术栈

- **前端**: Next.js 15, React, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Supabase PostgreSQL + Prisma ORM
- **图标**: Lucide React

## 数据结构

系统支持以下产品信息字段：

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| Customer | String | ✅ | 客户名称 |
| ID | String | ✅ | 产品ID |
| Style | String | ✅ | 产品样式 |
| Size | String | ✅ | 产品尺寸 |
| Frame | String | ✅ | 框架材料 |
| Glass | String | ✅ | 玻璃类型 |
| Grid | String | ❌ | 网格类型 |
| P.O | String | ❌ | 采购订单号 |
| Batch NO | String | ✅ | 批次号 |
| Barcode | String | ❌ | 产品条码 |

## 安装和运行

### 1. 克隆项目
\`\`\`bash
git clone <repository-url>
cd product-management
\`\`\`

### 2. 安装依赖
\`\`\`bash
npm install
\`\`\`

### 3. 配置 Supabase 数据库

1. **创建 Supabase 项目**
   - 访问 [supabase.com](https://supabase.com)
   - 创建新项目并获取数据库连接字符串

2. **设置环境变量**
   创建 \`.env.local\` 文件：
   \`\`\`bash
   # Supabase 项目配置
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   
   # 数据库连接（用于 Prisma）
   DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
   \`\`\`

3. **生成 Prisma 客户端**
   \`\`\`bash
   npx prisma generate
   \`\`\`

4. **推送数据库架构到 Supabase**
   \`\`\`bash
   npx prisma db push
   \`\`\`

### 4. 添加示例数据（可选）
\`\`\`bash
node scripts/seed.js
\`\`\`

### 5. 启动开发服务器
\`\`\`bash
npm run dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 使用指南

### 批量导入（推荐工作流程）

1. **准备数据**: 在Excel或其他表格软件中准备产品数据
2. **复制数据**: 选择数据区域（包含表头）并复制
3. **导入系统**: 
   - 点击"批量导入"按钮
   - 粘贴数据到文本框中
   - 系统自动解析并预览
   - 确认后点击"开始导入"
4. **确认导入**: 导入的产品状态为"已排产"

**支持的数据格式：**
```
Customer	ID	Style	Size	Frame	Glass	Grid	P.O	Batch NO.
Luis107012	21	XO	35 1/2 x 23 1/2	Nailon	OBS/cl+		TLC	06032025-02-05
Luis107012	22	XO	35 1/2 x 23 1/2	Nailon	OBS/cl+		TLC	06032025-02-05
```

注意：
- 支持制表符分隔的数据
- P.O字段可以为空
- 系统会自动跳过重复的产品ID+批次号组合

### 状态管理

- **已排产** (紫色): 通过批量导入的产品初始状态
- **已切割** (橙色): 产品完成切割工序
- **已清角** (黄色): 产品完成清角工序
- **已入库** (绿色): 产品完成生产并入库
- **部分出库** (蓝色): 产品部分出库
- **已出库** (紫色): 产品完全出库

### 手动添加产品

1. 点击右上角"添加产品"按钮
2. 填写所有必填字段（标记*的字段）
3. 点击"添加产品"保存

### 搜索和筛选

- 使用搜索框输入关键词
- 支持按客户名、产品ID、样式、条码搜索
- 搜索结果实时更新

### 日期筛选

- **默认显示**: 系统默认显示当天的产品数据
- **选择日期**: 使用日期选择器查看任意日期的数据
- **快速切换**: 点击"最近有数据的日期"按钮快速切换
- **今天按钮**: 点击"今天"按钮快速回到当天数据

### 查看产品详情

- 点击产品列表中的眼睛图标查看详情
- 详情页显示所有产品信息

### 删除产品

- 点击产品列表中的垃圾桶图标
- 确认删除操作

## API 端点

### 产品管理 API
- `GET /api/products` - 获取产品列表
- `POST /api/products` - 创建新产品
- `DELETE /api/products?id={id}` - 删除产品

### 统计数据 API
- `GET /api/products/stats` - 获取产品统计数据
- `GET /api/products/status-stats` - 获取状态统计数据

## 数据库管理

### 查看数据库
\`\`\`bash
npx prisma studio
\`\`\`

### 重置数据库架构
\`\`\`bash
npx prisma db push --force-reset
\`\`\`

### 从 Supabase 拉取数据库架构
\`\`\`bash
npx prisma db pull
\`\`\`

## 部署

### 本地构建
\`\`\`bash
npm run build
npm start
\`\`\`

### 环境变量

创建 \`.env.local\` 文件：
\`\`\`
# Supabase 项目配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 数据库连接
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
\`\`\`

## 开发

### 项目结构
\`\`\`
src/
├── app/
│   ├── api/products/     # API路由
│   ├── globals.css       # 全局样式
│   ├── layout.js         # 布局组件
│   └── page.js           # 主页面
├── components/
│   ├── ProductForm.js    # 产品表单
│   ├── ProductList.js    # 产品列表
│   ├── ProductListByStatus.js # 按状态分组列表
│   ├── BulkImport.js     # 批量导入
│   └── StatusStats.js    # 状态统计
├── lib/
│   ├── db.js            # 数据库连接
│   └── supabase.js      # Supabase 客户端
└── generated/
    └── prisma/          # Prisma客户端
\`\`\`

### 添加新功能

1. 修改 \`prisma/schema.prisma\` 更新数据结构
2. 运行 \`npx prisma migrate dev\` 生成迁移
3. 运行 \`npx prisma generate\` 更新客户端
4. 在 \`src/app/api/\` 中添加新的 API 路由
5. 在 \`src/components/\` 中添加新的组件

## 许可证

MIT License