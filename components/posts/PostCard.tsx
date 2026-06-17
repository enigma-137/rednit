"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, CornerDownRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useFeed } from "@/lib/hooks/useFeed";
import { ConnectButton } from "@/components/ui/ConnectButton";
import type { Post, Comment } from "@/lib/types";

type PostCardProps = {
  post: Post;
  currentUserId?: string | null;
};

export function PostCard({ post }: PostCardProps) {
  const { fetchComments, createComment } = useFeed();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadCommentsList = useCallback(async () => {
    setLoadingComments(true);
    const list = await fetchComments(post.id);
    setComments(list);
    setLoadingComments(false);
  }, [post.id, fetchComments]);

  useEffect(() => {
    if (showComments) {
      void loadCommentsList();
    }
  }, [showComments, loadCommentsList]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentContent.trim() || submittingComment) return;

    setSubmittingComment(true);
    const added = await createComment(post.id, commentContent.trim());
    if (added) {
      setComments((curr) => [...curr, added]);
      setCommentContent("");
    }
    setSubmittingComment(false);
  }

  function formatTime(isoString: string) {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "just now";
    }
  }

  return (
    <article className="border border-black bg-white p-5 shadow-sm transition-all duration-150 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      {/* Header: User Profile */}
      <header className="flex items-start gap-3">
        <div className="relative h-9 w-9 border border-black bg-gray-100 overflow-hidden shrink-0">
          {post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt=""
              className="h-full w-full object-cover grayscale"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-xs font-bold bg-gray-200">
              {(post.author?.username ?? "U").substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs font-bold leading-none">
              {post.author?.full_name || post.author?.username || "Developer"}
            </span>
            <span className="font-mono text-[10px] text-gray-500">
              @{post.author?.username || "unknown"}
            </span>
            <ConnectButton targetUserId={post.author_id} />
          </div>
          {post.author?.role_title && (
            <p className="mt-0.5 font-mono text-[10px] text-gray-700 truncate">
              {post.author.role_title}
              {post.author.company && ` @ ${post.author.company}`}
            </p>
          )}
        </div>
        <time className="font-mono text-[10px] text-gray-400 shrink-0">
          {formatTime(post.created_at)}
        </time>
      </header>

      {/* Post body */}
      <main className="mt-4">
        <h3 className="text-base font-bold tracking-tight">{post.title}</h3>
        <p className="mt-2 font-mono text-xs text-gray-800 leading-5 whitespace-pre-wrap">
          {post.content}
        </p>
      </main>

      {/* Footer / Toggle comments */}
      <footer className="mt-5 border-t border-gray-100 pt-3">
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider transition-colors ${
            showComments ? "text-black font-bold" : "text-gray-500 hover:text-black"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Discussion / Comments</span>
        </button>

        {showComments && (
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
            {/* List of comments */}
            {loadingComments ? (
              <div className="font-mono text-[10px] text-gray-400">Loading discussion...</div>
            ) : comments.length === 0 ? (
              <div className="font-mono text-[10px] text-gray-500 italic">No replies yet. Start the conversation!</div>
            ) : (
              <div className="space-y-3 pl-4 border-l border-gray-200">
                {comments.map((comment) => (
                  <div key={comment.id} className="text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-gray-500">
                      <CornerDownRight className="h-3 w-3 shrink-0" />
                      <span className="font-bold text-gray-700">
                        {comment.author?.full_name || comment.author?.username}
                      </span>
                      <span>@{comment.author?.username}</span>
                      <span>•</span>
                      <span>{formatTime(comment.created_at)}</span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-gray-800 pl-4 leading-5">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Composer form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 items-center">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Type a helpful comment..."
                required
                className="flex-1 border border-black bg-white px-3 py-2 font-mono text-xs outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentContent.trim()}
                className="flex h-8 w-8 items-center justify-center border border-black bg-black text-white transition-colors hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </footer>
    </article>
  );
}
