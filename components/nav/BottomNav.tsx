"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, Heart, MessagesSquare, User } from "lucide-react";

const items = [
  { href: "/discover", label: "Discover", icon: Code2 },
  { href: "/matches", label: "Likes", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessagesSquare },
  { href: "/profile", label: "Profile", icon: User }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black bg-white">
      <div className="mx-auto grid h-16 max-w-xl grid-cols-4">
        {items.map((item) => {
          const section = item.href.split("/")[1];
          const active =
            (item.label === "Messages"
              ? pathname === "/messages" || pathname.startsWith("/chat")
              : pathname.startsWith(section ? `/${section}` : item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-center border-r border-gray-200 last:border-r-0 ${
                active ? "bg-black text-white" : "bg-white text-black"
              }`}
              aria-label={item.label}
            >
              <Icon aria-hidden className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
