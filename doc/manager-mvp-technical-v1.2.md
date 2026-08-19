# 项目经营管理系统 V1.3 --- 技术设计文档

> 文档状态：开发基线\
> 目标版本：V1\
> 首版用户：公司管理者\
> 开发模式：单开发者 + AI 辅助开发\
> 本地开发环境：Windows x86_64\
> 生产访问方式：HTTPS 域名\
> 部署约束：不使用 Docker\
> 核心原则：简单、长期可维护、数据可长期保存、后续扩展不更换核心技术栈

------------------------------------------------------------------------

## 1. 技术目标

本系统不是一次性展示型网站，而是公司长期项目数据的事实库和管理入口。技术设计优先级如下：

1.  **数据长期可靠保存**：进行中和历史项目使用同一数据模型，不因"归档"迁移到另一套系统。
2.  **V1
    足够简单**：不因为未来可能需要某功能而提前建设微服务、消息队列、Redis、Kubernetes
    等基础设施。
3.  **未来扩展不换核心栈**：后续增加员工端、更多权限、移动端、AI/LLM、企业微信、定时任务时，继续使用同一
    API 和数据库。
4.  **Windows 开发友好**：开发者直接在 Windows x86_64 上使用 localhost
    开发，不要求 WSL、Docker 或虚拟机。
5.  **生产环境低成本**：一台 Linux x64 VPS 即可运行 Web、API 和
    PostgreSQL；项目文件放对象存储。
6.  **前后端统一主语言**：前端、后端均使用
    TypeScript，降低单开发者维护和 AI Coding 的上下文切换。
7.  **部署路径清晰**：开发阶段
    localhost；验收通过后构建并发布到服务器，由 Nginx 暴露 HTTPS 域名。
8.  **AI 是可插拔能力**：业务系统不依赖某一家模型供应商，也不要求 Python
    才能运行。

------------------------------------------------------------------------

## 2. 最终技术栈

  层                选择                     V1 用途
  ----------------- ------------------------ --------------------------------------------------
  开发系统          Windows x86_64           本地开发、调试、测试
  前端              Vue 3                    管理驾驶舱、项目、经营、设置
  前端语言          TypeScript               与后端统一主语言
  构建工具          Vite                     本地开发和生产构建
  UI 组件           Element Plus             表格、表单、Dialog、Drawer、日期等
  自定义视觉        SCSS + CSS Variables     实现项目自己的高质量视觉体系
  图表              ECharts                  仅在真正需要图表时使用
  状态管理          Pinia                    仅保存登录用户、全局 UI 等必要状态
  路由              Vue Router               SPA 页面路由
  后端              NestJS                   REST API、认证、业务规则、文件签名、未来 AI 编排
  后端语言          TypeScript               与前端统一
  API               REST + JSON              简单、稳定、客户端无关
  ORM / Migration   Prisma                   类型安全数据库访问、版本化迁移
  数据库            PostgreSQL 18            公司长期结构化数据
  文件存储          腾讯云 COS（私有桶）     PDF、Word、Excel、图片等
  密码哈希          Argon2id                 密码不可逆存储
  API 文档          OpenAPI / Swagger        开发期接口契约
  Web Server        Nginx                    HTTPS、静态前端、反向代理
  Node 进程         systemd                  启停、重启、开机自启
  TLS               Let's Encrypt 或云证书   HTTPS
  生产系统          Linux x86_64 VPS         低成本生产环境
  版本控制          Git                      代码、Schema、Migration、配置模板
  包管理            npm                      降低工具数量

### 2.1 明确不使用

V1 不使用：

-   Docker / Docker Compose
-   Kubernetes
-   Redis
-   Kafka / RabbitMQ
-   微服务
-   GraphQL
-   Elasticsearch
-   独立数据仓库
-   SSR / Next.js
-   Tailwind CSS
-   Python 作为核心业务后端
-   向量数据库
-   独立 AI 服务

这些并非永远禁止，而是当前没有真实需求证明其复杂度值得引入。

------------------------------------------------------------------------

## 3. 为什么选择这套技术栈

### 3.1 为什么核心后端选择 NestJS + TypeScript

系统的主体长期仍然是：

-   用户与权限
-   项目
-   客户
-   项目负责人
-   关键节点
-   合同
-   发票
-   回款
-   造价成果
-   文件
-   历史数据
-   风险规则
-   审计

