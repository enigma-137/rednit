"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MatchModal } from "@/components/match/MatchModal";
import { SwipeStack } from "@/components/cards/SwipeStack";
import { useDiscover } from "@/lib/hooks/useDiscover";
import type { Profile } from "@/lib/types";

export default function DiscoverPage() {
  const { profiles, loading, loadingMore, hasMore, like, pass, loadMore } = useDiscover();
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);

  async function handleLike(profile: Profile) {
    const match = await like(profile);
    if (match) setMatchedProfile(match);
  }

  return (
    <>
      {loading ? (
        <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 font-mono text-sm">
          loading profiles.
        </section>
      ) : (
        <SwipeStack profiles={profiles} onLike={handleLike} onPass={pass} />
      )}
      {!loading && profiles.length === 0 && hasMore ? (
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
        <MatchModal profile={matchedProfile} onClose={() => setMatchedProfile(null)} />
      </AnimatePresence>
    </>
  );
}
