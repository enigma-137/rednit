"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function ProfileNudgeBanner() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDismissed, setIsDismissed] = useState(true); // default to true to avoid flash
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("profile-nudge-dismissed") === "true";
    if (dismissed) {
      setLoading(false);
      return;
    }

    async function checkProfile() {
      try {
        if (!hasSupabaseConfig()) {
          // Check localStorage mock profile
          const saved = localStorage.getItem("rednit_mock_profile");
          let currentProf: Profile;
          if (saved) {
            currentProf = JSON.parse(saved);
          } else {
            // Simulate an incomplete profile by default for sandbox preview
            currentProf = {
              id: "me",
              username: "dev-mock",
              full_name: "Mock Developer",
              avatar_url: "",
              bio: "",
              role_title: "", // empty to trigger nudge
              skills: [],     // empty to trigger nudge
              looking_for: [],
              portfolio_url: null,
              github_url: null,
              city: null,
              company: null,
              twitter_url: null
            };
          }
          setProfile(currentProf);
          
          const incomplete = !currentProf.role_title || !currentProf.skills || currentProf.skills.length === 0;
          setIsDismissed(!incomplete);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          setProfile(data);
          const incomplete = !data.role_title || !data.skills || data.skills.length === 0;
          setIsDismissed(!incomplete);
        } else {
          setIsDismissed(false);
        }
      } catch (err) {
        console.error("Error checking profile for nudge:", err);
      } finally {
        setLoading(false);
      }
    }

    void checkProfile();
  }, []);

  if (loading || isDismissed) return null;

  const isMissingRole = !profile?.role_title;
  const isMissingSkills = !profile?.skills || profile.skills.length === 0;

  if (!isMissingRole && !isMissingSkills) return null;

  function handleDismiss() {
    sessionStorage.setItem("profile-nudge-dismissed", "true");
    setIsDismissed(true);
  }

  return (
    <div className="border-b border-black bg-gray-50 font-mono text-[11px] text-black">
      <div className="mx-auto max-w-5xl px-5 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle className="h-4 w-4 shrink-0 text-black" strokeWidth={1.5} />
          <p className="truncate leading-tight">
            <span className="font-bold uppercase">⚡ Complete Profile: </span>
            <span>
              Add your{" "}
              {isMissingRole && isMissingSkills
                ? "role and skills"
                : isMissingRole
                ? "developer role title"
                : "tech stack skills"}{" "}
              so other collaborators can find and connect with you.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/profile"
            className="border border-black bg-black text-white px-2 py-1 text-[9px] font-sans font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
          >
            Update
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-200 transition-colors border border-transparent hover:border-black"
            aria-label="Dismiss banner"
          >
            <X className="h-3 w-3 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
