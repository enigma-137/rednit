"use client";

import { useEffect, useState } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { mockProfiles } from "@/lib/mock-data";
import type { Profile } from "@/lib/types";

export function useDiscover() {
  const [profiles, setProfiles] = useState<Profile[]>(hasSupabaseConfig() ? [] : mockProfiles);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig());

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

      const likedIds = likedRows?.map((row) => row.to_user_id) ?? [];

      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .order("created_at", { ascending: false })
        .limit(24);

      if (likedIds.length) {
        query = query.not("id", "in", `(${likedIds.join(",")})`);
      }

      const { data } = await query;

      setProfiles(data ?? []);
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

  return { profiles, loading, like, pass };
}
