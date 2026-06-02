"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Github, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

const profiles = [
  {
    name: "Ada",
    location: "Lagos",
    description: "Founder, product strategy, community-led build.",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Chike",
    location: "Abuja",
    description: "Backend systems, startups, developer communities.",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Maya",
    location: "Berlin",
    description: "Design systems, product thinking, remote-first teams.",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Riley",
    location: "Toronto",
    description: "Open source, developer tooling, small teams, fast feedback.",
    image:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=80"
  }
];

export default function HomePage() {
  const [activeProfileIndex, setActiveProfileIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveProfileIndex((index) => (index + 1) % profiles.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

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
          <button
            disabled
            title="Login disabled — we're building"
            className="font-sans text-xs font-bold uppercase tracking-[0.1em] disabled:cursor-not-allowed disabled:opacity-40"
            aria-disabled="true"
          >
            Login
          </button>
        </header>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 py-12 lg:grid-cols-[1fr_420px]">
          <section className="max-w-3xl">
            <p className="font-mono text-sm text-gray-600">{"// developers meeting — we are cooking"}</p>
            <h1 className="mt-6 text-[56px] font-black leading-[0.92] tracking-[-0.04em] sm:text-[88px] lg:text-[112px]">
              meet founders. meet friends. build together.
            </h1>
            <p className="mt-8 max-w-xl font-mono text-sm leading-7 text-gray-800 sm:text-base">
              rednit is a minimalist developers meeting app to find collaborators,
              discover job opportunities, hire talent, and build things together.
              We&apos;re cooking — join us.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                disabled
                title="Sign in disabled — we're building"
                aria-disabled="true"
                className="gap-3"
              >
                <Github aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                Continue with GitHub
              </Button>
              <Link
                href="/preview"
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
                  <div className="h-full overflow-hidden">
                    <img
                      src={profiles[activeProfileIndex].image}
                      alt={profiles[activeProfileIndex].name}
                      className="h-full w-full object-cover grayscale"
                    />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-[-0.01em]">
                        {profiles[activeProfileIndex].name}
                      </h2>
                      <p className="mt-1 font-mono text-sm text-gray-600">
                        {profiles[activeProfileIndex].location}
                      </p>
                    </div>
                    <div className="h-2 w-2 bg-black" />
                  </div>
                  <p className="mt-5 font-mono text-sm leading-6">
                    {profiles[activeProfileIndex].description}
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
          <span>meet founders & teams</span>
          <span>hire & find jobs</span>
          <span>we are cooking</span>
        </footer>
      </section>
    </main>
  );
}
