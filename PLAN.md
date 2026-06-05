# 类 ChatGPT 对话问答 Demo 开发规划

## 1. Demo 目标

快速开发一个可运行的对话问答 Demo，重点验证核心体验：

- 用户可以在网页里输入问题。
- 系统可以调用大模型接口生成回答。
- 回答支持流式输出。
- 页面展示方式类似 ChatGPT。
- 支持简单的多轮上下文。
- 暂时不做登录、注册、上传文件、知识库、管理后台、计费等复杂功能。

这个阶段的目标不是做完整产品，而是尽快做出一个能演示、能迭代、能扩展的最小版本。

## 2. 暂不实现的功能

为了快速完成 Demo，以下功能先不做：

- 用户登录 / 注册。
- 第三方登录。
- 文件上传。
- 文档解析。
- 知识库问答 / RAG。
- 管理后台。
- 用户权限。
- 计费系统。
- 团队协作。
- 复杂 Agent 工作流。
- 多租户数据隔离。

这些功能可以在 Demo 验证通过后再逐步补充。

## 3. Demo 核心功能

### 3.1 前端功能

- 单页聊天界面
  - 左侧可选会话列表。
  - 中间展示聊天消息。
  - 底部输入框。

- 消息输入
  - 多行文本输入。
  - Enter 发送，Shift + Enter 换行。
  - 发送时禁用重复提交。
  - 支持停止生成。

- 消息展示
  - 用户消息和助手消息区分样式。
  - 助手回答支持流式逐步展示。
  - 支持 Markdown。
  - 支持代码块高亮。
  - 支持复制回答内容。

- 会话能力
  - 新建会话。
  - 当前会话内保留多轮上下文。
  - 会话标题可用第一条用户消息自动截取生成。
  - Demo 阶段可将会话存到浏览器 localStorage。

- 基础状态
  - 空状态提示。
  - 加载中状态。
  - 接口错误提示。
  - 模型生成中状态。

### 3.2 后端功能

- 提供聊天接口
  - 接收前端传来的 messages。
  - 调用大模型 API。
  - 将模型输出以流式方式返回前端。

- 模型调用封装
  - 从环境变量读取 API Key。
  - 支持配置模型名称。
  - 支持 temperature、max_tokens 等基础参数。
  - 捕获模型调用错误并返回友好错误信息。

- 简单上下文处理
  - Demo 阶段由前端传递当前会话消息。
  - 后端只做必要裁剪，避免上下文过长。
  - 默认保留最近若干轮对话。

- 健康检查
  - 提供 `/api/health` 方便确认服务是否启动。

## 4. 推荐技术架构

### 4.1 前端

- React + TypeScript。
- Vite。
- Tailwind CSS。
- Zustand：管理当前会话、消息、生成状态。
- react-markdown + remark-gfm：渲染 Markdown。
- rehype-highlight 或 shiki：代码高亮。
- Fetch ReadableStream：读取后端流式响应。

### 4.2 后端

为了 Demo 快速落地，推荐使用轻量方案：

- Node.js + TypeScript。
- Express 或 Fastify。
- OpenAI SDK 或兼容 OpenAI API 的 SDK。
- SSE 或 ReadableStream 返回流式数据。
- dotenv 读取环境变量。

如果后续要扩展成正式产品，再迁移到 NestJS、PostgreSQL、Redis、队列和权限系统。

### 4.3 数据存储

Demo 阶段不接数据库：

- 会话和消息暂存在浏览器 localStorage。
- 后端不持久化消息。
- 刷新页面后仍可恢复本地历史。
- 换浏览器或清空缓存后历史会丢失，这是 Demo 阶段可以接受的取舍。

## 5. 推荐系统架构

```text
Browser
  |
  v
React + Vite Chat UI
  |
  | POST /api/chat/stream
  v
Node.js API Server
  |
  v
LLM Provider
```

前端负责：

- 管理界面状态。
- 保存本地会话。
- 收集当前上下文消息。
- 渲染模型流式输出。

后端负责：

- 保护 API Key。
- 转发请求给大模型。
- 将大模型输出流式转发给前端。
- 做基础错误处理和上下文长度保护。

## 6. 接口设计

### 6.1 健康检查

`GET /api/health`

返回示例：

```json
{
  "status": "ok"
}
```

### 6.2 流式聊天

`POST /api/chat/stream`

