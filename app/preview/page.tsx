"use client";

import Link from "next/link";

export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="mx-auto max-w-6xl px-5 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-black pb-4">
          <Link href="/" className="text-xl font-black tracking-[-0.04em]">
            rednit
          </Link>
          <span className="font-mono text-xs text-gray-600">Preview — no auth</span>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded border border-black p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-2xl">👩‍💻</div>
              <div>
                <h2 className="text-2xl font-bold">Ava Johnson</h2>
                <p className="mt-1 font-mono text-sm text-gray-600">Senior Frontend • Remote</p>
              </div>
            </div>

            <p className="mt-5 font-mono text-sm leading-6">
              Typescript, design systems, motion, small teams, and clean commits. Looking for collaborators on a tiny UI library.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded border border-black px-2 py-1 text-xs">TypeScript</span>
              <span className="rounded border border-black px-2 py-1 text-xs">Design Systems</span>
              <span className="rounded border border-black px-2 py-1 text-xs">Open to Hire</span>
            </div>

            <div className="mt-6 flex gap-3">
              <button disabled className="inline-flex h-10 items-center justify-center border px-4 text-xs font-bold disabled:opacity-40" aria-disabled>
                Message
              </button>
              <button disabled className="inline-flex h-10 items-center justify-center border bg-black px-4 text-xs font-bold text-white disabled:opacity-40" aria-disabled>
                Like
              </button>
            </div>
          </section>

          <section className="rounded border border-black p-6">
            <h3 className="text-lg font-bold">Sample Chat</h3>
            <div className="mt-4 flex flex-col gap-3">
              <div className="self-start rounded border border-gray-200 bg-gray-100 p-3 max-w-[70%]">
                <p className="font-mono text-sm">Hey — saw your profile. Want to collaborate on a design tokens project?</p>
                <p className="mt-1 text-xs text-gray-600">Ava • 2:14 PM</p>
              </div>
              <div className="self-end rounded border border-black bg-white p-3 max-w-[70%]">
                <p className="font-mono text-sm">Love that — I have a tiny repo we could iterate on.</p>
                <p className="mt-1 text-xs text-gray-600">You • 2:16 PM</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <input disabled placeholder="Message (disabled in preview)" className="flex-1 rounded border border-gray-200 px-3 py-2 font-mono text-sm disabled:opacity-40" />
              <button disabled className="inline-flex h-10 items-center justify-center border bg-black px-4 text-xs font-bold text-white disabled:opacity-40">Send</button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
