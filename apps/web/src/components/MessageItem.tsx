import { useState } from "react";
import rehypeHighlight from "rehype-highlight";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../types/chat";

type MessageItemProps = {
  message: Message;
};

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  async function copyContent() {
    if (!message.content) {
      return;
    }

    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = message.content;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 ${
          isUser
            ? "bg-emerald-500 text-neutral-950"
            : message.status === "error"
              ? "border border-red-900 bg-red-950/40 text-red-100"
              : "border border-neutral-800 bg-neutral-900 text-neutral-100"
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-3 text-xs font-medium opacity-70">
          <span>
            {isUser ? "你" : "助手"}
            {message.status === "streaming" ? " 正在生成" : ""}
          </span>
          {!isUser && message.content ? (
            <button
              type="button"
              className="rounded px-2 py-1 hover:bg-neutral-800"
              onClick={copyContent}
            >
              {copied ? "已复制" : "复制"}
            </button>
          ) : null}
        </div>
        {message.content ? (
          <div className="markdown-body">
            <ReactMarkdown
              rehypePlugins={[rehypeHighlight]}
              remarkPlugins={[remarkGfm]}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-neutral-400">正在思考...</div>
        )}
      </div>
    </article>
  );
}