这些是典型的事务型 Web 业务。

NestJS 提供 Module、Controller、Service、Guard、Interceptor、Validation
等明确结构，适合把业务模块长期拆清楚，同时 V1 仍然只部署为**一个单体 API
进程**。

TypeScript 使前后端共享：

-   DTO 类型
-   枚举
-   API 类型
-   通用校验概念
-   日期/金额格式约定

对"一个开发者 + AI 辅助开发"而言，比同时维护 JavaScript/TypeScript +
Python 两套主要语言更简单。

### 3.2 为什么不是 Python 作为核心业务后端

Python + FastAPI/Django 完全能够实现本系统，也非常成熟。

本项目不优先选择 Python 的原因不是性能或能力不足，而是当前主要工作是业务
Web 系统，而不是训练模型、机器学习或复杂数据科学。

如果核心后端使用 Python，则日常至少存在：

``` text
Vue / TypeScript
        +
Python / FastAPI 或 Django
```

当前没有足够收益抵消第二套主要语言带来的维护成本。

因此原则是：

> **业务系统使用 TypeScript；真正出现 Python 独有优势的
> AI/数据任务时，再增加独立 Python Worker，而不是迁移整个后端。**

### 3.3 NestJS 是否支持未来 LLM

支持，而且不需要改变核心技术栈。

未来典型调用链：

``` text
Vue
 │
 ▼
NestJS API
 │
 ├── ProjectModule
 ├── DocumentModule
 ├── ContractModule
 └── AiModule
       │
       ├── LlmProvider
       ├── DocumentExtractionService
       └── ReportGenerationService
             │
             ▼
       外部 LLM / 文档解析 API
```

LLM 对业务后端本质上是 HTTPS API 服务。NestJS 可以直接使用模型厂商的
Node.js/TypeScript SDK 或标准 HTTP 客户端。

V1 不实现 LLM，但预留清晰边界：

``` ts
interface LlmProvider {
  generate(input: GenerateInput): Promise<GenerateResult>;
}
```

未来业务模块只能调用 `AiService`，不能直接绑定某个模型厂商 SDK。

### 3.4 什么时候才引入 Python

仅在出现以下真实需求后考虑：

-   本地部署模型；
-   PyTorch / Transformers 推理；
-   大规模 pandas / NumPy 数据处理；
-   复杂 OCR/版面分析流水线；
-   自建 embedding / reranker；
-   机器学习训练；
-   TypeScript 生态明显无法满足的科学计算。

届时架构为：

``` text
NestJS 核心业务 API
        │
        │ HTTP / Job
        ▼
Python AI Worker
        │
        ├── OCR
        ├── ML
        ├── Embedding
        └── Local Model
```

PostgreSQL、Vue、NestJS 和业务 API 均无需迁移。

------------------------------------------------------------------------

## 4. 总体架构

``` text
开发环境（Windows x86_64）

Chrome / Edge
     │
     ▼
http://localhost:5173
     │
     ▼
Vue 3 + Vite
     │
     │ /api/* 由 Vite Proxy 转发
     ▼
http://localhost:3000
     │
     ▼
NestJS
     │
     ├──────── PostgreSQL localhost:5432
     │
     └──────── COS（开发可使用测试桶）
```

生产环境：

``` text
用户 Windows / 手机浏览器
          │
          ▼
https://pm.example.com
          │
          ▼
        Nginx
     ┌────┴───────────────┐
     │                    │
     ▼                    ▼
Vue dist             /api/*
静态文件                  │
                         ▼
                  NestJS 127.0.0.1:3000
                         │
                ┌────────┴─────────┐
                ▼                  ▼
        PostgreSQL           腾讯云 COS
        127.0.0.1:5432       私有对象存储
```

### 4.1 公网暴露原则

只允许公网访问：

``` text
80/tcp   → 仅用于跳转 HTTPS
443/tcp  → HTTPS
```

不得向公网开放：

``` text
3000     NestJS
5432     PostgreSQL
```

"通过域名访问"不等于把 Node 或数据库端口直接暴露到公网。

------------------------------------------------------------------------

## 5. 仓库结构

采用单仓库 Monorepo，但不是微服务。

