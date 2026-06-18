"use client";

import { useCallback, useState, useEffect } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { mockPosts, mockComments, mockProfiles } from "@/lib/mock-data";
import type { Post, Comment, Profile } from "@/lib/types";

export function containsLink(text: string | null | undefined): boolean {
  if (!text) return false;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|io|dev|co|xyz|gov|edu|info)\b)/i;
  return urlRegex.test(text);
}

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async (communityId: string | null = null) => {
    setLoading(true);
    if (!hasSupabaseConfig()) {
      // In local mode, fetch mock posts + any user-created posts in localStorage
      const localPosts: Post[] = JSON.parse(localStorage.getItem("local_posts") ?? "[]");
      const combined = [...localPosts, ...mockPosts];
      const filtered = communityId
        ? combined.filter((p) => p.community_id === communityId)
        : combined;
      // Sort by created_at descending
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPosts(filtered);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let query = supabase
      .from("posts")
      .select(`
        *,
        author:profiles(*)
      `)
      .order("created_at", { ascending: false });

    if (communityId) {
      query = query.eq("community_id", communityId);
    }

    const { data, error } = await query;
    if (!error && data) {
      setPosts(data as unknown as Post[]);
    }
    setLoading(false);
  }, []);

  const createPost = useCallback(async (title: string | null, content: string, communityId: string | null = null): Promise<Post | null> => {
    if (containsLink(title) || containsLink(content)) {
      console.warn("Posting links is blocked for security.");
      return null;
    }

    if (!hasSupabaseConfig()) {
      const newPost: Post = {
        id: `post-local-${Date.now()}`,
        author_id: "me",
        community_id: communityId,
        title: title || null,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: {
          id: "me",
          username: "your-github",
          full_name: "You (Local User)",
          avatar_url: "",
          bio: "",
          portfolio_url: "",
          github_url: "",
          city: "",
          skills: [],
          looking_for: [],
          role_title: "",
          company: "",
          twitter_url: ""
        }
      };

      const localPosts = JSON.parse(localStorage.getItem("local_posts") ?? "[]");
      localPosts.unshift(newPost);
      localStorage.setItem("local_posts", JSON.stringify(localPosts));
      setPosts((curr) => [newPost, ...curr]);
      return newPost;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: title || null,
        content,
        community_id: communityId,
        author_id: user.id
      })
      .select()
      .single();

    if (error || !data) return null;

    // Resolve author profile info
    const { data: authorProf } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const fullyTypedPost: Post = {
      ...(data as unknown as Post),
      author: authorProf ?? undefined
    };

    setPosts((curr) => [fullyTypedPost, ...curr]);
    return fullyTypedPost;
  }, []);

  const fetchComments = useCallback(async (postId: string): Promise<Comment[]> => {
    if (!hasSupabaseConfig()) {
      const localComments: Comment[] = JSON.parse(localStorage.getItem("local_comments") ?? "[]");
      const combined = [...localComments, ...mockComments];
      const filtered = combined.filter((c) => c.post_id === postId);
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return filtered;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        author:profiles(*)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as unknown as Comment[];
  }, []);

  const createComment = useCallback(async (postId: string, content: string): Promise<Comment | null> => {
    if (containsLink(content)) {
      console.warn("Posting links is blocked for security.");
      return null;
    }

    if (!hasSupabaseConfig()) {
      const newComment: Comment = {
        id: `comment-local-${Date.now()}`,
        post_id: postId,
        author_id: "me",
        content,
        created_at: new Date().toISOString(),
        author: {
          id: "me",
          username: "your-github",
          full_name: "You (Local User)",
          avatar_url: "",
          bio: "",
          portfolio_url: "",
          github_url: "",
          city: "",
          skills: [],
          looking_for: [],
          role_title: "",
          company: "",
          twitter_url: ""
        }
      };

      const localComments = JSON.parse(localStorage.getItem("local_comments") ?? "[]");
      localComments.push(newComment);
      localStorage.setItem("local_comments", JSON.stringify(localComments));
      return newComment;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        content,
        author_id: user.id
      })
      .select()
      .single();

    if (error || !data) return null;

    // Resolve author profile
    const { data: authorProf } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      ...(data as unknown as Comment),
      author: authorProf ?? undefined
    };
  }, []);

  return {
    posts,
    loading,
    loadPosts,
    createPost,
    fetchComments,
    createComment
  };
}
