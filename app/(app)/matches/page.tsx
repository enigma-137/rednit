import Image from "next/image";
import Link from "next/link";
import { mockMatches } from "@/lib/mock-data";

export default function MatchesPage() {
  return (
    <section className="mx-auto min-h-screen max-w-2xl px-5 py-8">
      <header className="border-b border-black pb-6">
        <h1 className="text-3xl font-black tracking-[-0.02em]">matches</h1>
      </header>

      <div className="divide-y divide-gray-200">
        {mockMatches.length ? (
          mockMatches.map((match, index) => {
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
                    <p className="shrink-0 font-mono text-xs text-gray-600">{profile.city}</p>
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
          <p className="py-24 text-center font-mono text-sm">no matches yet.</p>
        )}
      </div>
    </section>
  );
}
