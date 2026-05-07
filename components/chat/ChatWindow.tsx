"use client";

import Image from "next/image";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { mockProfiles } from "@/lib/mock-data";
import { useChat } from "@/lib/hooks/useChat";

type ChatWindowProps = {
  matchId: string;
};

export function ChatWindow({ matchId }: ChatWindowProps) {
  const { messages, send, userId } = useChat(matchId);
  const profile = mockProfiles[0];

  return (
    <section className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="grid grid-cols-[48px_1fr] items-center gap-4 border-b border-black p-4">
        <div className="relative h-12 w-12 border border-black bg-gray-100">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" fill sizes="48px" className="object-cover grayscale" />
          ) : null}
        </div>
        <div>
          <h1 className="font-bold">{profile.full_name}</h1>
          <p className="font-mono text-xs text-gray-600">@{profile.username}</p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} mine={message.sender_id === userId} />
        ))}
      </div>

      <MessageInput onSend={send} />
    </section>
  );
}
