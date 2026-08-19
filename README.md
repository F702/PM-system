# 管理者项目经营系统

本仓库按文档要求提供 Vue 3 + NestJS 单体应用。开发环境没有 PostgreSQL 或腾讯云 COS 时，API 会明确使用本地 JSON 数据库和 `uploads/` 目录作为 fallback；生产必须替换为 PostgreSQL、Prisma migration 与私有 COS。

```powershell
npm install
npm run dev
```

打开 http://localhost:5173 ，初始账号为 `admin` / `admin`。首次登录必须设置新密码。

```powershell
npm run check
npm run build
npm start
```
