import type { ChatStreamEvent, Message } from "../types/chat";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

type StreamChatParams = {
  messages: Message[];
  signal: AbortSignal;
  onDelta: (content: string) => void;
};

function getChatPayload(messages: Message[]) {
  return {
    messages: messages
      .filter((message) => message.role !== "system" || message.content.trim())
      .map((message) => ({
        role: message.role,
        content: message.content
      }))
  };
}

function parseEvent(rawEvent: string): ChatStreamEvent | null {
  const dataLine = rawEvent
    .split("\n")
    .find((line) => line.startsWith("data:"));

  if (!dataLine) {
    return null;
  }

  const data = dataLine.replace(/^data:\s*/, "");

  try {
    return JSON.parse(data) as ChatStreamEvent;
  } catch {
    return null;
  }
}

export async function streamChat({ messages, signal, onDelta }: StreamChatParams) {
  const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(getChatPayload(messages)),
    signal
  });

  if (!response.ok || !response.body) {
    throw new Error("聊天服务暂时不可用，请稍后重试。");
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
      const event = parseEvent(rawEvent);

      if (!event) {
        continue;
      }

      if (event.type === "delta") {
        onDelta(event.content);
      }

      if (event.type === "error") {
        throw new Error(event.message);
      }

      if (event.type === "done") {
        return;
      }
    }
  }
}
