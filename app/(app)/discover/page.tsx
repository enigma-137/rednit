"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MatchModal } from "@/components/match/MatchModal";
import { SwipeStack } from "@/components/cards/SwipeStack";
import { useDiscover } from "@/lib/hooks/useDiscover";
import type { Profile } from "@/lib/types";

export default function DiscoverPage() {
  const { profiles, currentUserProfile, loading, loadingMore, hasMore, like, pass, loadMore } = useDiscover();
  const [matchData, setMatchData] = useState<{ profile: Profile; matchId: string } | null>(null);
  const [searchSkill, setSearchSkill] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  async function handleLike(profile: Profile) {
    const matchResult = await like(profile);
    if (matchResult) setMatchData(matchResult);
  }

  const filteredProfiles = profiles.filter((profile) => {
    if (searchSkill) {
      const hasSkill = (profile.skills ?? []).some((s) =>
        s.toLowerCase().includes(searchSkill.toLowerCase())
      );
      if (!hasSkill) return false;
    }
    if (selectedRole) {
      const hasRole = (profile.looking_for ?? []).includes(selectedRole);
      if (!hasRole) return false;
    }
    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-start pb-8">
      <div className="mx-auto w-full max-w-[420px] px-3 pt-6 shrink-0">
        <div className="flex flex-col gap-3 border border-black p-4 bg-white">
          <div className="flex items-center justify-between border-b border-black pb-2">
            <span className="font-mono text-xs font-bold uppercase">filters</span>
            {(searchSkill || selectedRole) && (
              <button
                onClick={() => {
                  setSearchSkill("");
                  setSelectedRole("");
                }}
                className="font-mono text-[10px] uppercase hover:underline"
              >
                clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 mb-1">
                skill search
              </label>
              <input
                type="text"
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                placeholder="e.g. Rust"
                className="w-full border border-black bg-white px-2 py-1.5 font-mono text-xs outline-none placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 mb-1">
                looking for
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full border border-black bg-white px-2 py-1.5 font-mono text-xs outline-none"
              >
                <option value="">all roles</option>
                <option value="co-founder">co-founder</option>
                <option value="employee">employee</option>
                <option value="employer">employer</option>
                <option value="friend">friend</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <section className="flex flex-1 items-center justify-center px-5 font-mono text-sm">
          loading profiles.
        </section>
      ) : filteredProfiles.length > 0 ? (
        <SwipeStack profiles={filteredProfiles} onLike={handleLike} onPass={pass} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center font-mono text-sm gap-4">
          <span>no matching profiles loaded.</span>
          {hasMore && (
            <button
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="border border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.05em] hover:bg-black hover:text-white transition-colors"
            >
              {loadingMore ? "Loading..." : "Load More from Database"}
            </button>
          )}
        </div>
      )}

      {!loading && filteredProfiles.length > 0 && hasMore && profiles.length === 0 ? (
        <div className="fixed inset-x-0 bottom-20 flex justify-center">
          <button
            onClick={() => void loadMore()}
            className="border border-black bg-white px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.1em]"
          >
            {loadingMore ? "Loading" : "Load More"}
          </button>
        </div>
      ) : null}
      
      <AnimatePresence>
        <MatchModal 
          profile={matchData?.profile ?? null} 
          currentUser={currentUserProfile}
          matchId={matchData?.matchId ?? null}
          onClose={() => setMatchData(null)} 
        />
      </AnimatePresence>
    </div>
  );
}
