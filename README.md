# Chatbot Demo

一个基于 React + Node.js 的类 ChatGPT 对话问答 Demo，支持前端聊天界面、DeepSeek/OpenAI-compatible 模型调用、流式回答、多轮上下文、本地会话保存和 Markdown 渲染。

## 功能

- 单页聊天界面
- DeepSeek / OpenAI-compatible API 调用
- SSE 流式回答
- 多轮上下文对话
- 新建、切换、删除会话
- 会话保存到 localStorage
- Markdown / GFM 渲染
- 代码块高亮
- 助手回答复制
- 后端保护模型 API Key

## 技术栈

前端：

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- react-markdown
- remark-gfm
- rehype-highlight

后端：

- Node.js
- TypeScript
- Express
- dotenv
- Fetch + SSE stream

## 目录结构

```text
chatbot/
  apps/
    web/              # 前端应用
  server/             # 后端 API 服务
  PLAN.md             # Demo 开发规划
  PRD.md              # 产品需求文档
  package.json        # workspace 脚本
```

## 环境要求

- Node.js 20+
- npm 10+

## 安装依赖

```bash
npm install
```

## 环境变量

后端：

```bash
cp server/.env.example server/.env
```

编辑 `server/.env`：

```text
PORT=3001
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-chat
OPENAI_TLS_REJECT_UNAUTHORIZED=true
```

如果本地网络链路存在自签名证书导致 Node 请求失败，可以在本地 Demo 环境临时设置：

```text
OPENAI_TLS_REJECT_UNAUTHORIZED=false
```

该配置只建议用于本地调试，不建议用于生产环境。

前端：

```bash
cp apps/web/.env.example apps/web/.env
```

默认配置：

```text
VITE_API_BASE_URL=http://localhost:3001
```

## 启动项目

启动后端：

```bash
npm run build -w server
npm run start -w server
```

启动前端：

```bash
npm run dev:web
```

浏览器访问：

```text
http://localhost:5173/
```

## 验证

类型检查：

```bash
npm run typecheck
```

构建：

```bash
npm run build
```

后端健康检查：

```bash
curl http://localhost:3001/api/health
```

流式聊天接口：

```bash
curl -N -X POST http://localhost:3001/api/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"请用一句中文介绍你自己"}],"max_tokens":40}'
```

## 安全说明

- 不要提交真实 `.env` 文件。
- 不要把真实 API Key 写入前端代码。
- 如果 API Key 曾经出现在公开渠道，建议立即在模型服务平台轮换密钥。

## 当前阶段

这是一个快速 Demo 项目，暂不包含：

- 登录 / 注册
- 文件上传
- 知识库 / RAG
- 管理后台
- 数据库持久化
- 计费系统

