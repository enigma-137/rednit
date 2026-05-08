"use client";

import { useEffect, useState } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { mockProfiles } from "@/lib/mock-data";
import type { Profile } from "@/lib/types";

const BATCH_SIZE = 100;

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
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig());
  const [offset, setOffset] = useState(0);
  const [likedIds, setLikedIds] = useState<string[]>([]);

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
        .limit(BATCH_SIZE);

      if (likedIdsList.length) {
        query = query.not("id", "in", `(${likedIdsList.join(",")})`);
      }

      const { data } = await query;
      const shuffled = shuffleArray(data ?? []);

      setAllProfiles(shuffled);
      setProfiles(shuffled.slice(0, 24));
      setOffset(0);
      setLoading(false);
    }

    void loadProfiles();
  }, []);

  async function like(profile: Profile) {
    setProfiles((items) => items.filter((item) => item.id !== profile.id));
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
    setProfiles((items) => items.filter((item) => item.id !== profile.id));
  }

  async function loadMore() {
    if (!currentUserId || !hasSupabaseConfig()) return;

    const supabase = createClient();
    const newOffset = offset + BATCH_SIZE;

    let query = supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUserId)
      .order("created_at", { ascending: false })
      .range(newOffset, newOffset + BATCH_SIZE - 1);

    if (likedIds.length) {
      query = query.not("id", "in", `(${likedIds.join(",")})`);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      const shuffled = shuffleArray(data);
      setAllProfiles((prev) => [...prev, ...shuffled]);
      setProfiles((prev) => [...prev, ...shuffled.slice(0, 24)]);
      setOffset(newOffset);
    }
  }

  return { profiles, loading, like, pass, loadMore };
}
