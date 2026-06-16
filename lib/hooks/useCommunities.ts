"use client";

import { useCallback, useState, useEffect } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { mockCommunities } from "@/lib/mock-data";
import type { Community } from "@/lib/types";

export function useCommunities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setCommunities(mockCommunities);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    }
    void initUser();
  }, []);

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    if (!hasSupabaseConfig()) {
      setCommunities(mockCommunities);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCommunities(data);
    }
    setLoading(false);
  }, []);

  const loadCommunityBySlug = useCallback(async (slug: string): Promise<Community | null> => {
    if (!hasSupabaseConfig()) {
      return mockCommunities.find((c) => c.slug === slug) ?? null;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }, []);

  const checkIsMember = useCallback(async (communityId: string): Promise<boolean> => {
    if (!hasSupabaseConfig()) {
      // In local mode, let's store joined community IDs in local storage
      const joined = JSON.parse(localStorage.getItem("joined_communities") ?? "[]");
      return joined.includes(communityId);
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", communityId)
      .eq("profile_id", user.id)
      .maybeSingle();

    return !error && !!data;
  }, []);

  const joinCommunity = useCallback(async (communityId: string): Promise<boolean> => {
    if (!hasSupabaseConfig()) {
      const joined = JSON.parse(localStorage.getItem("joined_communities") ?? "[]");
      if (!joined.includes(communityId)) {
        joined.push(communityId);
        localStorage.setItem("joined_communities", JSON.stringify(joined));
      }
      return true;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("community_members")
      .insert({
        community_id: communityId,
        profile_id: user.id,
        role: "member"
      });

    return !error;
  }, []);

  const leaveCommunity = useCallback(async (communityId: string): Promise<boolean> => {
    if (!hasSupabaseConfig()) {
      const joined = JSON.parse(localStorage.getItem("joined_communities") ?? "[]");
      const filtered = joined.filter((id: string) => id !== communityId);
      localStorage.setItem("joined_communities", JSON.stringify(filtered));
      return true;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("profile_id", user.id);

    return !error;
  }, []);

  const createCommunity = useCallback(async (name: string, slug: string, description: string): Promise<Community | null> => {
    if (!hasSupabaseConfig()) {
      const newComm: Community = {
        id: `comm-mock-${Date.now()}`,
        creator_id: "me",
        name,
        slug,
        description,
        avatar_url: "",
        banner_url: "",
        created_at: new Date().toISOString()
      };
      mockCommunities.push(newComm);
      const joined = JSON.parse(localStorage.getItem("joined_communities") ?? "[]");
      joined.push(newComm.id);
      localStorage.setItem("joined_communities", JSON.stringify(joined));
      setCommunities((curr) => [newComm, ...curr]);
      return newComm;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("communities")
      .insert({
        name,
        slug,
        description,
        creator_id: user.id
      })
      .select()
      .single();

    if (error || !data) return null;

    // Join the newly created community automatically as admin
    await supabase.from("community_members").insert({
      community_id: data.id,
      profile_id: user.id,
      role: "admin"
    });

    setCommunities((curr) => [data, ...curr]);
    return data;
  }, []);

  const getMemberCount = useCallback(async (communityId: string): Promise<number> => {
    if (!hasSupabaseConfig()) {
      // Return a stable mock number
      return communityId === "comm-1" ? 142 : communityId === "comm-2" ? 88 : 1;
    }

    const supabase = createClient();
    const { count, error } = await supabase
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId);

    if (error) return 0;
    return count ?? 0;
  }, []);

  return {
    communities,
    loading,
    currentUserId,
    loadCommunities,
    loadCommunityBySlug,
    checkIsMember,
    joinCommunity,
    leaveCommunity,
    createCommunity,
    getMemberCount
  };
}
