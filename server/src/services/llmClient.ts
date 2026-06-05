import type { ChatMessage } from "../types/chat.js";

const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const MAX_CONTEXT_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 6000;

function getApiConfig() {
  if (process.env.OPENAI_TLS_REJECT_UNAUTHORIZED === "false") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return {
    apiKey,
    baseURL: (process.env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "")
  };
}

export function getDefaultModel() {
  return process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
}

export function normalizeMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => {
      return (
        ["system", "user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      );
    })
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_MESSAGE_CHARS)
    }));
}

function parseSseEvent(rawEvent: string) {
  return rawEvent
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace(/^data:\s*/, "").trim())
    .filter(Boolean);
}

export async function* createChatCompletionStream(params: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}) {
  const { apiKey, baseURL } = getApiConfig();
  const messages = normalizeMessages(params.messages);

  if (messages.length === 0) {
    throw new Error("At least one message is required");
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: params.model ?? getDefaultModel(),
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens,
      stream: true
    })
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `LLM request failed with status ${response.status}${
        errorText ? `: ${errorText.slice(0, 200)}` : ""
      }`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      for (const data of parseSseEvent(rawEvent)) {
        if (data === "[DONE]") {
          return;
        }

        const chunk = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const content = chunk.choices?.[0]?.delta?.content;

        if (content) {
          yield content;
        }
      }
    }
  }
}
