"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/lib/types";

type MatchModalProps = {
  profile: Profile | null;
  onClose: () => void;
};

export function MatchModal({ profile, onClose }: MatchModalProps) {
  if (!profile) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white p-6"
      initial={{ y: "100vh" }}
      animate={{ y: 0 }}
      exit={{ y: "100vh" }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto grid h-32 w-64 grid-cols-[1fr_1px_1fr] border border-black">
          <div className="relative bg-gray-100">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" fill sizes="128px" className="object-cover grayscale" />
            ) : null}
          </div>
          <div className="bg-black" />
          <div className="relative bg-gray-100">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" fill sizes="128px" className="object-cover grayscale" />
            ) : null}
          </div>
        </div>
        <h2 className="mt-10 text-[64px] font-black leading-none tracking-[-0.04em]">
          MATCH.
        </h2>
        <p className="mt-4 font-mono text-sm">@{profile.username}</p>
        <div className="mt-12 grid gap-3">
          <Button>Send Message</Button>
          <Button variant="outline" onClick={onClose}>
            Keep Swiping
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
