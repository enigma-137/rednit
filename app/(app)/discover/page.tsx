"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MatchModal } from "@/components/match/MatchModal";
import { SwipeStack } from "@/components/cards/SwipeStack";
import { useDiscover } from "@/lib/hooks/useDiscover";
import type { Profile } from "@/lib/types";

export default function DiscoverPage() {
  const { profiles, like, pass } = useDiscover();
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);

  async function handleLike(profile: Profile) {
    await like(profile);
    if (profile.username === "ada-l") setMatchedProfile(profile);
  }

  return (
    <>
      <SwipeStack profiles={profiles} onLike={handleLike} onPass={pass} />
      <AnimatePresence>
        <MatchModal profile={matchedProfile} onClose={() => setMatchedProfile(null)} />
      </AnimatePresence>
    </>
  );
}
