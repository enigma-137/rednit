"use client";

import { motion } from "framer-motion";
import type { Message } from "@/lib/types";

type MessageBubbleProps = {
  message: Message;
  mine: boolean;
};

export function MessageBubble({ message, mine }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ y: 4, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${mine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 font-mono text-sm leading-6 ${
          mine ? "bg-black text-white" : "border border-black bg-white text-black"
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}
