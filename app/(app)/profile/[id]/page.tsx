"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Github, Link as LinkIcon, MapPin, Twitter, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GitHubStats } from "@/components/profile/GitHubStats";
import { ConnectionCountBadge } from "@/components/profile/ConnectionCountBadge";
import { hasSupabaseConfig } from "@/lib/env";
import { mockProfiles, mockMatches } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const targetUserId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionCount, setConnectionCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId) return;

    async function loadProfile() {
      try {
        if (!hasSupabaseConfig()) {
          // Local Mock Mode
          const matchedProfile = mockProfiles.find(
            (p) => p.id === targetUserId || p.username === targetUserId
          );

          if (!matchedProfile) {
            setProfile(null);
            setLoading(false);
            return;
          }

          setProfile(matchedProfile);

          // Check if connected
          if (targetUserId === "me" || targetUserId === mockProfiles[0].id) {
            setIsConnected(true);
          } else {
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

            const matched = activeMatches.some(
              (m: any) =>
                (m.user_a_id === "me" && m.user_b_id === matchedProfile.id) ||
                (m.user_a_id === matchedProfile.id && m.user_b_id === "me")
            );
            setIsConnected(matched);

            // Compute connection count for target user
            const targetCount = activeMatches.filter(
              (m: any) => m.user_a_id === matchedProfile.id || m.user_b_id === matchedProfile.id
            ).length;
            setConnectionCount(targetCount);
          }
          setLoading(false);
          return;
        }

        // Supabase Mode
        const supabase = createClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch target profile
        const { data: targetProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetUserId)
          .maybeSingle();

        if (!targetProfile) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(targetProfile);

        // Check connection
        if (user.id === targetProfile.id) {
          setIsConnected(true);
        } else {
          const userAId = user.id < targetProfile.id ? user.id : targetProfile.id;
          const userBId = user.id < targetProfile.id ? targetProfile.id : user.id;

          const { data: match } = await supabase
            .from("matches")
            .select("id")
            .eq("user_a_id", userAId)
            .eq("user_b_id", userBId)
            .maybeSingle();

          setIsConnected(!!match);
        }

        // Fetch connections count
        const { count } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .or(`user_a_id.eq.${targetProfile.id},user_b_id.eq.${targetProfile.id}`);

        setConnectionCount(count ?? 0);
        setLoading(false);
      } catch (err) {
        console.error("Error loading profile details:", err);
        setLoading(false);
      }
    }

    void loadProfile();
  }, [targetUserId]);

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center font-mono text-sm">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-black" strokeWidth={1.5} />
          <span>loading developer profile...</span>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center font-mono text-sm">
        <p className="mb-6">Profile not found.</p>
        <Link href="/discover">
          <Button type="button">Go to Discover</Button>
        </Link>
      </section>
    );
  }

  if (isConnected === false) {
    return (
      <section className="mx-auto min-h-screen max-w-2xl px-5 py-8 flex flex-col">
        <header className="flex items-center gap-4 border-b border-black pb-6">
          <button
            onClick={() => router.back()}
            className="border border-black bg-white hover:bg-black hover:text-white p-2 transition-colors"
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <h1 className="text-3xl font-black tracking-[-0.02em]">developer profile</h1>
        </header>

        <div className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-md border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-mono text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center border-2 border-black bg-gray-100 mb-6">
              <Lock className="h-6 w-6 text-black" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-3">Connection Required</h2>
            <p className="text-sm leading-relaxed text-gray-700 mb-6">
              You can only view profiles of developers you are connected with. Match with them on the Discover feed or start a chat!
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/discover">
                <Button className="w-full justify-center">
                  Find Developers
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="outline" className="w-full justify-center">
                  View Messages
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto min-h-screen max-w-2xl px-5 py-8">
      <header className="flex items-center gap-4 border-b border-black pb-6">
        <button
          onClick={() => router.back()}
          className="border border-black bg-white hover:bg-black hover:text-white p-2 transition-colors"
          aria-label="Go Back"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <h1 className="text-3xl font-black tracking-[-0.02em]">developer profile</h1>
      </header>

      <article className="py-8">
        <div className="relative aspect-square w-40 border border-black bg-gray-100">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              fill
              sizes="160px"
              className="object-cover grayscale"
            />
          ) : null}
        </div>

        <h2 className="mt-8 text-4xl font-black tracking-[-0.03em]">
          {profile.full_name || profile.username}
        </h2>
        {(profile.role_title || profile.company) && (
          <p className="mt-2 font-mono text-sm text-gray-800 font-bold">
            {profile.role_title}
            {profile.role_title && profile.company && " @ "}
            {profile.company}
          </p>
        )}
        <p className="mt-1 font-mono text-xs text-gray-500">@{profile.username}</p>

        <div className="mt-4">
          <ConnectionCountBadge userId={profile.id} initialCount={connectionCount} />
        </div>

        {profile.bio ? (
          <p className="mt-6 border-t border-gray-200 pt-6 font-mono text-sm leading-7">
            {profile.bio}
          </p>
        ) : (
          <p className="mt-6 border-t border-gray-200 pt-6 font-mono text-sm text-gray-600">
            no bio yet.
          </p>
        )}

        {profile.looking_for && profile.looking_for.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <span className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
              looking for
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.looking_for.map((item) => (
                <span
                  key={item}
                  className="border border-black bg-black text-white px-3 py-1 font-mono text-xs uppercase"
                >
                  {item.replace("-", " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <span className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
              skills
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="border border-black bg-gray-100 px-3 py-1 font-mono text-xs text-black"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-gray-200 pt-6">
          <GitHubStats username={profile.username} />
        </div>

        <div className="mt-8 grid gap-4 border-t border-gray-200 pt-8 font-mono text-sm">
          <div className="flex items-center gap-3">
            <MapPin aria-hidden className="h-4 w-4" strokeWidth={1.5} />
            {profile.city || "remote"}
          </div>
          <a
            href={profile.github_url || `https://github.com/${profile.username}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3"
          >
            <Github aria-hidden className="h-4 w-4" strokeWidth={1.5} />
            GitHub
          </a>
          {profile.portfolio_url ? (
            <a
              href={profile.portfolio_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3"
            >
              <LinkIcon aria-hidden className="h-4 w-4" strokeWidth={1.5} />
              Portfolio
            </a>
          ) : null}
          {profile.twitter_url ? (
            <a
              href={profile.twitter_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3"
            >
              <Twitter aria-hidden className="h-4 w-4" strokeWidth={1.5} />
              Twitter / X
            </a>
          ) : null}
        </div>
      </article>
    </section>
  );
}
