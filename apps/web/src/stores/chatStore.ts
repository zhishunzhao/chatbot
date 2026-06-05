import { create } from "zustand";
import type { Conversation, Message } from "../types/chat";

const CONVERSATIONS_KEY = "chatbot_demo_conversations";
const ACTIVE_CONVERSATION_KEY = "chatbot_demo_active_conversation_id";
const DEFAULT_TITLE = "新会话";

function createConversation(): Conversation {
  const now = Date.now();

  return {
    id: crypto.randomUUID(),
    title: DEFAULT_TITLE,
    messages: [],
    createdAt: now,
    updatedAt: now
  };
}

function getConversationTitle(message: Message) {
  const title = message.content.trim().replace(/\s+/g, " ").slice(0, 24);
  return title || DEFAULT_TITLE;
}

function loadInitialState() {
  if (typeof window === "undefined") {
    const conversation = createConversation();
    return {
      conversations: [conversation],
      activeConversationId: conversation.id
    };
  }

  try {
    const storedConversations = window.localStorage.getItem(CONVERSATIONS_KEY);
    const storedActiveId = window.localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    const conversations = storedConversations
      ? (JSON.parse(storedConversations) as Conversation[])
      : [];

    if (Array.isArray(conversations) && conversations.length > 0) {
      const activeConversationId =
        storedActiveId && conversations.some((item) => item.id === storedActiveId)
          ? storedActiveId
          : [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)[0].id;

      return { conversations, activeConversationId };
    }
  } catch {
    window.localStorage.removeItem(CONVERSATIONS_KEY);
    window.localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
  }

  const conversation = createConversation();
  return {
    conversations: [conversation],
    activeConversationId: conversation.id
  };
}

function persist(conversations: Conversation[], activeConversationId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  window.localStorage.setItem(ACTIVE_CONVERSATION_KEY, activeConversationId);
}

type ChatState = {
  conversations: Conversation[];
  activeConversationId: string;
  isStreaming: boolean;
  error: string | null;
  createConversation: () => void;
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  addMessage: (message: Message) => void;
  appendToMessage: (messageId: string, content: string) => void;
  updateMessage: (messageId: string, patch: Partial<Message>) => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
};

const initialState = loadInitialState();

export const useChatStore = create<ChatState>((set) => ({
  conversations: initialState.conversations,
  activeConversationId: initialState.activeConversationId,
  isStreaming: false,
  error: null,
  createConversation: () => {
    set((state) => {
      const conversation = createConversation();
      const conversations = [conversation, ...state.conversations];
      persist(conversations, conversation.id);

      return {
        conversations,
        activeConversationId: conversation.id,
        error: null
      };
    });
  },
  switchConversation: (conversationId) => {
    set((state) => {
      if (state.isStreaming) {
        return state;
      }

      const exists = state.conversations.some(
        (conversation) => conversation.id === conversationId
      );

      if (!exists) {
        return state;
      }

      persist(state.conversations, conversationId);

      return {
        activeConversationId: conversationId,
        error: null
      };
    });
  },
  deleteConversation: (conversationId) => {
    set((state) => {
      if (state.isStreaming) {
        return state;
      }

      const remaining = state.conversations.filter(
        (conversation) => conversation.id !== conversationId
      );
      const conversations = remaining.length > 0 ? remaining : [createConversation()];
      const activeConversationId =
        state.activeConversationId === conversationId
          ? conversations[0].id
          : state.activeConversationId;

      persist(conversations, activeConversationId);

      return {
        conversations,
        activeConversationId,
        error: null
      };
    });
  },
  addMessage: (message) => {
    set((state) => {
      const now = Date.now();
      const conversations = state.conversations.map((conversation) => {
        if (conversation.id !== state.activeConversationId) {
          return conversation;
        }

        const shouldUpdateTitle =
          conversation.title === DEFAULT_TITLE &&
          message.role === "user" &&
          conversation.messages.every((item) => item.role !== "user");

        return {
          ...conversation,
          title: shouldUpdateTitle ? getConversationTitle(message) : conversation.title,
          messages: [...conversation.messages, message],
          updatedAt: now
        };
      });

      persist(conversations, state.activeConversationId);

      return { conversations };
    });
  },
  appendToMessage: (messageId, content) => {
    set((state) => {
      const conversations = state.conversations.map((conversation) => {
        if (conversation.id !== state.activeConversationId) {
          return conversation;
        }

        return {
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId
              ? { ...message, content: message.content + content }
              : message
          ),
          updatedAt: Date.now()
        };
      });

      persist(conversations, state.activeConversationId);

      return { conversations };
    });
  },
  updateMessage: (messageId, patch) => {
    set((state) => {
      const conversations = state.conversations.map((conversation) => {
        if (conversation.id !== state.activeConversationId) {
          return conversation;
        }

        return {
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId ? { ...message, ...patch } : message
          ),
          updatedAt: Date.now()
        };
      });

      persist(conversations, state.activeConversationId);

      return { conversations };
    });
  },
  setStreaming: (isStreaming) => {
    set({ isStreaming });
  },
  setError: (error) => {
    set({ error });
  }
}));
