"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";

type MessageInputProps = {
  onSend: (content: string) => Promise<void>;
};

export function MessageInput({ onSend }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    await onSend(content);
    setContent("");
    setSending(false);
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-[1fr_48px] gap-4 border-t border-black bg-white p-4">
      <input
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="border-0 border-b border-black bg-white py-3 font-mono text-sm outline-none placeholder:text-gray-400"
        placeholder="message"
      />
      <button
        disabled={sending || !content.trim()}
        className="flex h-12 items-center justify-center border border-black bg-black text-white transition-colors hover:bg-white hover:text-black disabled:opacity-30"
        aria-label="Send"
      >
        <ArrowRight aria-hidden className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </form>
  );
}
