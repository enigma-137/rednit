"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
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
  const [showFilters, setShowFilters] = useState(false);

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

  const isProfileIncomplete =
    currentUserProfile &&
    (!currentUserProfile.role_title ||
      !currentUserProfile.skills ||
      currentUserProfile.skills.length === 0 ||
      !currentUserProfile.looking_for ||
      currentUserProfile.looking_for.length === 0);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-start pb-8">
      {/* Profile Incomplete Warning Banner */}
      {isProfileIncomplete && (
        <div className="mx-auto w-full max-w-[420px] px-3 pt-6 shrink-0">
          <div className="border border-black bg-gray-50 p-4 font-mono text-xs text-black space-y-3">
            <div className="font-bold uppercase tracking-wider text-black">
              ⚡ Profile Incomplete
            </div>
            <p className="leading-5">
              Add your role, skills, and goals so other collaborators can find and connect with you.
            </p>
            <Link
              href="/profile/edit"
              className="inline-block border border-black bg-black text-white px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
            >
              Update Profile
            </Link>
          </div>
        </div>
      )}

      {/* Filter Header and Icon button */}
      <div className="mx-auto w-full max-w-[420px] px-3 pt-6 flex justify-between items-center shrink-0">
        <span className="font-mono text-xs uppercase text-gray-500">Discover Developers</span>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-8 w-8 items-center justify-center border border-black transition-colors ${
            showFilters ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
          }`}
          aria-label="Toggle Filters"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div className="mx-auto w-full max-w-[420px] px-3 pt-3 shrink-0">
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
      )}

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
