"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type AvatarUploadProps = {
  userId: string | null;
  initialUrl?: string | null;
  onUploaded: (url: string) => void;
};

export function AvatarUpload({ userId, initialUrl, onUploaded }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !userId) return;
    if (!hasSupabaseConfig()) {
      window.alert("Add your Supabase keys before uploading avatars.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${userId}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true
    });

    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      onUploaded(data.publicUrl);
    }

    setUploading(false);
  }

  return (
    <div>
      <div className="relative aspect-square w-32 border border-black bg-gray-100">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill sizes="128px" className="object-cover grayscale" />
        ) : null}
      </div>
      <label className="mt-3 inline-block cursor-pointer font-mono text-xs">
        {uploading ? "uploading" : "change photo"}
        <input type="file" accept="image/*" className="sr-only" onChange={upload} />
      </label>
    </div>
  );
}
