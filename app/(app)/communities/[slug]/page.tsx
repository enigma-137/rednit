"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Shield, LogOut, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCommunities } from "@/lib/hooks/useCommunities";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/env";
import { mockProfiles } from "@/lib/mock-data";
import type { Community, Profile } from "@/lib/types";

export default function CommunityDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const {
    loadCommunityBySlug,
    checkIsMember,
    joinCommunity,
    leaveCommunity,
    getMemberCount
  } = useCommunities();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const comm = await loadCommunityBySlug(slug);
    if (!comm) {
      setCommunity(null);
      setLoading(false);
      return;
    }
    setCommunity(comm);

    const [memberStatus, count] = await Promise.all([
      checkIsMember(comm.id),
      getMemberCount(comm.id)
    ]);
    setIsMember(memberStatus);
    setMemberCount(count);
    setLoading(false);

    // Fetch members profile roster
    setLoadingMembers(true);
    if (!hasSupabaseConfig()) {
      // In local mode, return a subset of mock profiles
      setMembers(mockProfiles.slice(0, slug === "rust-family" ? 3 : 2));
      setLoadingMembers(false);
      return;
    }

    const supabase = createClient();
    const { data: memberRows, error: memberErr } = await supabase
      .from("community_members")
      .select("profile_id")
      .eq("community_id", comm.id);

    if (!memberErr && memberRows) {
      const ids = memberRows.map((r) => r.profile_id);
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", ids);
        setMembers(profiles ?? []);
      } else {
        setMembers([]);
      }
    }
    setLoadingMembers(false);
  }, [slug, loadCommunityBySlug, checkIsMember, getMemberCount]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleToggleMembership() {
    if (!community || actionLoading) return;
    setActionLoading(true);

    if (isMember) {
      const success = await leaveCommunity(community.id);
      if (success) {
        setIsMember(false);
        setMemberCount((c) => Math.max(0, c - 1));
        // Remove current user from members roster locally
        setMembers((m) => m.filter((p) => p.username !== "your-github" && p.id !== "me"));
      }
    } else {
      const success = await joinCommunity(community.id);
      if (success) {
        setIsMember(true);
        setMemberCount((c) => c + 1);
        // Add current user to members roster locally
        if (!hasSupabaseConfig()) {
          setMembers((m) => [...m, { id: "me", username: "your-github", full_name: "You (Local User)", avatar_url: "", bio: "", portfolio_url: "", github_url: "", city: "", skills: [], looking_for: [], role_title: "", company: "", twitter_url: "" }]);
        } else {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
            if (prof) {
              setMembers((m) => [...m, prof]);
            }
          }
        }
      }
    }
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-sm">
        loading community dashboard.
      </div>
    );
  }

  if (!community) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center font-mono text-sm">
        <p>Community not found.</p>
        <Link href="/communities" className="mt-6 inline-block underline">
          Back to directory
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto min-h-screen max-w-4xl px-5 py-8 pb-24">
      <header className="mb-6">
        <Link
          href="/communities"
          className="inline-flex items-center gap-2 font-mono text-xs text-gray-500 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to directory
        </Link>
      </header>

      {/* Hero Header Card */}
      <article className="border border-black bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <span className="inline-block font-mono text-xs uppercase text-gray-500">
              Community Family
            </span>
            <h1 className="text-4xl font-black tracking-tight">{community.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {memberCount} members
              </span>
              <span>/{community.slug}</span>
            </div>
          </div>

          <Button
            onClick={handleToggleMembership}
            disabled={actionLoading}
            variant={isMember ? "outline" : "default"}
            className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider shrink-0 h-11 px-6 sm:self-start"
          >
            {isMember ? (
              <>
                <Check className="h-4 w-4" />
                Joined (Leave)
              </>
            ) : (
              <>
                Join Community
              </>
            )}
          </Button>
        </div>

        <p className="mt-6 border-t border-gray-150 pt-6 font-mono text-sm leading-7 text-gray-800">
          {community.description || "No description provided for this family yet."}
        </p>
      </article>

      {/* Main Grid: Discussions Feed & Members Roster */}
      <div className="grid gap-8 mt-8 lg:grid-cols-[1fr_280px]">
        {/* Left Column: Feed discussions placeholder */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight border-b border-black pb-2">
            discussions feed
          </h2>
          <div className="border border-dashed border-gray-300 p-8 text-center font-mono text-xs text-gray-500 py-16">
            Discussions feed is cooking for Milestone 4. Free posting, updates, and replies are coming next.
          </div>
        </section>

        {/* Right Column: Members roster */}
        <aside className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight border-b border-black pb-2">
            members
          </h2>
          {loadingMembers ? (
            <div className="font-mono text-xs text-gray-500">loading roster...</div>
          ) : members.length === 0 ? (
            <div className="font-mono text-xs text-gray-500">no members in roster.</div>
          ) : (
            <div className="grid gap-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 border border-black p-3 bg-white hover:bg-gray-50"
                >
                  <div className="relative h-8 w-8 rounded-full border border-black bg-gray-100 overflow-hidden shrink-0">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt=""
                        className="h-full w-full object-cover grayscale"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-mono text-xs font-bold bg-gray-200">
                        {member.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold leading-tight">
                      {member.full_name || member.username}
                    </p>
                    <p className="truncate font-mono text-[10px] text-gray-500">
                      @{member.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
