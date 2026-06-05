import type { Conversation } from "../types/chat";

type ConversationSidebarProps = {
  conversations: Conversation[];
  activeConversationId: string;
  isStreaming: boolean;
  onCreateConversation: () => void;
  onSwitchConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
};

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  isStreaming,
  onCreateConversation,
  onSwitchConversation,
  onDeleteConversation
}: ConversationSidebarProps) {
  return (
    <aside className="hidden w-72 border-r border-neutral-800 bg-neutral-900 px-4 py-5 md:flex md:flex-col">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Chatbot Demo</h1>
        <button
          type="button"
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isStreaming}
          onClick={onCreateConversation}
        >
          新会话
        </button>
      </div>

      <div className="mt-5 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;

            return (
              <div
                key={conversation.id}
                className={`group rounded-lg border p-2 ${
                  isActive
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/70"
                }`}
              >
                <button
                  type="button"
                  className="block w-full text-left disabled:cursor-not-allowed"
                  disabled={isStreaming}
                  onClick={() => onSwitchConversation(conversation.id)}
                >
                  <span className="block truncate text-sm font-medium text-neutral-100">
                    {conversation.title}
                  </span>
                  <span className="mt-1 block text-xs text-neutral-500">
                    {formatTime(conversation.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  className="mt-2 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-red-950/50 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isStreaming}
                  onClick={() => onDeleteConversation(conversation.id)}
                >
                  删除
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
