import { useEffect, useRef } from "react";
import type { Message } from "../types/chat";
import { MessageItem } from "./MessageItem";

type MessageListProps = {
  messages: Message[];
  isStreaming: boolean;
};

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-neutral-100">
            开始一次对话
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            输入一个问题，系统会通过后端调用模型并把回答流式展示在这里。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
