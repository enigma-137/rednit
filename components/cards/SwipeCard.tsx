"use client";

import { useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Github, Link as LinkIcon } from "lucide-react";
import { GitHubStats } from "@/components/profile/GitHubStats";
import type { Profile } from "@/lib/types";

type SwipeCardProps = {
  profile: Profile;
  active?: boolean;
  index?: number;
  onLike: (profile: Profile) => void;
  onPass: (profile: Profile) => void;
  onSelectSkill?: (skill: string) => void;
};

export function SwipeCard({
  profile,
  active = true,
  index = 0,
  onLike,
  onPass,
  onSelectSkill
}: SwipeCardProps) {
  const [showGitStats, setShowGitStats] = useState(false);
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
      className="absolute inset-0 bg-white p-4 sm:p-5"
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
        className="pointer-events-none absolute left-4 top-4 font-mono text-sm font-bold uppercase tracking-[0.1em] border border-black bg-white px-3 py-1 text-black shadow-sm"
        style={{ opacity: likeOpacity }}
      >
        Connect
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-4 top-4 font-mono text-sm font-bold uppercase tracking-[0.1em] border border-black bg-white px-3 py-1 text-black shadow-sm"
        style={{ opacity: passOpacity }}
      >
        Skip
      </motion.div>

      <div className="flex h-full min-h-0 flex-col overflow-hidden border border-black">
        <div className="relative h-[40%] min-h-[160px] shrink-0 border-b border-black bg-gray-100 sm:h-[45%]">
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

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
          <div className="shrink-0">
            <h2 className="truncate text-2xl font-bold leading-tight tracking-[-0.01em]">
              {profile.full_name ?? profile.username}
            </h2>
            {(profile.role_title || profile.company) && (
              <p className="mt-1 font-mono text-sm text-gray-800 font-bold truncate">
                {profile.role_title}
                {profile.role_title && profile.company && " @ "}
                {profile.company}
              </p>
            )}
            <p className="mt-0.5 font-mono text-xs text-gray-500">{profile.city ?? "remote"}</p>
          </div>

          <p className="mt-3 line-clamp-2 font-mono text-xs leading-5">
            {profile.bio ?? "No bio yet. Suspicious, but not disqualifying."}
          </p>

          {profile.looking_for && profile.looking_for.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1 shrink-0">
              {profile.looking_for.map((item) => (
                <span
                  key={item}
                  className="border border-black bg-black text-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                >
                  {item.replace("-", " ")}
                </span>
              ))}
            </div>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1 shrink-0">
              {profile.skills.slice(0, 4).map((skill) => (
                <button
                  key={skill}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectSkill?.(skill);
                  }}
                  className="border border-black bg-gray-100 px-2 py-0.5 font-mono text-[9px] text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  {skill}
                </button>
              ))}
            </div>
          )}

          <div className="mt-auto min-w-0 shrink-0 border-t border-gray-200 pt-3 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <a
                href={profile.github_url ?? `https://github.com/${profile.username}`}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 hover:underline"
              >
                <Github aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                <span className="truncate">{profile.username}</span>
              </a>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowGitStats(true);
                }}
                className="border border-black bg-white hover:bg-black hover:text-white px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors shrink-0"
              >
                Stats
              </button>
            </div>

            {profile.portfolio_url ? (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 hover:underline"
              >
                <LinkIcon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                <span className="truncate">
                  {profile.portfolio_url.replace(/^https?:\/\//, "")}
                </span>
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* GitHub Stats Popup Overlay */}
      {showGitStats && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/95 p-4 select-none">
          <div className="w-full max-w-[320px] border border-black bg-white p-4 font-mono shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <GitHubStats username={profile.username} />
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowGitStats(false);
              }}
              className="mt-4 w-full border border-black bg-black text-white hover:bg-white hover:text-black py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Close Metrics
            </button>
          </div>
        </div>
      )}
    </motion.article>
  );
}
