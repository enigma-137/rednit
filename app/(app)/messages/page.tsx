import Link from "next/link";
import Image from "next/image";
import { hasSupabaseConfig } from "@/lib/env";
import { mockMatches } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Match, Message, Profile } from "@/lib/types";

async function getMatches() {
  if (!hasSupabaseConfig()) return mockMatches;

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (!matches?.length) return [];

  const otherUserIds = matches.map((match) =>
    match.user_a_id === user.id ? match.user_b_id : match.user_a_id
  );
  const matchIds = matches.map((match) => match.id);

  const [{ data: profiles }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", otherUserIds),
    supabase
      .from("messages")
      .select("*")
      .in("match_id", matchIds)
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const latestMessageByMatchId = new Map<string, Message>();

  for (const message of messages ?? []) {
    if (!latestMessageByMatchId.has(message.match_id)) {
      latestMessageByMatchId.set(message.match_id, message);
    }
  }

  return matches.map((match): Match => {
    const otherUserId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;

    return {
      ...match,
      other_profile: profilesById.get(otherUserId) as Profile | undefined,
      last_message: latestMessageByMatchId.get(match.id) ?? null
    };
  });
}

export default async function MessagesPage() {
  const matches = await getMatches();

  return (
    <section className="mx-auto min-h-screen max-w-2xl px-5 py-8">
      <header className="border-b border-black pb-6">
        <h1 className="text-3xl font-black tracking-[-0.02em]">messages</h1>
      </header>

      <div className="divide-y divide-gray-200">
        {matches.length ? (
          matches.map((match, index) => {
            const profile = match.other_profile;
            if (!profile) return null;

            return (
              <Link
                href={`/chat/${match.id}`}
                key={match.id}
                className="grid grid-cols-[40px_1fr_8px] items-center gap-4 py-5"
              >
                <div className="relative h-10 w-10 border border-black bg-gray-100">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover grayscale"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate font-bold">{profile.full_name ?? profile.username}</p>
                    <p className="shrink-0 font-mono text-xs text-gray-600">
                      {profile.city ?? "remote"}
                    </p>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-gray-600">
                    {match.last_message?.content ?? "start the thread."}
                  </p>
                </div>
                {index === 0 ? <div className="h-1.5 w-1.5 bg-black" /> : <div />}
              </Link>
            );
          })
        ) : (
          <p className="py-24 text-center font-mono text-sm">no messages yet.</p>
        )}
      </div>
    </section>
  );
}
