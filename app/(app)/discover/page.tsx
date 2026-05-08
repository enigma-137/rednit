"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MatchModal } from "@/components/match/MatchModal";
import { SwipeStack } from "@/components/cards/SwipeStack";
import { useDiscover } from "@/lib/hooks/useDiscover";
import type { Profile } from "@/lib/types";

export default function DiscoverPage() {
  const { profiles, loading, like, pass } = useDiscover();
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
      <AnimatePresence>
        <MatchModal profile={matchedProfile} onClose={() => setMatchedProfile(null)} />
      </AnimatePresence>
    </>
  );
}
