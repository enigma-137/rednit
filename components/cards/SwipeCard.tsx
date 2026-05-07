"use client";

import Image from "next/image";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Github, Link as LinkIcon } from "lucide-react";
import type { Profile } from "@/lib/types";

type SwipeCardProps = {
  profile: Profile;
  active?: boolean;
  index?: number;
  onLike: (profile: Profile) => void;
  onPass: (profile: Profile) => void;
};

export function SwipeCard({
  profile,
  active = true,
  index = 0,
  onLike,
  onPass
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-160, 0, 160], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [0, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, 0], [1, 0]);
  const borderColor = useTransform(x, [-80, 0, 80], ["#000000", "#000000", "#000000"]);

  async function complete(direction: "left" | "right") {
    await animate(x, direction === "right" ? 640 : -640, {
      type: "spring",
      stiffness: 300,
      damping: 22
    });

    if (direction === "right") onLike(profile);
    else onPass(profile);
  }

  return (
    <motion.article
      className="absolute inset-0 bg-white p-5"
      style={{
        x: active ? x : 0,
        rotate: active ? rotate : 0,
        borderColor,
        zIndex: 10 - index
      }}
      initial={false}
      animate={{
        scale: 1 - index * 0.03,
        y: index * 8,
        opacity: index > 2 ? 0 : 1
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120 || info.velocity.x > 900) void complete("right");
        else if (info.offset.x < -120 || info.velocity.x < -900) void complete("left");
        else void animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
      }}
    >
      <motion.div
        className="pointer-events-none absolute left-4 top-4 font-mono text-sm font-bold uppercase tracking-[0.1em]"
        style={{ opacity: likeOpacity }}
      >
        Like
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-4 top-4 font-mono text-sm font-bold uppercase tracking-[0.1em]"
        style={{ opacity: passOpacity }}
      >
        Pass
      </motion.div>

      <div className="flex h-full flex-col border border-black">
        <div className="relative aspect-square border-b border-black bg-gray-100">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              fill
              sizes="(max-width: 768px) 90vw, 420px"
              className="object-cover grayscale"
              priority={index === 0}
            />
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-[-0.01em]">
              {profile.full_name ?? profile.username}
            </h2>
            <p className="mt-1 font-mono text-sm text-gray-600">{profile.city ?? "remote"}</p>
          </div>

          <p className="mt-5 line-clamp-4 font-mono text-sm leading-6">
            {profile.bio ?? "No bio yet. Suspicious, but not disqualifying."}
          </p>

          <div className="mt-auto space-y-3 border-t border-gray-200 pt-5 font-mono text-xs">
            <a
              href={profile.github_url ?? `https://github.com/${profile.username}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2"
            >
              <Github aria-hidden className="h-4 w-4" strokeWidth={1.5} />
              {profile.username}
            </a>
            {profile.portfolio_url ? (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2"
              >
                <LinkIcon aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                {profile.portfolio_url.replace(/^https?:\/\//, "")}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