请求示例：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "帮我解释一下什么是向量数据库"
    }
  ],
  "model": "gpt-4.1-mini",
  "temperature": 0.7
}
```

响应方式：

- 使用 SSE 或普通 chunked stream。
- 每个 chunk 返回一小段模型输出。
- 前端收到后追加到当前助手消息中。

建议事件格式：

```text
data: {"type":"delta","content":"你好"}
data: {"type":"delta","content":"，我可以"}
data: {"type":"done"}
```

错误事件格式：

```text
data: {"type":"error","message":"模型调用失败，请稍后重试"}
```

## 7. 前端页面结构

```text
src/
  App.tsx
  main.tsx
  styles.css
  components/
    ChatLayout.tsx
    ConversationSidebar.tsx
    MessageList.tsx
    MessageItem.tsx
    ChatInput.tsx
    MarkdownMessage.tsx
  stores/
    chatStore.ts
  services/
    chatApi.ts
  types/
    chat.ts
```

关键组件说明：

- `ChatLayout.tsx`：整体聊天布局。
- `ConversationSidebar.tsx`：会话列表和新建会话按钮。
- `MessageList.tsx`：消息列表。
- `MessageItem.tsx`：单条消息。
- `ChatInput.tsx`：输入框、发送按钮、停止按钮。
- `MarkdownMessage.tsx`：Markdown 和代码块渲染。
- `chatStore.ts`：会话、消息、当前生成状态。
- `chatApi.ts`：调用后端流式接口。

## 8. 后端目录结构

```text
server/
  src/
    index.ts
    routes/
      chat.ts
      health.ts
    services/
      llmClient.ts
    types/
      chat.ts
  .env.example
```

关键模块说明：

- `index.ts`：启动 Express / Fastify 服务。
- `routes/chat.ts`：处理聊天流式接口。
- `routes/health.ts`：健康检查。
- `services/llmClient.ts`：封装模型调用。
- `types/chat.ts`：定义消息类型。

## 9. 环境变量

`.env.example` 建议包含：

```text
PORT=3001
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

如果使用其他兼容 OpenAI API 的模型服务，只需要调整 `OPENAI_BASE_URL` 和 `OPENAI_MODEL`。

## 10. 流式回答流程

1. 用户在输入框提交问题。
2. 前端将用户消息加入当前会话。
3. 前端创建一条空的助手消息。
4. 前端调用 `/api/chat/stream`。
5. 后端调用大模型流式接口。
6. 后端不断把模型增量内容转发给前端。
7. 前端持续追加内容到助手消息。
8. 模型结束后，前端将会话保存到 localStorage。

## 11. Demo 开发步骤

### Step 1：搭建项目

- 创建 Vite React 前端。
- 创建 Node.js 后端。
- 配置 TypeScript。
- 配置前端代理到后端接口。

### Step 2：实现后端

- 实现 `/api/health`。
- 实现 `/api/chat/stream`。
- 接入模型 SDK。
- 实现流式响应。
- 加入基础错误处理。

### Step 3：实现前端

- 搭建聊天布局。
- 实现消息列表。
- 实现输入框。
- 实现调用流式接口。
- 实现 Markdown 渲染。
- 实现生成中和错误状态。

### Step 4：实现本地会话

- 新建会话。
- 切换会话。
- 将会话保存到 localStorage。
- 页面刷新后恢复会话。

### Step 5：联调和演示

- 测试普通问答。
- 测试多轮对话。
- 测试代码块回答。
- 测试停止生成。
- 测试接口失败提示。

## 12. Demo 验收标准

- 页面打开后可以直接开始聊天。
- 不需要登录。
- 不需要上传文件。
- 输入问题后能看到流式回答。
- 支持至少 5 轮连续上下文对话。
- 回答中的 Markdown 和代码块能正常显示。
- 刷新页面后，本地会话仍能恢复。
- 后端 API Key 不暴露到前端。
- 模型调用失败时页面有明确提示。

## 13. 后续扩展方向

Demo 跑通后，可以按以下顺序扩展：

1. 接入数据库，持久化会话和消息。
2. 增加登录注册。
3. 增加用户级会话隔离。
4. 增加模型选择和参数配置。
5. 增加文件上传和知识库问答。
6. 增加管理后台。
7. 增加用量统计和成本控制。
8. 增加团队权限和企业化能力。

## 14. 推荐优先级

当前阶段只关注最小闭环：

1. 聊天 UI。
2. 流式模型回答。
3. 多轮上下文。
4. localStorage 本地会话。
5. 基础错误处理。

只要这五项完成，就已经具备可演示价值。其他功能全部放到 Demo 之后。
