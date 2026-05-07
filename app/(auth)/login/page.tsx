"use client";

import { Github } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function signInWithGithub() {
    if (!hasSupabaseConfig()) {
      window.alert("Add your Supabase URL and anon key in .env.local first.");
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
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <section className="w-full max-w-sm animate-fade-up text-center">
        <h1 className="text-[64px] font-black leading-none tracking-[-0.04em]">
          rednit
        </h1>
        <p className="mt-4 font-mono text-sm text-gray-600">
          {"// for developers only"}
        </p>
        <Button onClick={signInWithGithub} className="mt-12 w-full gap-3">
          <Github aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          Continue with GitHub
        </Button>
      </section>
    </main>
  );
}
