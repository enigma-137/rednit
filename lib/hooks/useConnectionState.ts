"use client";

import { useEffect, useState } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export type ConnectionStatus = "self" | "none" | "requested" | "connected";

export function useConnectionState(targetUserId: string) {
  const [status, setStatus] = useState<ConnectionStatus>("none");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      if (!hasSupabaseConfig()) {
        const currentMockUserId = "me";
        if (targetUserId === currentMockUserId) {
          setStatus("self");
          setLoading(false);
          return;
        }

        // Check local storage mock likes/matches
        const mockMatches = JSON.parse(localStorage.getItem("rednit_mock_matches") || "[]");
        const mockLikes = JSON.parse(localStorage.getItem("rednit_mock_likes") || "[]");

        const hasMatch = mockMatches.some(
          (m: any) =>
            (m.user_a_id === currentMockUserId && m.user_b_id === targetUserId) ||
            (m.user_a_id === targetUserId && m.user_b_id === currentMockUserId)
        );

        if (hasMatch) {
          setStatus("connected");
          setLoading(false);
          return;
        }

        const hasSentLike = mockLikes.some(
          (l: any) => l.from_user_id === currentMockUserId && l.to_user_id === targetUserId
        );

        if (hasSentLike) {
          setStatus("requested");
        } else {
          setStatus("none");
        }

        setCurrentUserId(currentMockUserId);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      if (user.id === targetUserId) {
        setStatus("self");
        setLoading(false);
        return;
      }

      // Check if match exists
      const userAId = user.id < targetUserId ? user.id : targetUserId;
      const userBId = user.id < targetUserId ? targetUserId : user.id;

      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .eq("user_a_id", userAId)
        .eq("user_b_id", userBId)
        .maybeSingle();

      if (match) {
        setStatus("connected");
        setLoading(false);
        return;
      }

      // Check if we liked them
      const { data: like } = await supabase
        .from("likes")
        .select("id")
        .eq("from_user_id", user.id)
        .eq("to_user_id", targetUserId)
        .maybeSingle();

      if (like) {
        setStatus("requested");
      } else {
        setStatus("none");
      }

      setLoading(false);
    }

    void checkStatus();
  }, [targetUserId]);

  async function connect() {
    if (!currentUserId) return false;

    if (!hasSupabaseConfig()) {
      const mockLikes = JSON.parse(localStorage.getItem("rednit_mock_likes") || "[]");
      mockLikes.push({ from_user_id: currentUserId, to_user_id: targetUserId });
      localStorage.setItem("rednit_mock_likes", JSON.stringify(mockLikes));

      // In mock mode, connecting with Ada or Grace Hopper creates a mutual match instantly!
      const mockMatches = JSON.parse(localStorage.getItem("rednit_mock_matches") || "[]");
      const hasMutual = targetUserId === "7f0e4e16-6f34-46c5-ae2e-000000000002" || targetUserId === "7f0e4e16-6f34-46c5-ae2e-000000000001";
      if (hasMutual) {
        mockMatches.push({
          id: `match-${targetUserId}`,
          user_a_id: currentUserId < targetUserId ? currentUserId : targetUserId,
          user_b_id: currentUserId < targetUserId ? targetUserId : currentUserId,
          created_at: new Date().toISOString()
        });
        localStorage.setItem("rednit_mock_matches", JSON.stringify(mockMatches));
        setStatus("connected");
        return true;
      }

      setStatus("requested");
      return false;
    }

    const supabase = createClient();
    await supabase.from("likes").upsert({
      from_user_id: currentUserId,
      to_user_id: targetUserId
    });

    const userAId = currentUserId < targetUserId ? currentUserId : targetUserId;
    const userBId = currentUserId < targetUserId ? targetUserId : currentUserId;

    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .eq("user_a_id", userAId)
      .eq("user_b_id", userBId)
      .maybeSingle();

    if (match) {
      setStatus("connected");
      return true;
    } else {
      setStatus("requested");
      return false;
    }
  }

  return { status, loading, connect };
}
