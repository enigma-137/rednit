"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useCommunities } from "@/lib/hooks/useCommunities";
import type { Community } from "@/lib/types";

export default function CommunitiesDirectoryPage() {
  const { communities, loading, loadCommunities, createCommunity, getMemberCount } = useCommunities();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  // Load member counts reactively
  useEffect(() => {
    async function loadCounts() {
      const counts: Record<string, number> = {};
      for (const c of communities) {
        counts[c.id] = await getMemberCount(c.id);
      }
      setMemberCounts(counts);
    }
    if (communities.length > 0) {
      void loadCounts();
    }
  }, [communities, getMemberCount]);

  // Handle slug auto-generation on name change
  function handleNameChange(val: string) {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !slug.trim()) {
      setFormError("Name and slug are required.");
      return;
    }

    if (slug.length < 3) {
      setFormError("Slug must be at least 3 characters.");
      return;
    }

    // Check if slug is unique in existing state
    if (communities.some((c) => c.slug === slug)) {
      setFormError("A community with this slug already exists.");
      return;
    }

    const created = await createCommunity(name, slug, description);
    if (created) {
      setShowCreateModal(false);
      setName("");
      setSlug("");
      setDescription("");
      void loadCommunities();
    } else {
      setFormError("Failed to create community. Make sure slug is unique.");
    }
  }

  return (
    <section className="mx-auto min-h-screen max-w-4xl px-5 py-8 pb-20">
      <header className="flex flex-col gap-4 border-b border-black pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.02em]">communities</h1>
          <p className="mt-1 font-mono text-xs text-gray-500">Explore and build custom developers families.</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider shrink-0 h-10 px-4 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Community
        </Button>
      </header>

      {loading ? (
        <div className="py-24 text-center font-mono text-sm">loading communities.</div>
      ) : communities.length === 0 ? (
        <div className="py-24 border border-dashed border-gray-300 text-center font-mono text-sm mt-8">
          No communities created yet. Be the first to build one!
        </div>
      ) : (
        <div className="grid gap-6 mt-8 md:grid-cols-2">
          {communities.map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.slug}`}
              className="group flex flex-col justify-between border border-black bg-white p-5 transition-all duration-150 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold tracking-tight group-hover:underline">
                    {community.name}
                  </h2>
                  <div className="flex items-center gap-1.5 font-mono text-xs text-gray-500 shrink-0 mt-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{memberCounts[community.id] ?? 0}</span>
                  </div>
                </div>
                <p className="mt-3 font-mono text-xs text-gray-600 line-clamp-3 leading-5">
                  {community.description || "No description provided for this family yet."}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="font-mono text-[10px] text-gray-400">/{community.slug}</span>
                <span className="inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wider">
                  View Community
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md border border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h3 className="text-lg font-black uppercase tracking-tight">Create Community</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 border border-black bg-red-50 p-3 font-mono text-xs text-red-600">
                {formError}
              </div>
            )}

            <div className="grid gap-4 py-4 mt-2">
              <Input
                label="community name"
                placeholder="e.g. Rust Family"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
              <Input
                label="unique slug"
                placeholder="e.g. rust-family"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                required
              />
              <label className="block">
                <Textarea
                  label="description"
                  placeholder="Describe your community target, guidelines, stack, or events..."
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <span className="mt-1 block text-right font-mono text-[10px] text-gray-500">
                  {description.length}/500
                </span>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="font-mono text-xs uppercase"
              >
                Cancel
              </Button>
              <Button type="submit" className="font-mono text-xs uppercase">
                Create
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
