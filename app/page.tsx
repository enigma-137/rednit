"use client";

import Link from "next/link";
import { Github, Heart, MessageSquare, Terminal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  async function signInWithGithub() {
    if (!hasSupabaseConfig()) {
      window.location.href = "/discover";
      return;
    }

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${siteUrl}/api/auth/callback`
      }
    });
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <section className="grid min-h-screen grid-rows-[auto_1fr_auto] px-5">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-black py-5">
          <Link href="/" className="text-xl font-black tracking-[-0.04em]">
            rednit
          </Link>
          <Link
            href="/login"
            className="font-sans text-xs font-bold uppercase tracking-[0.1em]"
          >
            Login
          </Link>
        </header>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 py-12 lg:grid-cols-[1fr_420px]">
          <section className="max-w-3xl">
            <p className="font-mono text-sm text-gray-600">{"// github-only dating"}</p>
            <h1 className="mt-6 text-[56px] font-black leading-[0.92] tracking-[-0.04em] sm:text-[88px] lg:text-[112px]">
              date developers. not profiles.
            </h1>
            <p className="mt-8 max-w-xl font-mono text-sm leading-7 text-gray-800 sm:text-base">
              rednit is a monochrome dating app for people who ship, refactor,
              argue about naming, and still believe a good README means something.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button onClick={signInWithGithub} className="gap-3">
                <Github aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                Continue with GitHub
              </Button>
              <Link
                href="/discover"
                className="inline-flex h-12 items-center justify-center border border-black bg-white px-5 font-sans text-xs font-bold uppercase tracking-[0.1em] transition-colors duration-150 hover:bg-black hover:text-white"
              >
                Preview App
              </Link>
            </div>
          </section>

          <aside className="border border-black bg-white">
            <div className="flex items-center justify-between border-b border-black px-4 py-3 font-mono text-xs">
              <span>discover.tsx</span>
              <span>matchable</span>
            </div>
            <div className="p-4">
              <div className="border border-black">
                <div className="aspect-square border-b border-black bg-gray-100">
                  <div className="grid h-full place-items-center">
                    <Terminal aria-hidden className="h-20 w-20" strokeWidth={1} />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-[-0.01em]">
                        senior frontend
                      </h2>
                      <p className="mt-1 font-mono text-sm text-gray-600">Lagos</p>
                    </div>
                    <div className="h-2 w-2 bg-black" />
                  </div>
                  <p className="mt-5 font-mono text-sm leading-6">
                    Typescript, motion systems, tiny interfaces, clean commits,
                    coffee after deploys.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-200 pt-5">
                    <div className="flex h-12 items-center justify-center border border-black">
                      <MessageSquare aria-hidden className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div className="flex h-12 items-center justify-center border border-black bg-black text-white">
                      <Heart aria-hidden className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mx-auto grid w-full max-w-6xl grid-cols-1 border-t border-black py-5 font-mono text-xs text-gray-600 sm:grid-cols-3">
          <span>github oauth only</span>
          <span>zero color interface</span>
          <span>realtime matches and chat</span>
        </footer>
      </section>
    </main>
  );
}
