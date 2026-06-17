"use client";

import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useConnectionState } from "@/lib/hooks/useConnectionState";

type ConnectButtonProps = {
  targetUserId: string;
};

export function ConnectButton({ targetUserId }: ConnectButtonProps) {
  const { status, loading, connect } = useConnectionState(targetUserId);

  if (loading) {
    return (
      <span className="inline-flex h-5 w-14 items-center justify-center border border-gray-200 bg-white px-2 py-0.5 shrink-0">
        <Loader2 className="h-2.5 w-2.5 animate-spin text-gray-400" />
      </span>
    );
  }

  if (status === "self") {
    return null;
  }

  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1 border border-black bg-black px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white shrink-0">
        <UserCheck className="h-2.5 w-2.5" />
        Connected
      </span>
    );
  }

  if (status === "requested") {
    return (
      <span className="inline-flex items-center gap-1 border border-gray-400 bg-gray-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gray-500 cursor-not-allowed shrink-0">
        Sent
      </span>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void connect();
      }}
      className="inline-flex items-center gap-1 border border-black bg-white px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-black hover:text-white shrink-0"
    >
      <UserPlus className="h-2.5 w-2.5" />
      Connect
    </button>
  );
}
