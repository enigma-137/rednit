"use client";

import { useCallback, useState, useEffect } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { mockEvents } from "@/lib/mock-data";
import type { Event, EventRSVP } from "@/lib/types";

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async (communityId: string | null = null) => {
    setLoading(true);
    if (!hasSupabaseConfig()) {
      const localEvents: Event[] = JSON.parse(localStorage.getItem("local_events") ?? "[]");
      const combined = [...localEvents, ...mockEvents];
      const filtered = communityId
        ? combined.filter((e) => e.community_id === communityId)
        : combined;
      // Sort by event_date ascending (closest first)
      filtered.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      setEvents(filtered);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let query = supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (communityId) {
      query = query.eq("community_id", communityId);
    }

    const { data, error } = await query;
    if (!error && data) {
      setEvents(data as unknown as Event[]);
    }
    setLoading(false);
  }, []);

  const createEvent = useCallback(async (
    title: string,
    description: string,
    eventDate: string,
    locationType: "online" | "in_person",
    locationDetails: string,
    communityId: string | null = null
  ): Promise<Event | null> => {
    if (!hasSupabaseConfig()) {
      const newEvent: Event = {
        id: `event-local-${Date.now()}`,
        creator_id: "me",
        community_id: communityId,
        title,
        description,
        event_date: eventDate,
        location_type: locationType,
        location_details: locationDetails,
        created_at: new Date().toISOString()
      };

      const localEvents = JSON.parse(localStorage.getItem("local_events") ?? "[]");
      localEvents.push(newEvent);
      localStorage.setItem("local_events", JSON.stringify(localEvents));
      setEvents((curr) => {
        const updated = [...curr, newEvent];
        updated.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
        return updated;
      });
      return newEvent;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("events")
      .insert({
        title,
        description,
        event_date: eventDate,
        location_type: locationType,
        location_details: locationDetails,
        community_id: communityId,
        creator_id: user.id
      })
      .select()
      .single();

    if (error || !data) return null;

    const typedEvent = data as unknown as Event;

    // Automatically join the scheduled event as RSVP "going"
    await supabase.from("event_rsvps").insert({
      event_id: typedEvent.id,
      profile_id: user.id,
      status: "going"
    });

    setEvents((curr) => {
      const updated = [...curr, typedEvent];
      updated.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      return updated;
    });

    return typedEvent;
  }, []);

  const fetchRsvpStatus = useCallback(async (eventId: string): Promise<"going" | "maybe" | "not_going" | null> => {
    if (!hasSupabaseConfig()) {
      const rsvps: Record<string, "going" | "maybe" | "not_going"> = JSON.parse(
        localStorage.getItem("local_event_rsvps") ?? "{}"
      );
      return rsvps[eventId] ?? null;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("event_rsvps")
      .select("status")
      .eq("event_id", eventId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data.status as "going" | "maybe" | "not_going";
  }, []);

  const updateRsvp = useCallback(async (eventId: string, status: "going" | "maybe" | "not_going"): Promise<boolean> => {
    if (!hasSupabaseConfig()) {
      const rsvps = JSON.parse(localStorage.getItem("local_event_rsvps") ?? "{}");
      rsvps[eventId] = status;
      localStorage.setItem("local_event_rsvps", JSON.stringify(rsvps));
      return true;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("event_rsvps")
      .upsert({
        event_id: eventId,
        profile_id: user.id,
        status: status
      });

    return !error;
  }, []);

  const getRsvpCounts = useCallback(async (eventId: string): Promise<{ going: number; maybe: number }> => {
    if (!hasSupabaseConfig()) {
      // Return stable mock counts + any local state adjustment
      const localRsvps = JSON.parse(localStorage.getItem("local_event_rsvps") ?? "{}");
      const userStatus = localRsvps[eventId];
      let baseGoing = eventId === "event-1" ? 14 : eventId === "event-2" ? 8 : 0;
      let baseMaybe = eventId === "event-1" ? 5 : eventId === "event-2" ? 2 : 0;

      if (userStatus === "going") baseGoing += 1;
      if (userStatus === "maybe") baseMaybe += 1;

      return { going: baseGoing, maybe: baseMaybe };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("event_rsvps")
      .select("status")
      .eq("event_id", eventId);

    if (error || !data) return { going: 0, maybe: 0 };

    const going = data.filter((r) => r.status === "going").length;
    const maybe = data.filter((r) => r.status === "maybe").length;

    return { going, maybe };
  }, []);

  return {
    events,
    loading,
    loadEvents,
    createEvent,
    fetchRsvpStatus,
    updateRsvp,
    getRsvpCounts
  };
}
