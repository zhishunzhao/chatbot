import { useState } from "react";

type ChatInputProps = {
  disabled: boolean;
  isStreaming: boolean;
  onSend: (content: string) => void;
  onStop: () => void;
};

export function ChatInput({
  disabled,
  isStreaming,
  onSend,
  onStop
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !disabled;

  function submit() {
    if (!canSend) {
      return;
    }

    onSend(value);
    setValue("");
  }

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 px-4 py-4 md:px-8">
      <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-xl border border-neutral-700 bg-neutral-900 p-2 shadow-lg shadow-black/20">
        <textarea
          className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-neutral-100 outline-none placeholder:text-neutral-500"
          placeholder="输入消息，Enter 发送，Shift + Enter 换行"
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {isStreaming ? (
          <button
            type="button"
            className="h-10 rounded-md bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-400"
            onClick={onStop}
          >
            停止
          </button>
        ) : (
          <button
            type="button"
            className="h-10 rounded-md bg-emerald-500 px-4 text-sm font-medium text-neutral-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
            disabled={!canSend}
            onClick={submit}
          >
            发送
          </button>
        )}
      </div>
    </footer>
  );
}
