"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, MapPin, Video, CheckCircle } from "lucide-react";
import { useEvents } from "@/lib/hooks/useEvents";
import type { Event } from "@/lib/types";

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {
  const { fetchRsvpStatus, updateRsvp, getRsvpCounts } = useEvents();
  const [rsvp, setRsvp] = useState<"going" | "maybe" | "not_going" | null>(null);
  const [counts, setCounts] = useState({ going: 0, maybe: 0 });
  const [updating, setUpdating] = useState(false);

  const loadRsvpData = useCallback(async () => {
    const [status, count] = await Promise.all([
      fetchRsvpStatus(event.id),
      getRsvpCounts(event.id)
    ]);
    setRsvp(status);
    setCounts(count);
  }, [event.id, fetchRsvpStatus, getRsvpCounts]);

  useEffect(() => {
    void loadRsvpData();
  }, [loadRsvpData]);

  async function handleRsvpChange(newStatus: "going" | "maybe" | "not_going") {
    if (updating) return;
    setUpdating(true);
    const success = await updateRsvp(event.id, newStatus);
    if (success) {
      setRsvp(newStatus);
      // Reload attendee statistics
      const updatedCounts = await getRsvpCounts(event.id);
      setCounts(updatedCounts);
    }
    setUpdating(false);
  }

  function formatEventDate(isoString: string) {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  }

  const isOnline = event.location_type === "online";

  return (
    <article className="border border-black bg-white p-5 shadow-sm transition-all duration-150 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className={`inline-flex items-center gap-1 border border-black px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
            isOnline ? "bg-black text-white" : "bg-gray-100 text-black"
          }`}>
            {isOnline ? (
              <>
                <Video className="h-3 w-3" />
                Virtual Meetup
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3" />
                In Person
              </>
            )}
          </span>
          <h3 className="mt-2 text-lg font-black tracking-tight">{event.title}</h3>
        </div>

        <div className="flex items-center gap-1 text-xs font-mono text-gray-500 shrink-0">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatEventDate(event.event_date)}</span>
        </div>
      </header>

      <main className="mt-4">
        <p className="font-mono text-xs text-gray-800 leading-5 whitespace-pre-wrap">
          {event.description}
        </p>

        {/* Location display detail */}
        <div className="mt-4 flex items-start gap-2 border border-black bg-gray-50 p-3 font-mono text-xs text-gray-700">
          {isOnline ? (
            <Video className="h-4 w-4 shrink-0 mt-0.5 text-gray-500" />
          ) : (
            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-500" />
          )}
          <div className="min-w-0">
            <span className="font-bold text-[9px] uppercase tracking-wider block text-gray-400">
              {isOnline ? "Meeting Link" : "Address / Venue"}
            </span>
            {isOnline && event.location_details?.startsWith("http") ? (
              <a
                href={event.location_details}
                target="_blank"
                rel="noreferrer"
                className="underline truncate block hover:text-black"
              >
                {event.location_details}
              </a>
            ) : (
              <span className="break-all">{event.location_details || "TBD"}</span>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Attendees Count */}
        <div className="flex gap-4 font-mono text-[10px] text-gray-600">
          <span>
            Going: <strong className="text-black">{counts.going}</strong>
          </span>
          <span>
            Maybe: <strong className="text-black">{counts.maybe}</strong>
          </span>
        </div>

        {/* RSVP Toggles */}
        <div className="flex gap-2">
          {([
            { id: "going", label: "Going" },
            { id: "maybe", label: "Maybe" },
            { id: "not_going", label: "Skip" }
          ] as const).map((option) => {
            const isSelected = rsvp === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={updating}
                onClick={() => void handleRsvpChange(option.id)}
                className={`border border-black px-3 py-1.5 font-mono text-[10px] uppercase font-bold transition-all ${
                  isSelected
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-100 disabled:opacity-30"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </footer>
    </article>
  );
}
