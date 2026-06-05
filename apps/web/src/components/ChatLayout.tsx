import { useRef } from "react";
import { streamChat } from "../services/chatApi";
import { useChatStore } from "../stores/chatStore";
import type { Message } from "../types/chat";
import { ChatInput } from "./ChatInput";
import { ConversationSidebar } from "./ConversationSidebar";
import { MessageList } from "./MessageList";

function createMessage(role: Message["role"], content: string): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    status: "idle",
    createdAt: Date.now()
  };
}

export function ChatLayout() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const {
    conversations,
    activeConversationId,
    isStreaming,
    error,
    createConversation,
    switchConversation,
    deleteConversation,
    addMessage,
    appendToMessage,
    updateMessage,
    setError,
    setStreaming
  } = useChatStore();
  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ??
    conversations[0];
  const messages = activeConversation?.messages ?? [];

  async function handleSend(content: string) {
    if (isStreaming) {
      return;
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    const userMessage = createMessage("user", trimmedContent);
    const assistantMessage = {
      ...createMessage("assistant", ""),
      status: "streaming" as const
    };
    const nextMessages = [...messages, userMessage, assistantMessage];
    const abortController = new AbortController();

    abortControllerRef.current = abortController;
    setError(null);
    addMessage(userMessage);
    addMessage(assistantMessage);
    setStreaming(true);

    try {
      await streamChat({
        messages: nextMessages.filter((message) => message.content.trim()),
        signal: abortController.signal,
        onDelta: (delta) => {
          appendToMessage(assistantMessage.id, delta);
        }
      });
      updateMessage(assistantMessage.id, { status: "done" });
    } catch (streamError) {
      if (abortController.signal.aborted) {
        updateMessage(assistantMessage.id, { status: "done" });
        return;
      }

      const message =
        streamError instanceof Error
          ? streamError.message
          : "聊天服务暂时不可用，请稍后重试。";
      setError(message);
      updateMessage(assistantMessage.id, {
        content: message,
        status: "error"
      });
    } finally {
      abortControllerRef.current = null;
      setStreaming(false);
    }
  }

  function handleStop() {
    abortControllerRef.current?.abort();
  }

  return (
    <main className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        isStreaming={isStreaming}
        onCreateConversation={createConversation}
        onSwitchConversation={switchConversation}
        onDeleteConversation={deleteConversation}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-neutral-800 px-4 md:px-8">
          <div>
            <p className="text-sm font-medium text-neutral-100 md:hidden">
              Chatbot Demo
            </p>
            <p className="hidden text-sm text-neutral-400 md:block">
              流式对话界面
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 md:hidden"
            disabled={isStreaming}
            onClick={createConversation}
          >
            新会话
          </button>
        </header>

        {error ? (
          <div className="border-b border-red-950 bg-red-950/40 px-4 py-3 text-sm text-red-100 md:px-8">
            {error}
          </div>
        ) : null}

        <MessageList messages={messages} isStreaming={isStreaming} />
        <ChatInput
          disabled={isStreaming}
          isStreaming={isStreaming}
          onSend={handleSend}
          onStop={handleStop}
        />
      </section>
    </main>
  );
}
