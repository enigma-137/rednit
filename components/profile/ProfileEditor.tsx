"use client";

import { FormEvent, useEffect, useState } from "react";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const fallbackProfile: Profile = {
  id: "",
  username: "your-github",
  full_name: "",
  avatar_url: "",
  bio: "",
  portfolio_url: "",
  github_url: "https://github.com/your-github",
  city: ""
};

export function ProfileEditor() {
  const [profile, setProfile] = useState<Profile>(fallbackProfile);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const supabase = createClient();

    async function loadProfile() {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setStatus("Sign in with GitHub before editing your profile.");
        return;
      }

      const username =
        user.user_metadata.user_name ??
        user.user_metadata.preferred_username ??
        user.email?.split("@")[0] ??
        "developer";

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error?.code === "PGRST205") {
        setStatus("Supabase is missing public.profiles. Run supabase/schema.sql in the SQL editor.");
        setProfile({
          ...fallbackProfile,
          id: user.id,
          username,
          full_name: user.user_metadata.full_name ?? "",
          avatar_url: user.user_metadata.avatar_url ?? "",
          github_url: `https://github.com/${username}`
        });
        return;
      }

      if (error) {
        setStatus(error.message);
      }

      setProfile(
        data ?? {
          ...fallbackProfile,
          id: user.id,
          username,
          full_name: user.user_metadata.full_name ?? "",
          avatar_url: user.user_metadata.avatar_url ?? "",
          github_url: `https://github.com/${username}`
        }
      );
    }

    void loadProfile();
  }, []);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setStatus(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasSupabaseConfig()) {
      setSaved(true);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setStatus("Sign in with GitHub before saving your profile.");
      return;
    }

    const username =
      profile.username ||
      user.user_metadata.user_name ||
      user.user_metadata.preferred_username ||
      user.email?.split("@")[0] ||
      "developer";

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        username,
        full_name: profile.full_name,
        bio: profile.bio,
        portfolio_url: profile.portfolio_url,
        city: profile.city,
        avatar_url: profile.avatar_url,
        github_url: profile.github_url || `https://github.com/${username}`,
        updated_at: new Date().toISOString()
      });

    if (error?.code === "PGRST205") {
      setStatus("Supabase is missing public.profiles. Run supabase/schema.sql in the SQL editor.");
      return;
    }

    if (error) {
      setStatus(error.message);
      return;
    }

    setSaved(true);
    setStatus(null);
  }

  return (
    <form onSubmit={save} className="mx-auto min-h-screen max-w-2xl px-5 py-8">
      <header className="border-b border-black pb-6">
        <h1 className="text-3xl font-black tracking-[-0.02em]">profile</h1>
      </header>

      {status ? (
        <div className="mt-6 border border-black p-4 font-mono text-sm leading-6">
          {status}
        </div>
      ) : null}

      <div className="grid gap-8 py-8">
        <AvatarUpload
          userId={profile.id || null}
          initialUrl={profile.avatar_url}
          onUploaded={(url) => update("avatar_url", url)}
        />
        <Input
          label="full name"
          value={profile.full_name ?? ""}
          onChange={(event) => update("full_name", event.target.value)}
        />
        <label className="block">
          <Textarea
            label="bio"
            maxLength={300}
            value={profile.bio ?? ""}
            onChange={(event) => update("bio", event.target.value)}
          />
          <span className="mt-2 block text-right font-mono text-xs text-gray-600">
            {(profile.bio ?? "").length}/300
          </span>
        </label>
        <Input
          label="portfolio url"
          value={profile.portfolio_url ?? ""}
          onChange={(event) => update("portfolio_url", event.target.value)}
        />
        <Input
          label="city"
          value={profile.city ?? ""}
          onChange={(event) => update("city", event.target.value)}
        />
        <Input label="github url" value={profile.github_url ?? ""} disabled readOnly />
      </div>

      <Button className="w-full" type="submit">
        {saved ? "Saved" : "Save Profile"}
      </Button>
    </form>
  );
}
