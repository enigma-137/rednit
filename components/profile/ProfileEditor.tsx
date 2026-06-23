"use client";

import { FormEvent, useEffect, useState } from "react";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { mockProfiles } from "@/lib/mock-data";
import type { Profile } from "@/lib/types";

const fallbackProfile: Profile = {
  id: "",
  username: "your-github",
  full_name: "",
  avatar_url: "",
  bio: "",
  portfolio_url: "",
  github_url: "https://github.com/your-github",
  city: "",
  skills: [],
  looking_for: [],
  role_title: "",
  company: "",
  twitter_url: ""
};

export function ProfileEditor() {
  const [profile, setProfile] = useState<Profile>(
    hasSupabaseConfig() ? fallbackProfile : mockProfiles[0]
  );
  const [skillsInput, setSkillsInput] = useState(
    hasSupabaseConfig() ? "" : (mockProfiles[0].skills ?? []).join(", ")
  );
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      const savedProfile = localStorage.getItem("rednit_mock_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setSkillsInput((parsed.skills ?? []).join(", "));
      }
      return;
    }

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
        const localProf = {
          ...fallbackProfile,
          id: user.id,
          username,
          full_name: user.user_metadata.full_name ?? "",
          avatar_url: user.user_metadata.avatar_url ?? "",
          github_url: `https://github.com/${username}`
        };
        setProfile(localProf);
        setSkillsInput((localProf.skills ?? []).join(", "));
        return;
      }

      if (error) {
        setStatus(error.message);
      }

      const loadedProfile = data ?? {
        ...fallbackProfile,
        id: user.id,
        username,
        full_name: user.user_metadata.full_name ?? "",
        avatar_url: user.user_metadata.avatar_url ?? "",
        github_url: `https://github.com/${username}`
      };
      setProfile(loadedProfile);
      setSkillsInput((loadedProfile.skills ?? []).join(", "));
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
      localStorage.setItem("rednit_mock_profile", JSON.stringify(profile));
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
        skills: profile.skills,
        looking_for: profile.looking_for,
        role_title: profile.role_title,
        company: profile.company,
        twitter_url: profile.twitter_url,
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
          initialUrl={profile.avatar_url}
          onUploadComplete={(url) => update("avatar_url", url)}
        />
        <Input
          label="full name"
          value={profile.full_name ?? ""}
          onChange={(event) => update("full_name", event.target.value)}
        />
        <Input
          label="current role"
          value={profile.role_title ?? ""}
          placeholder="e.g. Senior Backend Engineer"
          onChange={(event) => update("role_title", event.target.value)}
        />
        <Input
          label="company"
          value={profile.company ?? ""}
          placeholder="e.g. Acme Corp"
          onChange={(event) => update("company", event.target.value)}
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
        <div className="block">
          <span className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.1em]">
            looking for
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { id: "co-founder", label: "Co-Founder" },
              { id: "employee", label: "Employee" },
              { id: "employer", label: "Employer" },
              { id: "friend", label: "Friend" }
            ].map((option) => {
              const isSelected = (profile.looking_for ?? []).includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    const current = profile.looking_for ?? [];
                    const updated = isSelected
                      ? current.filter((x) => x !== option.id)
                      : [...current, option.id];
                    update("looking_for", updated);
                  }}
                  className={`border border-black px-4 py-2 font-mono text-xs transition-colors duration-150 ${
                    isSelected ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="block">
          <Input
            label="skills (comma separated)"
            placeholder="e.g. Rust, TypeScript, PostgreSQL"
            value={skillsInput}
            onChange={(event) => {
              const val = event.target.value;
              setSkillsInput(val);
              const parsed = val
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);
              update("skills", parsed);
            }}
          />
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="border border-black bg-gray-100 px-3 py-1 font-mono text-xs text-black"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
        <Input
          label="portfolio url"
          value={profile.portfolio_url ?? ""}
          onChange={(event) => update("portfolio_url", event.target.value)}
        />
        <Input
          label="twitter url"
          value={profile.twitter_url ?? ""}
          placeholder="e.g. https://twitter.com/handle"
          onChange={(event) => update("twitter_url", event.target.value)}
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