``` text
project-manager/
├─ apps/
│  ├─ web/                     # Vue 3
│  │  ├─ src/
│  │  │  ├─ api/
│  │  │  ├─ assets/
│  │  │  ├─ components/
│  │  │  ├─ layouts/
│  │  │  ├─ router/
│  │  │  ├─ stores/
│  │  │  ├─ styles/
│  │  │  └─ views/
│  │  └─ vite.config.ts
│  │
│  └─ api/                     # NestJS
│     ├─ src/
│     │  ├─ auth/
│     │  ├─ users/
│     │  ├─ employees/
│     │  ├─ clients/
│     │  ├─ projects/
│     │  ├─ milestones/
│     │  ├─ contracts/
│     │  ├─ finance/
│     │  ├─ cost-results/
│     │  ├─ documents/
│     │  ├─ dashboard/
│     │  ├─ audit/
│     │  ├─ ai/                # V1 仅保留接口边界
│     │  ├─ common/
│     │  └─ main.ts
│     └─ prisma/
│        ├─ schema.prisma
│        └─ migrations/
│
├─ packages/
│  └─ shared/
│     ├─ types/
│     ├─ enums/
│     └─ constants/
│
├─ package.json
├─ package-lock.json
├─ .env.example
└─ README.md
```

### 5.1 模块边界原则

禁止形成：

``` text
ProjectService
  直接操作 Invoice
  直接操作 Payment
  直接调用 COS SDK
  直接调用 LLM SDK
```

应通过明确服务边界：

``` text
ProjectService
FinanceService
DocumentService
AiService
```

V1 是**模块化单体**：

-   一个仓库；
-   一个 NestJS 应用；
-   一个 PostgreSQL；
-   一个前端；
-   一个部署单元。

------------------------------------------------------------------------

## 6. 本地 Windows 开发环境

### 6.1 必需软件

Windows x86_64 安装：

1.  Git
2.  Node.js 24 LTS x64
3.  PostgreSQL 18 x64
4.  VS Code
5.  Chrome 或 Edge

不要求：

-   Docker Desktop
-   WSL
-   Linux VM

### 6.2 本地地址

``` text
Web:        http://localhost:5173
API:        http://localhost:3000
PostgreSQL: localhost:5432
```

### 6.3 Vite Proxy

前端业务代码统一请求：

``` text
/api/projects
/api/dashboard
/api/contracts
```

不要在组件里写：

``` text
http://localhost:3000/api/projects
```

开发环境由 Vite 转发：

``` text
/api/* → http://localhost:3000
```

生产环境由 Nginx 转发：

``` text
/api/* → http://127.0.0.1:3000
```

因此前端业务代码无需区分 localhost 和正式域名。

### 6.4 开发启动

根目录目标命令：

``` bash
npm install
npm run dev
```

`npm run dev` 同时启动：

-   Vue/Vite；
-   NestJS watch mode。

数据库单独由 Windows PostgreSQL 服务运行。

------------------------------------------------------------------------

## 7. 前端技术设计

### 7.1 Vue 3

采用 Composition API：

``` vue
<script setup lang="ts">
</script>
```

不混用 Options API。

### 7.2 Element Plus

Element Plus 负责成熟的交互基础：

-   Input
-   Select
-   DatePicker
-   Table
-   Pagination
-   Dialog
-   Drawer
-   Form
-   Dropdown
-   Upload
-   Tooltip
-   Skeleton

但视觉设计不直接使用默认主题作为最终产品样式。

通过：

``` text
CSS Variables
SCSS
自定义 Layout
自定义数据卡片
自定义表格密度
自定义排版
```

实现 UI 文档定义的视觉效果。

### 7.3 响应式设计

必须同时支持：

``` text
Desktop ≥ 1280px
Tablet  768–1279px
Mobile  < 768px
```

不能把 PC 页面简单缩小。

典型变化：

``` text
Desktop Table
     ↓ Mobile
Card / Key-value List
```

``` text
Desktop Side Drawer
     ↓ Mobile
Bottom Sheet / Full-screen Sheet
```

### 7.4 状态管理

Pinia 只保存真正全局状态：

-   当前登录用户；
-   登录状态；
-   必要 UI 状态。

项目列表、项目详情等服务端数据不长期复制到全局 Store。

避免建立一个"大 Store"。

------------------------------------------------------------------------

## 8. API 设计

统一前缀：

``` text
/api/v1
```

示例：

