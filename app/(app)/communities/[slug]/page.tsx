"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Shield, LogOut, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCommunities } from "@/lib/hooks/useCommunities";
import { useFeed } from "@/lib/hooks/useFeed";
import { useEvents } from "@/lib/hooks/useEvents";
import { PostComposer } from "@/components/posts/PostComposer";
import { PostCard } from "@/components/posts/PostCard";
import { EventScheduler } from "@/components/events/EventScheduler";
import { EventCard } from "@/components/events/EventCard";
import { ConnectButton } from "@/components/ui/ConnectButton";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/env";
import { mockProfiles } from "@/lib/mock-data";
import type { Community, Profile, Post, Event } from "@/lib/types";

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

  const { posts, loading: feedLoading, loadPosts } = useFeed();
  const { events: communityEvents, loading: eventsLoading, loadEvents } = useEvents();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<"feed" | "meetups">("feed");

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

    // Fetch feed posts for this community
    void loadPosts(comm.id);

    // Fetch meetups for this community
    void loadEvents(comm.id);

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
  }, [slug, loadCommunityBySlug, checkIsMember, getMemberCount, loadPosts, loadEvents]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  useEffect(() => {
    setLocalEvents(communityEvents);
  }, [communityEvents]);

  function handlePostCreated(newPost: Post) {
    setLocalPosts((curr) => [newPost, ...curr]);
  }

  function handleEventCreated(newEvent: Event) {
    setLocalEvents((curr) => {
      const updated = [newEvent, ...curr];
      updated.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      return updated;
    });
  }

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
            variant={isMember ? "outline" : "solid"}
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
        {/* Left Column: Feed / Meetups Tabbed Views */}
        <section className="space-y-6">
          <div className="flex gap-6 border-b border-black pb-2">
            <button
              onClick={() => setActiveTab("feed")}
              className={`font-sans text-sm font-bold uppercase tracking-[0.15em] pb-1 border-b-2 transition-all ${
                activeTab === "feed" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
              }`}
            >
              Discussions Feed
            </button>
            <button
              onClick={() => setActiveTab("meetups")}
              className={`font-sans text-sm font-bold uppercase tracking-[0.15em] pb-1 border-b-2 transition-all ${
                activeTab === "meetups" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
              }`}
            >
              Upcoming Meetups
            </button>
          </div>

          {activeTab === "feed" ? (
            <div className="space-y-6">
              {isMember ? (
                <PostComposer communityId={community.id} onPostCreated={handlePostCreated} />
              ) : (
                <div className="border border-dashed border-gray-300 p-4 text-center font-mono text-xs text-gray-500 bg-gray-50">
                  Only members of this community can write posts. Join this family to write!
                </div>
              )}

              {feedLoading ? (
                <div className="py-12 text-center font-mono text-xs text-gray-400">
                  loading feed posts...
                </div>
              ) : localPosts.length === 0 ? (
                <div className="py-16 border border-dashed border-gray-200 text-center font-mono text-xs text-gray-500">
                  No discussions yet. Write the first update inside {community.name}!
                </div>
              ) : (
                <div className="space-y-5">
                  {localPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {isMember ? (
                <EventScheduler communityId={community.id} onEventCreated={handleEventCreated} />
              ) : (
                <div className="border border-dashed border-gray-300 p-4 text-center font-mono text-xs text-gray-500 bg-gray-50">
                  Only members of this community can schedule meetups. Join this family to start!
                </div>
              )}

              {eventsLoading ? (
                <div className="py-12 text-center font-mono text-xs text-gray-400">
                  loading community meetups...
                </div>
              ) : localEvents.length === 0 ? (
                <div className="py-16 border border-dashed border-gray-200 text-center font-mono text-xs text-gray-500">
                  No meetups scheduled. Set one up above to rally this community!
                </div>
              ) : (
                <div className="space-y-5">
                  {localEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}
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
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-bold leading-tight">
                      {member.full_name || member.username}
                    </p>
                    <p className="truncate font-mono text-[10px] text-gray-500">
                      @{member.username}
                    </p>
                  </div>
                  <ConnectButton targetUserId={member.id} />
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
