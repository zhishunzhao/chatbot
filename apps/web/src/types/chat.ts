export type ChatRole = "system" | "user" | "assistant";

export type MessageStatus = "idle" | "streaming" | "done" | "error";

export type Message = {
  id: string;
  role: ChatRole;
  content: string;
  status?: MessageStatus;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

export type ChatStreamEvent =
  | {
      type: "delta";
      content: string;
    }
  | {
      type: "done";
    }
  | {
      type: "error";
      message: string;
    };