``` text
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/change-password

GET    /api/v1/dashboard

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id

GET    /api/v1/projects/:id/milestones
POST   /api/v1/projects/:id/milestones

GET    /api/v1/projects/:id/contracts
POST   /api/v1/projects/:id/contracts

GET    /api/v1/projects/:id/documents
POST   /api/v1/projects/:id/documents

GET    /api/v1/finance/summary
```

### 8.1 REST 原则

V1 不使用 GraphQL。

理由：

-   数据关系明确；
-   客户端少；
-   REST 更容易调试；
-   OpenAPI 工具成熟；
-   AI Coding 更容易遵循稳定契约。

### 8.2 DTO 校验

所有外部输入必须经过 DTO 校验。

原则：

``` text
Browser 输入
     ↓
DTO validation
     ↓
Business Service
     ↓
Prisma
```

Controller 不直接把任意 JSON 写入 Prisma。

------------------------------------------------------------------------

## 9. PostgreSQL 数据设计原则

PostgreSQL 是公司长期项目数据的核心资产。

### 9.1 核心对象

``` text
User
Employee
Client
Project
ProjectService
Milestone
Contract
Invoice
Payment
CostResult
Document
FileAsset
AuditEvent
```

经营聚合是从上述项目与经营事实实时推导的查询结果，**不**建立 `FinanceAggregation`、按年份汇总表或按客户汇总表来重复保存金额。

### 9.2 项目不物理区分"当前库"和"历史库"

所有项目在同一个 `project` 表。

状态例如：

``` text
PLANNED
ACTIVE
PAUSED
COMPLETED
CANCELLED
```

归档项目只是：

``` text
status = COMPLETED
completed_at = ...
```

而不是：

``` text
active_project
history_project
```

两套表。

这样十年后仍然可以统一搜索和统计。

### 9.3 ID

业务主键使用 UUID。

业务可读编号单独保存：

``` text
id          UUID
project_no  PM-2026-0018
```

用户和外部 API 不依赖数据库自增 ID。

### 9.4 金额

金额禁止使用 JavaScript `number` 做最终财务计算。

数据库采用：

``` text
NUMERIC(18,2)
```

Prisma 使用 `Decimal`。

示例字段：

``` text
contract_amount
invoice_amount
payment_amount
cost_result_amount
```

必须区分：

-   工程/采购标的金额；
-   造价成果金额；
-   本公司服务合同金额；
-   已开票金额；
-   已回款金额；
-   应收金额。

### 9.5 日期

数据库：

``` text
业务日期：DATE
精确时间：TIMESTAMPTZ
```

例如：

``` text
bid_open_date       DATE
planned_end_date    DATE
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
last_login_at       TIMESTAMPTZ
```

### 9.6 删除策略

公司长期业务数据默认不物理删除。

使用：

``` text
archived_at
disabled_at
cancelled_at
```

真正物理删除仅用于：

-   测试数据；
-   未形成业务关系的错误草稿；
-   法律/合规要求的数据删除。

关键删除动作必须记录审计。

### 9.7 服务类型、项目年份与经营聚合

`Project` 保存统一的经营筛选年份：历史导入必须提供；手工新建默认写入当前年份，并可在“更多信息”中调整。数据库始终保存：

```text
business_year  SMALLINT NOT NULL
```

它表示该项目归属的业务年份，不依赖合同、开票或回款日期推导，以保证历史项目可稳定检索。`ProjectService.service_type` 使用受控枚举：

```text
BIDDING          // 招标代理
COST             // 造价/预结算
SUPERVISION      // 监理
OTHER            // 非常规服务
```

当 `service_type = OTHER` 时，`other_service_description` 必填；其他类型该字段为 `NULL`。不允许以任意字符串代替枚举，从而保证“按服务类型”的跨年统计稳定可靠。

经营按年份、服务类型、客户的聚合均从有效项目、合同、发票、回款实时计算。实现时先得到去重后的 `project_id` 范围，再分别聚合金额；禁止把 `ProjectService` 与合同/发票/回款明细直接多表联接后求和，否则一个多服务项目会被重复计金额。

```text
有效项目范围（按年份 / 客户 / 服务类型过滤）
       ↓  project_id 去重
合同、发票、回款分别按 project_id 聚合
       ↓
合同额、已开票、已回款、应收 = 合同额 - 已回款
```

“按服务类型”分组中，一个项目可属于多组，但每组内部只计一次；因此服务类型各组总额不可再相加为公司总额。API 必须返回该语义，前端须展示说明。

