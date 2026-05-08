"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type AvatarUploadProps = {
  initialUrl?: string | null;
};

export function AvatarUpload({ initialUrl }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialUrl ?? "");

  useEffect(() => {
    setAvatarUrl(initialUrl ?? "");
  }, [initialUrl]);

  return (
    <div>
      <div className="relative aspect-square w-32 border border-black bg-gray-100">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill sizes="128px" className="object-cover grayscale" />
        ) : null}
      </div>
      <p className="mt-3 font-mono text-xs text-gray-600">github photo</p>
    </div>
  );
}
