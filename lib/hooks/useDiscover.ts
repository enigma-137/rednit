"use client";

import { useEffect, useState } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { mockProfiles } from "@/lib/mock-data";
import type { Profile } from "@/lib/types";

export function useDiscover() {
  const [profiles, setProfiles] = useState<Profile[]>(mockProfiles);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const supabase = createClient();

    async function loadProfiles() {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .limit(24);

      if (data?.length) setProfiles(data);
    }

    void loadProfiles();
  }, []);

  async function like(profile: Profile) {
    setProfiles((items) => items.filter((item) => item.id !== profile.id));
    if (!currentUserId || !hasSupabaseConfig()) return;

    const supabase = createClient();
    await supabase.from("likes").insert({
      from_user_id: currentUserId,
      to_user_id: profile.id
    });
  }

  function pass(profile: Profile) {
    setProfiles((items) => items.filter((item) => item.id !== profile.id));
  }

  return { profiles, like, pass };
}