建议索引：

```text
project(business_year, client_id, status)
project_service(service_type, project_id)
contract(project_id, is_void)
invoice(contract_id, is_void)
payment(contract_id, is_void)
```

### 9.8 经营聚合 API 与查询约束

经营模块提供两个只读接口，查询参数可以组合：

```text
GET /api/v1/finance/overview
  ?businessYear=2026
  &serviceType=OTHER
  &clientId=<uuid>
  &groupBy=businessYear|serviceType|client

GET /api/v1/finance/projects
  ?businessYear=2026
  &serviceType=OTHER
  &clientId=<uuid>
  &page=1&pageSize=20
```

`overview` 返回当前范围的 `projectCount`、`contractAmount`、`invoiceAmount`、`paymentAmount`、`receivableAmount`、逾期金额，以及选定维度的聚合行；`projects` 返回同一范围的分页项目经营列表。金额字段继续以 Prisma `Decimal` / JSON 字符串传输，前端仅负责展示，不做浮点金额运算。

聚合查询必须在 `FinanceService` 中实现并覆盖集成测试：单服务项目、多服务项目、`OTHER` 服务、空金额、作废单据、同一客户跨年项目，以及过滤条件交集。Controller 只解析 DTO，不能拼接 SQL 或自行计算金额。

------------------------------------------------------------------------

## 10. Prisma 与数据库迁移

数据库结构必须由代码版本管理。

开发环境：

``` bash
npx prisma migrate dev
```

生产环境：

``` bash
npx prisma migrate deploy
```

禁止：

1.  在生产数据库 GUI 中直接新增字段；
2.  手工改表后不生成 Migration；
3.  修改已经在生产执行过的 Migration；
4.  使用 `db push` 代替生产 Migration。

迁移目录进入 Git：

``` text
apps/api/prisma/migrations/
```

每次生产部署顺序：

``` text
数据库备份
   ↓
代码更新
   ↓
npm ci
   ↓
build
   ↓
prisma migrate deploy
   ↓
重启 API
   ↓
health check
```

------------------------------------------------------------------------

## 11. 登录与认证

### 11.1 初始账号

产品要求初始：

``` text
username: admin
password: admin
```

数据库绝不能保存明文 `admin`。

初始化脚本生成 Argon2id hash：

``` text
username = admin
password_hash = <argon2id hash>
must_change_password = true
```

### 11.2 第一次登录

``` text
admin/admin
    ↓
认证成功
    ↓
must_change_password = true
    ↓
只允许进入“修改密码”
    ↓
新密码保存
    ↓
must_change_password = false
    ↓
进入驾驶舱
```

### 11.3 公网上线要求

**正式域名开放公网前必须完成 admin 默认密码修改。**

`admin/admin` 仅作为初始化便利，不作为可长期使用的生产凭据。

### 11.4 Session 方案

V1 推荐：

``` text
HttpOnly Secure Cookie
+
PostgreSQL Session
```

不把长期认证 Token 放 LocalStorage。

Cookie：

``` text
HttpOnly = true
Secure = production true
SameSite = Lax
```

### 11.5 登录保护

V1 至少实现：

-   登录失败次数限制；
-   失败日志；
-   Session 过期；
-   修改密码后注销其他 Session；
-   账号禁用；
-   CSRF 防护；
-   密码哈希；
-   HTTPS。

------------------------------------------------------------------------

## 12. 权限扩展

V1 只有管理者登录，但数据模型不能把：

``` text
if username === 'admin'
```

写进业务逻辑。

从第一版建立：

``` text
User
Role
```

V1 可只有：

``` text
ADMIN
```

未来：

``` text
MANAGER
EMPLOYEE
FINANCE
VIEWER
```

再增加项目范围权限。

这样员工端上线时无需替换认证体系。

------------------------------------------------------------------------

## 13. 文件架构

文件不存 PostgreSQL 二进制。

### 13.1 PostgreSQL

保存：

``` text
FileAsset
- id
- original_name
- object_key
- mime_type
- size
- checksum
- created_at
```

### 13.2 COS

保存实际内容：

``` text
projects/{project_uuid}/documents/{document_uuid}/{file_uuid}.pdf
```

不要把用户输入的中文项目名作为唯一对象路径。

### 13.3 私有访问

COS Bucket 使用私有读写。

