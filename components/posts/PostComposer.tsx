"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useFeed, containsLink } from "@/lib/hooks/useFeed";
import type { Post } from "@/lib/types";

type PostComposerProps = {
  communityId?: string | null;
  onPostCreated?: (post: Post) => void;
};

export function PostComposer({ communityId = null, onPostCreated }: PostComposerProps) {
  const { createPost } = useFeed();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Post content is required.");
      return;
    }

    if (containsLink(title) || containsLink(content)) {
      setError("For security, external links are not allowed in posts.");
      return;
    }

    setSubmitting(true);
    const created = await createPost(title.trim() || null, content.trim(), communityId);
    if (created) {
      setTitle("");
      setContent("");
      setIsOpen(false);
      if (onPostCreated) {
        onPostCreated(created);
      }
    } else {
      setError("Failed to create post. Are you logged in?");
    }
    setSubmitting(false);
  }

  return (
    <div className="border border-black bg-white p-4">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center justify-between border border-dashed border-black bg-gray-50 px-4 py-3 font-mono text-xs text-gray-600 transition-colors hover:bg-gray-100"
        >
          <span>Have an update, project demo, or question? Post here...</span>
          <Plus className="h-4 w-4" />
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between border-b border-black pb-2">
            <span className="font-mono text-xs font-bold uppercase">Compose Post</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-mono text-[10px] uppercase hover:underline text-gray-500 hover:text-black"
            >
              collapse
            </button>
          </div>

          {error && (
            <div className="border border-black bg-red-50 p-2 font-mono text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Input
              label="post title (optional)"
              placeholder="e.g. Building an open source compiler in Go"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="block">
              <Textarea
                label="post content"
                placeholder="Share system architecture details, links, or questions..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="font-mono text-xs uppercase h-10 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="font-mono text-xs uppercase h-10 px-4"
            >
              {submitting ? "Posting..." : "Publish Post"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
