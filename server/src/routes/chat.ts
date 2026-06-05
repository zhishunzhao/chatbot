import { Router } from "express";
import {
  createChatCompletionStream,
  normalizeMessages
} from "../services/llmClient.js";
import type { ChatStreamEvent, ChatStreamRequest } from "../types/chat.js";

export const chatRouter = Router();

function sendEvent(res: Parameters<Parameters<typeof chatRouter.post>[1]>[1], event: ChatStreamEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "OPENAI_API_KEY is not configured") {
    return "模型 API Key 未配置，请先设置 OPENAI_API_KEY。";
  }

  if (error instanceof Error && error.message === "At least one message is required") {
    return "请先输入问题。";
  }

  return "模型调用失败，请稍后重试。";
}

chatRouter.post("/chat/stream", async (req, res) => {
  const body = req.body as Partial<ChatStreamRequest>;

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let aborted = false;
  req.on("aborted", () => {
    aborted = true;
  });

  try {
    if (!Array.isArray(body.messages)) {
      throw new Error("At least one message is required");
    }

    const stream = createChatCompletionStream({
      messages: normalizeMessages(body.messages),
      model: body.model,
      temperature: body.temperature,
      max_tokens: body.max_tokens
    });

    for await (const chunk of stream) {
      if (aborted || res.destroyed) {
        break;
      }

      sendEvent(res, { type: "delta", content: chunk });
    }

    if (!aborted && !res.destroyed) {
      sendEvent(res, { type: "done" });
    }
  } catch (error) {
    console.error("Chat stream failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
      cause:
        error instanceof Error && error.cause instanceof Error
          ? error.cause.message
          : undefined
    });

    if (!aborted && !res.destroyed) {
      sendEvent(res, { type: "error", message: getErrorMessage(error) });
    }
  } finally {
    res.end();
  }
});
