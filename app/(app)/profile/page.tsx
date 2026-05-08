import Image from "next/image";
import Link from "next/link";
import { Github, Link as LinkIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { hasSupabaseConfig } from "@/lib/env";
import { mockProfiles } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

async function getProfile(): Promise<Profile | null> {
  if (!hasSupabaseConfig()) return mockProfiles[0];

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return data;
}

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <section className="mx-auto min-h-screen max-w-2xl px-5 py-8">
      <header className="flex items-center justify-between gap-4 border-b border-black pb-6">
        <h1 className="text-3xl font-black tracking-[-0.02em]">profile</h1>
        <Link href="/profile/edit">
          <Button type="button" variant="outline" className="h-10 px-4">
            Edit
          </Button>
        </Link>
      </header>

      {profile ? (
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
          <p className="mt-2 font-mono text-sm text-gray-600">@{profile.username}</p>

          {profile.bio ? (
            <p className="mt-8 border-t border-gray-200 pt-8 font-mono text-sm leading-7">
              {profile.bio}
            </p>
          ) : (
            <p className="mt-8 border-t border-gray-200 pt-8 font-mono text-sm text-gray-600">
              no bio yet.
            </p>
          )}

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
          </div>
        </article>
      ) : (
        <div className="py-24 text-center">
          <p className="font-mono text-sm">profile not found.</p>
          <Link href="/profile/edit" className="mt-6 inline-block">
            <Button type="button">Create Profile</Button>
          </Link>
        </div>
      )}
    </section>
  );
}
