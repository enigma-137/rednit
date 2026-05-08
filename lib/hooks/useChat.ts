"use client";

import { useEffect, useState } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { mockMessages, mockProfiles } from "@/lib/mock-data";
import type { Message, Profile } from "@/lib/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useChat(matchId: string) {
  const [messages, setMessages] = useState<Message[]>(hasSupabaseConfig() ? [] : mockMessages);
  const [userId, setUserId] = useState("me");
  const [otherProfile, setOtherProfile] = useState<Profile | null>(
    hasSupabaseConfig() ? null : mockProfiles[0]
  );
  const [loading, setLoading] = useState(hasSupabaseConfig());

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    if (!uuidPattern.test(matchId)) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function loadMessages() {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: match } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();

      if (match) {
        const otherUserId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", otherUserId)
          .maybeSingle();

        setOtherProfile(profile ?? null);
      }

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
      setLoading(false);
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
          const incoming = payload.new as Message;
          setMessages((items) =>
            items.some((item) => item.id === incoming.id) ? items : [...items, incoming]
          );
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

    if (!hasSupabaseConfig() || !uuidPattern.test(matchId)) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: userId,
        content: trimmed
      })
      .select()
      .single();

    if (data) {
      setMessages((items) => {
        const withoutOptimistic = items.filter((item) => item.id !== optimistic.id);

        return withoutOptimistic.some((item) => item.id === data.id)
          ? withoutOptimistic
          : [...withoutOptimistic, data];
      });
    }
  }

  return { messages, send, userId, otherProfile, loading };
}
