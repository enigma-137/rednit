"use client";

import { useCallback, useEffect, useState } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { mockProfiles } from "@/lib/mock-data";
import type { Profile } from "@/lib/types";

const BATCH_SIZE = 24;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useDiscover() {
  const [profiles, setProfiles] = useState<Profile[]>(hasSupabaseConfig() ? [] : mockProfiles);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig());
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(hasSupabaseConfig());
  const [nextRangeStart, setNextRangeStart] = useState(0);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  const loadProfileBatch = useCallback(
    async (start: number, excludedLikeIds = likedIds) => {
      if (!currentUserId || !hasSupabaseConfig()) return [];

      const supabase = createClient();
      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId)
        .order("created_at", { ascending: false })
        .range(start, start + BATCH_SIZE - 1);

      if (excludedLikeIds.length) {
        query = query.not("id", "in", `(${excludedLikeIds.join(",")})`);
      }

      const { data } = await query;
      return shuffleArray(data ?? []);
    },
    [currentUserId, likedIds]
  );

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const supabase = createClient();

    async function loadProfiles() {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: likedRows } = await supabase
        .from("likes")
        .select("to_user_id")
        .eq("from_user_id", user.id);

      const likedIdsList = likedRows?.map((row) => row.to_user_id) ?? [];
      setLikedIds(likedIdsList);

      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .order("created_at", { ascending: false })
        .range(0, BATCH_SIZE - 1);

      if (likedIdsList.length) {
        query = query.not("id", "in", `(${likedIdsList.join(",")})`);
      }

      const { data } = await query;
      const shuffled = shuffleArray(data ?? []);

      setProfiles(shuffled);
      setNextRangeStart(BATCH_SIZE);
      setHasMore((data ?? []).length === BATCH_SIZE);
      setLoading(false);
    }

    void loadProfiles();
  }, []);

  async function like(profile: Profile) {
    setProfiles((items) => {
      const next = items.filter((item) => item.id !== profile.id);
      if (next.length <= 3) void loadMore();
      return next;
    });
    if (!currentUserId || !hasSupabaseConfig()) return null;

    const supabase = createClient();
    await supabase.from("likes").upsert({
      from_user_id: currentUserId,
      to_user_id: profile.id
    });

    const userAId = currentUserId < profile.id ? currentUserId : profile.id;
    const userBId = currentUserId < profile.id ? profile.id : currentUserId;

    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .eq("user_a_id", userAId)
      .eq("user_b_id", userBId)
      .maybeSingle();

    return match ? profile : null;
  }

  function pass(profile: Profile) {
    setProfiles((items) => {
      const next = items.filter((item) => item.id !== profile.id);
      if (next.length <= 3) void loadMore();
      return next;
    });
  }

  async function loadMore() {
    if (!currentUserId || !hasSupabaseConfig() || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const batch = await loadProfileBatch(nextRangeStart);
    setProfiles((items) => {
      const existingIds = new Set(items.map((item) => item.id));
      const fresh = batch.filter((item) => !existingIds.has(item.id));
      return [...items, ...fresh];
    });
    setNextRangeStart((start) => start + BATCH_SIZE);
    setHasMore(batch.length === BATCH_SIZE);
    setLoadingMore(false);
  }

  useEffect(() => {
    if (profiles.length <= 3) {
      void loadMore();
    }
  }, [profiles.length]);

  return { profiles, loading, loadingMore, hasMore, like, pass, loadMore };
}
