"use client";

import { Heart, X } from "lucide-react";
import { SwipeCard } from "@/components/cards/SwipeCard";
import type { Profile } from "@/lib/types";

type SwipeStackProps = {
  profiles: Profile[];
  onLike: (profile: Profile) => void;
  onPass: (profile: Profile) => void;
};

export function SwipeStack({ profiles, onLike, onPass }: SwipeStackProps) {
  const visible = profiles.slice(0, 3);
  const top = visible[0];

  return (
    <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-start gap-5 px-3 pb-8 pt-2 sm:justify-center sm:gap-8 sm:px-5 sm:py-8">
      <div className="relative h-[min(68vh,680px)] min-h-[500px] w-full max-w-[420px] border border-black bg-white sm:h-[min(72vh,680px)]">
        {visible.length ? (
          visible
            .map((profile, index) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                index={index}
                active={index === 0}
                onLike={onLike}
                onPass={onPass}
              />
            ))
            .reverse()
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center font-mono text-sm">
            no profiles loaded.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          className="flex h-14 w-14 items-center justify-center rounded-full border border-black bg-white text-black transition-colors hover:bg-black hover:text-white disabled:opacity-30"
          disabled={!top}
          onClick={() => top && onPass(top)}
          aria-label="Pass"
        >
          <X aria-hidden className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button
          className="flex h-14 w-14 items-center justify-center rounded-full border border-black bg-white text-black transition-colors hover:bg-black hover:text-white disabled:opacity-30"
          disabled={!top}
          onClick={() => top && onLike(top)}
          aria-label="Like"
        >
          <Heart aria-hidden className="h-6 w-6" strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}
