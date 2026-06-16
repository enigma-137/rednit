"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Users, Sparkles, ChevronRight, Video, MapPin } from "lucide-react";
import { useEvents } from "@/lib/hooks/useEvents";
import { useCommunities } from "@/lib/hooks/useCommunities";
import { EventScheduler } from "@/components/events/EventScheduler";
import { EventCard } from "@/components/events/EventCard";
import type { Event } from "@/lib/types";

export default function EventsPage() {
  const { events, loading, loadEvents } = useEvents();
  const { communities, loadCommunities, loading: loadingCommunities } = useCommunities();
  const [localEvents, setLocalEvents] = useState<Event[]>([]);

  useEffect(() => {
    void loadEvents();
    void loadCommunities();
  }, [loadEvents, loadCommunities]);

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  function handleEventCreated(newEvent: Event) {
    setLocalEvents((curr) => {
      const updated = [newEvent, ...curr];
      // Keep sorted by event_date ascending
      updated.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      return updated;
    });
  }

  return (
    <section className="mx-auto min-h-screen max-w-5xl px-5 py-8 pb-24">
      <header className="border-b border-black pb-6">
        <h1 className="text-3xl font-black tracking-[-0.02em]">upcoming meetups</h1>
        <p className="mt-1 font-mono text-xs text-gray-500">
          Find and schedule physical developer chats, virtual code reviews, or hackathons.
        </p>
      </header>

      {/* Main Grid: Events stream & Sidebar */}
      <div className="grid gap-8 mt-8 lg:grid-cols-[1fr_300px]">
        {/* Left Column: EventComposer & Event List */}
        <section className="space-y-6">
          <EventScheduler onEventCreated={handleEventCreated} />

          {loading ? (
            <div className="py-20 text-center font-mono text-xs text-gray-400">
              loading meetups schedule...
            </div>
          ) : localEvents.length === 0 ? (
            <div className="py-20 border border-dashed border-gray-300 text-center font-mono text-xs text-gray-500">
              No upcoming meetups scheduled. Set one up above to rally developers!
            </div>
          ) : (
            <div className="space-y-6">
              {localEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Sidebar */}
        <aside className="space-y-6">
          <div className="border border-black p-5 bg-white">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-tight border-b border-black pb-2">
              <Users className="h-4 w-4" />
              Communities
            </h3>
            <p className="font-mono text-[9px] text-gray-500 mt-2">
              Schedule community-specific meetups by navigating to the community page.
            </p>

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
          </div>

          {/* Quick tips widget */}
          <div className="border border-black p-5 bg-gray-50 font-mono text-[10px] text-gray-600 leading-5">
            <h4 className="font-bold text-black uppercase flex items-center gap-1.5 border-b border-gray-200 pb-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Meetup Types
            </h4>
            <div className="space-y-2 mt-2">
              <p className="flex gap-2">
                <Video className="h-4 w-4 shrink-0 text-black" />
                <span><strong>Virtual:</strong> Online video links (Zoom, Google Meet) for async, remote-friendly reviews.</span>
              </p>
              <p className="flex gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-black" />
                <span><strong>Physical:</strong> Coffee chats, co-working sessions, and workspace hackathons.</span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