下载流程：

``` text
Browser
   ↓
NestJS 检查权限
   ↓
生成短时签名 URL
   ↓
Browser → COS
```

不使用永久公开 URL。

------------------------------------------------------------------------

## 14. 风险计算

V1 风险不是独立业务系统。

它是现有事实数据的派生结果。

例如：

``` text
planned_date < today
AND actual_date IS NULL
→ OVERDUE
```

``` text
receivable > 0
AND expected_payment_date < today
→ PAYMENT_OVERDUE
```

优先使用 NestJS Business Rule + PostgreSQL 查询计算。

不要为了风险系统增加：

``` text
risk_workflow
risk_task
risk_engine
```

除非未来真实业务证明需要人工处理风险生命周期。

------------------------------------------------------------------------

## 15. AI / LLM 扩展架构

V1 不依赖 AI 才能正常工作。

未来 AI 能力必须作为 Adapter 加入。

### 15.1 AiModule

``` text
AiModule
├─ AiService
├─ LlmProvider
├─ DocumentParserProvider
├─ ExtractionService
└─ AiJobService
```

### 15.2 Provider 规则

业务代码禁止：

``` ts
import OpenAI from 'openai'
```

然后直接在 `ContractService` 中调用。

应为：

``` text
ContractService
     ↓
AiService
     ↓
LlmProvider
     ↓
具体模型 SDK
```

未来可替换：

``` text
Provider A
   ↓
Provider B
   ↓
本地模型 Gateway
```

不改变 ContractModule。

### 15.3 AI 写入原则

AI 结果默认不能直接覆盖正式业务事实。

流程：

``` text
文件
 ↓
解析
 ↓
LLM 提取
 ↓
Draft JSON
 ↓
用户确认/修正
 ↓
正式业务字段
```

### 15.4 未来 RAG

若以后需要"查询历史项目/项目文档问答"，优先评估 PostgreSQL
自身全文检索和 `pgvector`。

不要第一天部署独立向量数据库。

只有实际数据量和性能测试证明 PostgreSQL 不够时再引入独立搜索基础设施。

------------------------------------------------------------------------

## 16. 生产部署（无 Docker）

### 16.1 服务器

生产环境建议：

``` text
Linux x86_64 VPS
2 vCPU
4 GB RAM
SSD
```

早期 1--2 个管理者使用时已经充足。

数据库与 API 初期可同机，文件使用 COS。

### 16.2 目录

``` text
/opt/project-manager/
├─ current/
├─ releases/
└─ shared/
   └─ .env
```

前端构建结果：

``` text
/var/www/project-manager/
```

### 16.3 NestJS

构建：

``` bash
npm ci
npm run build
```

运行：

``` bash
NODE_ENV=production node dist/main.js
```

由 systemd 管理：

``` text
project-manager-api.service
```

职责：

-   开机自启；
-   崩溃重启；
-   日志进入 journal；
-   统一启停。

### 16.4 Nginx

逻辑：

``` text
https://pm.example.com/
        ↓
Vue dist

https://pm.example.com/api/
        ↓
127.0.0.1:3000
```

Nginx 同时负责：

-   TLS；
-   HTTP → HTTPS；
-   静态文件；
-   API Reverse Proxy；
-   上传大小限制；
-   基础安全 Header；
-   gzip/brotli（按服务器支持配置）。

------------------------------------------------------------------------

## 17. 域名上线流程

### 阶段 A：本地开发

``` text
http://localhost:5173
```

### 阶段 B：本地验收

完成：

-   单元测试；
-   API 测试；
-   页面响应式检查；
-   数据迁移测试；
-   备份恢复测试。

### 阶段 C：生产服务器

部署：

``` text
Vue dist
NestJS
PostgreSQL
Nginx
systemd
```

### 阶段 D：域名

DNS：

``` text
pm.example.com → 服务器公网 IP
```

### 阶段 E：HTTPS

配置证书：

``` text
https://pm.example.com
```

### 阶段 F：公网前检查

必须：

-   修改默认 admin 密码；
-   关闭 PostgreSQL 公网端口；
-   关闭 Node 3000 公网端口；
-   开启 HTTPS；
-   验证数据库备份；
-   验证文件备份；
-   验证恢复流程；
-   设置防火墙；
-   检查 `.env` 不在 Git；
-   生产关闭调试信息。

