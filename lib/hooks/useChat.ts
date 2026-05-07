"use client";

import { useEffect, useState } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { mockMessages } from "@/lib/mock-data";
import type { Message } from "@/lib/types";

export function useChat(matchId: string) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [userId, setUserId] = useState("me");

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const supabase = createClient();

    async function loadMessages() {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      if (matchId === "demo") return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    }

    void loadMessages();

    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          setMessages((items) => [...items, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [matchId]);

  async function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;

    const optimistic: Message = {
      id: crypto.randomUUID(),
      match_id: matchId,
      sender_id: userId,
      content: trimmed,
      created_at: new Date().toISOString()
    };

    setMessages((items) => [...items, optimistic]);

    if (matchId === "demo" || !hasSupabaseConfig()) return;

    const supabase = createClient();
    await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: userId,
      content: trimmed
    });
  }

  return { messages, send, userId };
}
