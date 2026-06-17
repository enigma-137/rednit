"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { useFeed } from "@/lib/hooks/useFeed";
import { useCommunities } from "@/lib/hooks/useCommunities";
import { PostComposer } from "@/components/posts/PostComposer";
import { PostCard } from "@/components/posts/PostCard";
import type { Post } from "@/lib/types";

export default function FeedPage() {
  const { posts, loading, loadPosts } = useFeed();
  const { communities, loadCommunities, loading: loadingCommunities } = useCommunities();
  const [localPosts, setLocalPosts] = useState<Post[]>([]);

  useEffect(() => {
    void loadPosts();
    void loadCommunities();
  }, [loadPosts, loadCommunities]);

  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  function handlePostCreated(newPost: Post) {
    setLocalPosts((curr) => [newPost, ...curr]);
  }

  return (
    <section className="mx-auto min-h-screen max-w-5xl px-5 py-8 pb-24">
      <header className="border-b border-black pb-6">
        <h1 className="text-3xl font-black tracking-[-0.02em]">discussion feed</h1>
        <p className="mt-1 font-mono text-xs text-gray-500">
          Global developer updates, collaboration offers, and project announcements.
        </p>
      </header>

      <div className="grid gap-8 mt-8 lg:grid-cols-[1fr_300px]">
        <section className="space-y-6">
          <PostComposer onPostCreated={handlePostCreated} />

          {loading ? (
            <div className="py-20 text-center font-mono text-xs text-gray-400">
              loading feed posts...
            </div>
          ) : localPosts.length === 0 ? (
            <div className="py-20 border border-dashed border-gray-300 text-center font-mono text-xs text-gray-500">
              No feed posts found. Share your first build update above!
            </div>
          ) : (
            <div className="space-y-6">
              {localPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="border border-black p-5 bg-white">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-tight border-b border-black pb-2">
              <Users className="h-4 w-4" />
              Communities
            </h3>

            {loadingCommunities ? (
              <p className="font-mono text-[10px] text-gray-400 mt-3">Loading directories...</p>
            ) : communities.length === 0 ? (
              <p className="font-mono text-[10px] text-gray-500 mt-3">No communities created.</p>
            ) : (
              <div className="mt-3 divide-y divide-gray-100">
                {communities.slice(0, 5).map((comm) => (
                  <Link
                    key={comm.id}
                    href={`/communities/${comm.slug}`}
                    className="flex items-center justify-between py-2.5 hover:underline group"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold leading-none">{comm.name}</p>
                      <p className="font-mono text-[9px] text-gray-400 mt-1">/{comm.slug}</p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/communities"
              className="mt-4 block border border-black bg-white py-2 text-center font-mono text-[10px] uppercase font-bold hover:bg-black hover:text-white transition-colors"
            >
              All Communities
            </Link>
            <Link
              href="/events"
              className="mt-2 block border border-black bg-black text-white py-2 text-center font-mono text-[10px] uppercase font-bold hover:bg-white hover:text-black transition-colors"
            >
              Upcoming Meetups
            </Link>
          </div>

          <div className="border border-black p-5 bg-gray-50 font-mono text-[10px] text-gray-600 leading-5">
            <h4 className="font-bold text-black uppercase flex items-center gap-1.5 border-b border-gray-200 pb-1.5 mb-2">
              {/* <Sparkles className="h-3.5 w-3.5" /> */}
              Guidelines
            </h4>
            <p>1. Be constructive when reviewing other developers project architectures.</p>
            <p className="mt-1">2. Post announcements about tools, hacks, co-founder match requests, or openings.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
