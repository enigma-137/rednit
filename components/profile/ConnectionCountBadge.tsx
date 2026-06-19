"use client";

import { useEffect, useState } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { mockMatches } from "@/lib/mock-data";

type ConnectionCountBadgeProps = {
  userId: string;
  initialCount?: number;
};

export function ConnectionCountBadge({ userId, initialCount }: ConnectionCountBadgeProps) {
  const [count, setCount] = useState<number | null>(initialCount ?? null);

  useEffect(() => {
    // If Supabase config exists, we rely on initialCount passed from server-side query,
    // or we can query client-side if initialCount wasn't loaded.
    if (hasSupabaseConfig()) {
      if (initialCount !== undefined) {
        setCount(initialCount);
      }
      return;
    }

    // Client-side local storage fallback for mock sandbox mode
    function loadMockCount() {
      const stored = localStorage.getItem("rednit_mock_matches");
      let activeMatches = [];
      if (stored) {
        try {
          activeMatches = JSON.parse(stored);
        } catch (e) {
          activeMatches = mockMatches;
        }
      } else {
        activeMatches = mockMatches;
      }

      // Filter matches where current user is involved
      const userMatchesCount = activeMatches.filter(
        (m: any) => m.user_a_id === userId || m.user_b_id === userId
      ).length;

      setCount(userMatchesCount);
    }

    loadMockCount();

    // Listen for storage events (e.g. if a match is added/removed in another tab or component)
    window.addEventListener("storage", loadMockCount);
    return () => {
      window.removeEventListener("storage", loadMockCount);
    };
  }, [userId, initialCount]);

  if (count === null) {
    return (
      <div className="inline-flex items-center gap-1.5 border border-black bg-black text-white px-3 py-1 font-mono text-xs uppercase font-bold animate-pulse">
        ★ -- Connections
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 border border-black bg-black text-white px-3 py-1 font-mono text-xs uppercase font-bold">
      ★ {count} {count === 1 ? "Connection" : "Connections"}
    </div>
  );
}
