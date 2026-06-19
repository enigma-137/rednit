"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { useChat } from "@/lib/hooks/useChat";

type ChatWindowProps = {
  matchId: string;
};

export function ChatWindow({ matchId }: ChatWindowProps) {
  const { messages, send, userId, otherProfile, loading } = useChat(matchId);

  return (
    <section className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="border-b border-black p-4">
        {otherProfile ? (
          <Link href={`/profile/${otherProfile.id}`} className="grid grid-cols-[48px_1fr] items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="relative h-12 w-12 border border-black bg-gray-100">
              {otherProfile.avatar_url ? (
                <Image
                  src={otherProfile.avatar_url}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover grayscale"
                />
              ) : null}
            </div>
            <div>
              <h1 className="font-bold">
                {otherProfile.full_name ?? otherProfile.username ?? "chat"}
              </h1>
              <p className="font-mono text-xs text-gray-600">
                @{otherProfile.username}
              </p>
            </div>
          </Link>
        ) : (
          <div className="grid grid-cols-[48px_1fr] items-center gap-4">
            <div className="relative h-12 w-12 border border-black bg-gray-100" />
            <div>
              <h1 className="font-bold">chat</h1>
              <p className="font-mono text-xs text-gray-600">matched thread</p>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {loading ? (
          <p className="py-16 text-center font-mono text-sm">loading messages.</p>
        ) : messages.length ? (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} mine={message.sender_id === userId} />
          ))
        ) : (
          <p className="py-16 text-center font-mono text-sm">no messages yet.</p>
        )}
      </div>

      <MessageInput onSend={send} />
    </section>
  );
}
