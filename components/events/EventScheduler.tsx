"use client";

import { useState } from "react";
import { Calendar, Plus, Video, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useEvents } from "@/lib/hooks/useEvents";
import type { Event } from "@/lib/types";

type EventSchedulerProps = {
  communityId?: string | null;
  onEventCreated?: (event: Event) => void;
};

export function EventScheduler({ communityId = null, onEventCreated }: EventSchedulerProps) {
  const { createEvent } = useEvents();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [locationType, setLocationType] = useState<"online" | "in_person">("online");
  const [locationDetails, setLocationDetails] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !eventDate || !locationDetails.trim()) {
      setError("Title, Date/Time, and Location Details are required.");
      return;
    }

    setSubmitting(true);
    const created = await createEvent(
      title.trim(),
      description.trim(),
      new Date(eventDate).toISOString(),
      locationType,
      locationDetails.trim(),
      communityId
    );

    if (created) {
      setTitle("");
      setDescription("");
      setEventDate("");
      setLocationDetails("");
      setIsOpen(false);
      if (onEventCreated) {
        onEventCreated(created);
      }
    } else {
      setError("Failed to schedule meetup. Are you logged in?");
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
          <span>Planning a meetup, API demo, or coffee chat? Schedule here...</span>
          <Plus className="h-4 w-4" />
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between border-b border-black pb-2">
            <span className="font-mono text-xs font-bold uppercase">Schedule Meetup</span>
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
              label="meetup title"
              placeholder="e.g. Axum Production API Coffee Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="date & time"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
              <div className="block">
                <span className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.1em]">
                  meetup type
                </span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setLocationType("online")}
                    className={`flex items-center justify-center gap-1.5 border border-black py-2 font-mono text-xs ${
                      locationType === "online" ? "bg-black text-white" : "bg-white text-black"
                    }`}
                  >
                    <Video className="h-3.5 w-3.5" />
                    Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType("in_person")}
                    className={`flex items-center justify-center gap-1.5 border border-black py-2 font-mono text-xs ${
                      locationType === "in_person" ? "bg-black text-white" : "bg-white text-black"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Physical
                  </button>
                </div>
              </div>
            </div>

            <Input
              label={locationType === "online" ? "online url / link" : "physical venue address"}
              placeholder={locationType === "online" ? "https://zoom.us/..." : "Coffee Shop Street, Lagos"}
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              required
            />

            <label className="block">
              <Textarea
                label="meetup agenda / notes"
                placeholder="Give details about speaker rosters, agenda items, or setup checklist..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
              {submitting ? "Scheduling..." : "Schedule Meetup"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
