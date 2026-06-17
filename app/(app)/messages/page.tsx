"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { mockMatches, mockProfiles } from "@/lib/mock-data";
import type { Match, Message, Profile } from "@/lib/types";

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<"chats" | "requests">("chats");
  const [matches, setMatches] = useState<Match[]>([]);
  const [requests, setRequests] = useState<Profile[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  async function loadData() {
    try {
      if (!hasSupabaseConfig()) {
        const currentMockUserId = "me";
        
        let storedMatches = localStorage.getItem("rednit_mock_matches");
        let activeMatches: Match[] = [];
        if (storedMatches) {
          activeMatches = JSON.parse(storedMatches);
        } else {
          localStorage.setItem("rednit_mock_matches", JSON.stringify(mockMatches));
          activeMatches = mockMatches;
        }

        const formattedMatches = activeMatches.map((match): Match => {
          const otherUserId = match.user_a_id === currentMockUserId ? match.user_b_id : match.user_a_id;
          const otherProfile = mockProfiles.find((p) => p.id === otherUserId) || mockProfiles[0];
          return {
            ...match,
            other_profile: otherProfile,
            last_message: match.last_message
          };
        });
        setMatches(formattedMatches);

        const mockLikes = JSON.parse(localStorage.getItem("rednit_mock_likes") || "[]");
        const defaultLikes = [
          { from_user_id: "7f0e4e16-6f34-46c5-ae2e-000000000001", to_user_id: "me" },
          { from_user_id: "7f0e4e16-6f34-46c5-ae2e-000000000002", to_user_id: "me" }
        ];
        const allLikes = [...defaultLikes, ...mockLikes];
        const matchUserIds = formattedMatches.map((m) =>
          m.user_a_id === currentMockUserId ? m.user_b_id : m.user_a_id
        );

        const pendingIds = allLikes
          .filter((l) => l.to_user_id === currentMockUserId)
          .map((l) => l.from_user_id)
          .filter((id) => !matchUserIds.includes(id));

        const uniquePendingIds = Array.from(new Set(pendingIds));
        const requestedProfiles = mockProfiles.filter((p) => uniquePendingIds.includes(p.id));
        setRequests(requestedProfiles);
        
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: matchesData } = await supabase
        .from("matches")
        .select("*")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      let formattedMatches: Match[] = [];
      let matchUserIds: string[] = [];

      if (matchesData && matchesData.length > 0) {
        const otherUserIds = matchesData.map((match) =>
          match.user_a_id === user.id ? match.user_b_id : match.user_a_id
        );
        matchUserIds = otherUserIds;
        const matchIds = matchesData.map((match) => match.id);

        const [{ data: profiles }, { data: messages }] = await Promise.all([
          supabase.from("profiles").select("*").in("id", otherUserIds),
          supabase
            .from("messages")
            .select("*")
            .in("match_id", matchIds)
            .order("created_at", { ascending: false })
            .limit(100)
        ]);

        const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
        const latestMessageByMatchId = new Map<string, Message>();

        for (const message of messages ?? []) {
          if (!latestMessageByMatchId.has(message.match_id)) {
            latestMessageByMatchId.set(message.match_id, message);
          }
        }

        formattedMatches = matchesData.map((match): Match => {
          const otherUserId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;
          return {
            ...match,
            other_profile: profilesById.get(otherUserId),
            last_message: latestMessageByMatchId.get(match.id) ?? null
          };
        });
      }
      setMatches(formattedMatches);

      const { data: likes } = await supabase
        .from("likes")
        .select("from_user_id")
        .eq("to_user_id", user.id);

      if (likes && likes.length > 0) {
        const likedUserIds = likes.map((l) => l.from_user_id);
        const pendingIds = likedUserIds.filter((id) => !matchUserIds.includes(id));

        if (pendingIds.length > 0) {
          const { data: requestProfiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", pendingIds);

          setRequests(requestProfiles ?? []);
        } else {
          setRequests([]);
        }
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Error loading messages data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleAccept(profile: Profile) {
    setAcceptingId(profile.id);
    try {
      if (!hasSupabaseConfig()) {
        const currentMockUserId = "me";
        
        const mockLikes = JSON.parse(localStorage.getItem("rednit_mock_likes") || "[]");
        mockLikes.push({ from_user_id: currentMockUserId, to_user_id: profile.id });
        localStorage.setItem("rednit_mock_likes", JSON.stringify(mockLikes));

        const mockMatchesList = JSON.parse(localStorage.getItem("rednit_mock_matches") || "[]");
        const matchId = `match-${profile.id}`;
        mockMatchesList.push({
          id: matchId,
          user_a_id: currentMockUserId < profile.id ? currentMockUserId : profile.id,
          user_b_id: currentMockUserId < profile.id ? profile.id : currentMockUserId,
          created_at: new Date().toISOString()
        });
        localStorage.setItem("rednit_mock_matches", JSON.stringify(mockMatchesList));

        await loadData();
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("likes").upsert({
        from_user_id: user.id,
        to_user_id: profile.id
      });

      await loadData();
    } catch (err) {
      console.error("Error accepting request:", err);
    } finally {
      setAcceptingId(null);
    }
  }

  function handleIgnore(profileId: string) {
    setDismissedIds((prev) => [...prev, profileId]);
  }

  const activeRequests = requests.filter((p) => !dismissedIds.includes(p.id));

  return (
    <section className="mx-auto min-h-screen max-w-2xl px-5 py-8 pb-24">
      <header className="border-b border-black pb-6 mb-6">
        <h1 className="text-3xl font-black tracking-[-0.02em]">messages</h1>
      </header>

      {/* Tabs list */}
      <div className="flex gap-4 border-b border-black pb-4 mb-6">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-colors duration-150 ${
            activeTab === "chats"
              ? "bg-black text-white border-black font-bold"
              : "bg-white text-black border-black hover:bg-gray-100"
          }`}
        >
          <span>Chats</span>
          {matches.length > 0 && (
            <span
              className={`px-1.5 py-0.5 text-[9px] font-sans rounded-full ${
                activeTab === "chats" ? "bg-white text-black font-bold" : "bg-black text-white"
              }`}
            >
              {matches.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-colors duration-150 ${
            activeTab === "requests"
              ? "bg-black text-white border-black font-bold"
              : "bg-white text-black border-black hover:bg-gray-100"
          }`}
        >
          <span>Requests</span>
          {activeRequests.length > 0 && (
            <span
              className={`px-1.5 py-0.5 text-[9px] font-sans rounded-full ${
                activeTab === "requests" ? "bg-white text-black font-bold" : "bg-black text-white"
              }`}
            >
              {activeRequests.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center font-mono text-xs text-gray-400">
          loading conversations...
        </div>
      ) : activeTab === "chats" ? (
        <div className="divide-y divide-gray-200">
          {matches.length ? (
            matches.map((match, index) => {
              const profile = match.other_profile;
              if (!profile) return null;

              return (
                <Link
                  href={`/chat/${match.id}`}
                  key={match.id}
                  className="grid grid-cols-[40px_1fr_8px] items-center gap-4 py-5 hover:bg-gray-50 px-2 transition-colors duration-150"
                >
                  <div className="relative h-10 w-10 border border-black bg-gray-100">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-full w-full object-cover grayscale"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-mono text-xs font-bold bg-gray-200">
                        {profile.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate font-bold text-sm">{profile.full_name ?? profile.username}</p>
                      <p className="shrink-0 font-mono text-[10px] text-gray-500">
                        {profile.city ?? "remote"}
                      </p>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-gray-500">
                      {match.last_message?.content ?? "start the thread."}
                    </p>
                  </div>
                  {index === 0 && !match.last_message ? (
                    <div className="h-1.5 w-1.5 bg-black rounded-full" />
                  ) : (
                    <div />
                  )}
                </Link>
              );
            })
          ) : (
            <p className="py-24 text-center font-mono text-xs text-gray-500">no active chats yet.</p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {activeRequests.length ? (
            activeRequests.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between gap-4 py-5 px-2 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative h-10 w-10 border border-black bg-gray-100 overflow-hidden shrink-0">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-full w-full object-cover grayscale"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-mono text-xs font-bold bg-gray-200">
                        {profile.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate font-bold text-sm">{profile.full_name ?? profile.username}</p>
                      <p className="shrink-0 font-mono text-[10px] text-gray-500">
                        {profile.city ?? "remote"}
                      </p>
                    </div>
                    {profile.role_title && (
                      <p className="mt-0.5 truncate font-mono text-[10px] text-gray-600">
                        {profile.role_title}
                        {profile.company && ` @ ${profile.company}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => void handleAccept(profile)}
                    disabled={acceptingId !== null}
                    className="inline-flex items-center gap-1 border border-black bg-black px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition-all duration-150 hover:bg-white hover:text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  >
                    {acceptingId === profile.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="h-3 w-3" />
                        <span>Accept</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleIgnore(profile.id)}
                    disabled={acceptingId !== null}
                    className="inline-flex items-center gap-1 border border-gray-300 bg-white px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 transition-all duration-150 hover:border-black hover:text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Ignore</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-24 text-center font-mono text-xs text-gray-500">
              no pending connection requests.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