如果服务器位于中国大陆并使用域名提供互联网信息服务，还需按实际主体和服务性质完成适用的备案/合规流程。

------------------------------------------------------------------------

## 18. 环境变量

`.env.example` 只保存键名和示例，不保存真实 Secret。

``` text
NODE_ENV=
PORT=

DATABASE_URL=

SESSION_SECRET=

COS_REGION=
COS_BUCKET=
COS_SECRET_ID=
COS_SECRET_KEY=

APP_ORIGIN=
```

生产 Secret：

-   不进入 Git；
-   不写进前端；
-   不硬编码；
-   不写在 README。

------------------------------------------------------------------------

## 19. 备份与恢复

"有备份"不等于"能恢复"。

### 19.1 PostgreSQL

至少：

``` text
每日自动逻辑备份
+
保留多个历史版本
+
异地/对象存储副本
```

### 19.2 COS

建议：

-   Bucket Versioning；
-   生命周期策略；
-   关键文件避免无痕覆盖。

### 19.3 恢复演练

至少每季度：

1.  新建临时 PostgreSQL；
2.  从备份恢复；
3.  随机验证项目、合同、金额；
4.  随机恢复几个文件；
5.  验证数据库记录和 COS 对象对应；
6.  记录恢复耗时。

------------------------------------------------------------------------

## 20. 日志与审计

区分两种日志。

### 应用日志

用于开发维护：

``` text
request_id
route
status
duration
error
```

禁止记录：

-   密码；
-   Session Secret；
-   COS Secret；
-   完整敏感合同正文。

### 业务审计

用于回答：

> 谁在什么时候改了什么？

`AuditEvent`：

``` text
id
user_id
action
entity_type
entity_id
before_json
after_json
created_at
```

V1 至少审计：

-   项目关键字段；
-   合同金额；
-   发票；
-   回款；
-   删除/归档；
-   密码/账号管理相关安全事件。

------------------------------------------------------------------------

## 21. 测试策略

单开发者项目不能追求"所有代码 100% 覆盖"。

测试优先级：

### P0

必须自动测试：

-   登录；
-   首次强制改密；
-   权限；
-   金额计算；
-   应收计算；
-   风险规则；
-   项目状态；
-   数据迁移。

### P1

集成测试：

-   项目 CRUD；
-   合同；
-   发票；
-   回款；
-   文件元数据；
-   Dashboard 聚合。

### P2

关键 E2E：

``` text
登录
→ 驾驶舱
→ 新建项目
→ 填合同
→ 填回款
→ 项目完成
→ 历史搜索
```

------------------------------------------------------------------------

## 22. AI Coding 工程约束

AI 可以生成代码，但不能自行改变架构。

每次任务应明确：

``` text
允许修改哪些模块
数据库是否允许变化
API 契约是否允许变化
必须补哪些测试
禁止引入哪些依赖
```

### AI 不得自行执行的决策

-   引入 Redis；
-   引入消息队列；
-   新建微服务；
-   修改认证模式；
-   修改金额存储方式；
-   修改 Project 顶层模型；
-   引入第二数据库；
-   替换 Prisma；
-   引入新的前端框架；
-   把业务逻辑放到 Controller；
-   AI 结果直接写正式数据。

这些必须经过人工架构审查。

------------------------------------------------------------------------

## 23. 对抗性审查

### 23.1 Vue + NestJS 是否过度设计？

**结论：不是，但必须坚持单体。**

Vue 和 NestJS 增加了前后端边界，但换来：

-   未来员工端复用 API；
-   移动 Web 复用；
-   小程序可复用 API；
-   AI 可挂到后端；
-   UI 交互不受服务端模板限制。

考虑到产品明确计划扩展，这个成本合理。

### 23.2 是否应该 V1 就使用 Python？

**否。**

没有训练模型或复杂科学计算需求。为了"未来可能
AI"增加第二主语言属于提前复杂化。

### 23.3 是否应该 V1 使用 Redis？

**否。**

1--2 个管理者不需要。

### 23.4 是否应该数据库和 API 分两台服务器？

**否。**

早期同机更便宜、更容易维护。先通过备份保证可恢复性。

### 23.5 是否应该用云数据库？

**V1 非必须。**

如果未来"不愿维护 PostgreSQL"成为真实痛点，可迁移托管 PostgreSQL。Prisma
和应用层无需重写。

