import Image from "next/image";
import { Github, Heart } from "lucide-react";
import { hasSupabaseConfig } from "@/lib/env";
import { mockProfiles } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

type IncomingLike = {
  id: string;
  created_at: string;
  profile?: Profile;
  matched: boolean;
};

async function getIncomingLikes(): Promise<IncomingLike[]> {
  if (!hasSupabaseConfig()) {
    return mockProfiles.slice(0, 2).map((profile, index) => ({
      id: `mock-like-${profile.id}`,
      created_at: new Date(Date.now() - index * 60000).toISOString(),
      profile,
      matched: index === 0
    }));
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: incomingLikes } = await supabase
    .from("likes")
    .select("id, from_user_id, created_at")
    .eq("to_user_id", user.id)
    .order("created_at", { ascending: false });

  if (!incomingLikes?.length) return [];

  const likerIds = incomingLikes.map((like) => like.from_user_id);

  const [{ data: profiles }, { data: outgoingLikes }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", likerIds),
    supabase.from("likes").select("to_user_id").eq("from_user_id", user.id).in("to_user_id", likerIds)
  ]);

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const matchedIds = new Set((outgoingLikes ?? []).map((like) => like.to_user_id));

  return incomingLikes.map((like) => ({
    id: like.id,
    created_at: like.created_at,
    profile: profilesById.get(like.from_user_id),
    matched: matchedIds.has(like.from_user_id)
  }));
}

export default async function MatchesPage() {
  const likes = await getIncomingLikes();

  return (
    <section className="mx-auto min-h-screen max-w-2xl px-5 py-8">
      <header className="border-b border-black pb-6">
        <h1 className="text-3xl font-black tracking-[-0.02em]">likes</h1>
      </header>

      <div className="divide-y divide-gray-200">
        {likes.length ? (
          likes.map((like) => {
            const profile = like.profile;
            if (!profile) return null;

            return (
              <article key={like.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-4 py-5">
                <div className="relative h-14 w-14 border border-black bg-gray-100">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover grayscale"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold">{profile.full_name ?? profile.username}</p>
                  <div className="mt-1 flex min-w-0 items-center gap-2 font-mono text-xs text-gray-600">
                    <Github aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">@{profile.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  {like.matched ? <span>matched</span> : <span>liked you</span>}
                  <Heart aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                </div>
              </article>
            );
          })
        ) : (
          <p className="py-24 text-center font-mono text-sm">no likes yet.</p>
        )}
      </div>
    </section>
  );
}
