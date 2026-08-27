# 项目经营管理系统

Vue 3 + NestJS + PostgreSQL 的单体应用。演示账户 `admin/admin` 是服务器端强制只读的独立数据租户；正式用户通过注册建立账户，所有业务查询均按 `userId` 隔离。

## 本地运行

1. 复制 `.env.example` 为 `.env`，填写本地 PostgreSQL 连接；开发时 COS 为空会写入被 Git 忽略的 `.local-storage/`。
2. 执行 `npm ci`、`npm run prisma:generate`、`npm run prisma:migrate`、`npm run db:seed`。
3. 执行 `npm run dev`，打开 `http://localhost:5173`。

## 生产发布（Ubuntu）

1. 安装 Node.js LTS、PostgreSQL、Nginx、Certbot；创建 `projectmanager` 非 root 用户和 `/opt/project-manager/{releases,current,shared}`。
2. 将仓库发布到新 release，复制 `.env.example` 至 `/opt/project-manager/shared/.env` 并填入真实值。文件权限必须是 `600`。
3. 在 release 内执行 `npm ci --omit=dev` 前先执行构建依赖安装；推荐发布流程为 `npm ci && npm run prisma:generate && npm run build && npm prune --omit=dev && npm run prisma:migrate && npm run db:seed`。
4. 将 `deploy/systemd/project-manager-api.service` 安装至 `/etc/systemd/system/`，并执行 `systemctl daemon-reload && systemctl enable --now project-manager-api`。
5. 将 `deploy/nginx/project-manager.conf` 的 `pm.example.com` 替换为正式域名，安装至 Nginx；先完成 DNS A 记录，再用 Certbot 签发证书并重载 Nginx。
6. UFW 仅放行 80、443 和受限 SSH；不要开放 3000 或 5432。PostgreSQL 与 API 均只监听 `127.0.0.1`。

每日备份可由 root 的 cron 调用 `node /opt/project-manager/current/scripts/backup.mjs`。COS Bucket 必须为私有并开启版本控制；至少每季度执行一次 `pg_restore` 与文件随机抽检。