### 23.6 是否应该做独立 AI 微服务？

**V1 否。**

LLM API 可由 NestJS 直接调用。只有 Python 专属 AI 需求真正出现后再拆。

### 23.7 是否应该引入向量数据库？

**否。**

V1 没有 RAG。未来先评估 PostgreSQL + pgvector。

### 23.8 是否应该使用 Docker 解决环境一致性？

**当前否。**

用户明确要求非 Docker，且只有一个开发者。通过：

-   固定 Node LTS；
-   `package-lock.json`；
-   Prisma Migration；
-   `.env.example`；
-   自动部署脚本；
-   staging 验证；

已经可以获得足够的可重复性。

------------------------------------------------------------------------

## 24. 扩展路线与"不换栈"验证

### 增加员工账号

``` text
Vue
NestJS Auth
PostgreSQL User/Role
```

核心栈不变。

### 增加员工工作台

增加 Vue Route + NestJS Module。

核心栈不变。

### 增加手机端高频操作

继续响应式 Vue；必要时增加独立移动客户端调用同一 REST API。

核心后端不变。

### 增加企业微信

``` text
NestJS
  ↓
WeCom Adapter
```

核心栈不变。

### 增加 LLM

``` text
NestJS AiModule
  ↓
LLM Provider
```

核心栈不变。

### 增加复杂 Python AI

``` text
NestJS
  ↓
Python AI Worker
```

核心业务栈不变。

### 数据增长到数万项目

优先：

-   PostgreSQL 索引；
-   查询优化；
-   分页；
-   缓存热点结果（真实需要后再引入）。

不先换数据库。

------------------------------------------------------------------------

## 25. 技术升级原则

长期稳定不等于永远不升级。

### Node.js

使用 LTS 大版本。

升级策略：

-   不追 Current；
-   LTS 进入稳定期后升级；
-   大版本升级先在本地和 staging 验证。

### PostgreSQL

使用受官方支持的 Major Version，并持续安装当前 Major 的 Minor Update。

Major 升级必须：

``` text
备份
→ staging 恢复
→ 应用测试
→ 正式升级
```

### npm 依赖

不使用：

``` text
"*"
"latest"
```

提交：

``` text
package-lock.json
```

生产使用：

``` bash
npm ci
```

------------------------------------------------------------------------

## 26. 最终架构基线

``` text
                         ┌──────────────────────┐
                         │ Windows / Mobile Web │
                         └──────────┬───────────┘
                                    │
                                    │ HTTPS
                                    ▼
                              ┌───────────┐
                              │   Nginx   │
                              └─────┬─────┘
                         ┌──────────┴──────────┐
                         │                     │
                         ▼                     ▼
                    Vue 3 dist            /api/v1/*
                                               │
                                               ▼
                                      ┌────────────────┐
                                      │ NestJS Monolith │
                                      │   TypeScript    │
                                      └───────┬────────┘
                                  ┌───────────┼────────────┐
                                  │           │            │
                                  ▼           ▼            ▼
                            PostgreSQL       COS      Future LLM
                                18         Private      Provider
```

开发环境：

``` text
Windows x86_64
     │
     ├─ localhost:5173  Vue/Vite
     ├─ localhost:3000  NestJS
     └─ localhost:5432  PostgreSQL
```

生产环境：

``` text
Linux x86_64 VPS
     │
     ├─ Nginx :443
     ├─ NestJS :3000（仅 localhost）
     └─ PostgreSQL :5432（仅 localhost）

外部：
     └─ COS 私有对象存储
```

------------------------------------------------------------------------

## 27. 最终结论

V1 技术基线固定为：

``` text
Vue 3
TypeScript
Vite
Element Plus
SCSS / CSS Variables
ECharts（按需）

NestJS
TypeScript
Prisma
PostgreSQL 18

腾讯云 COS

Windows x86_64 localhost 开发
Linux x86_64 VPS 生产
Nginx + systemd
HTTPS 域名
不使用 Docker
```

该方案的核心不是追求技术数量最少，而是让**第一版足够简单，同时未来增加员工端、移动端、权限、AI/LLM、企业微信和更大数据量时，不需要推翻前端、核心后端或主数据库**。

架构升级的唯一合法理由应是：

> **已经出现经过测量的真实瓶颈或真实业务需求。**

不能因为"以后可能需要"提前引入复杂基础设施。
