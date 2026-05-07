import type { Match, Message, Profile } from "@/lib/types";

export const mockProfiles: Profile[] = [
  {
    id: "7f0e4e16-6f34-46c5-ae2e-000000000001",
    username: "ada-l",
    full_name: "Ada Lovelace",
    avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
    bio: "Compiler romantic. I write notes in the margin and tests before coffee.",
    portfolio_url: "https://example.com/ada",
    github_url: "https://github.com/ada-l",
    city: "London"
  },
  {
    id: "7f0e4e16-6f34-46c5-ae2e-000000000002",
    username: "grace-h",
    full_name: "Grace Hopper",
    avatar_url: "https://avatars.githubusercontent.com/u/2?v=4",
    bio: "Distributed systems, precise words, and tiny CLIs that do one thing beautifully.",
    portfolio_url: "https://example.com/grace",
    github_url: "https://github.com/grace-h",
    city: "New York"
  },
  {
    id: "7f0e4e16-6f34-46c5-ae2e-000000000003",
    username: "linus-t",
    full_name: "Linus Torvalds",
    avatar_url: "https://avatars.githubusercontent.com/u/3?v=4",
    bio: "Kernel mode, direct communication, and bike rides between review queues.",
    portfolio_url: "https://example.com/linus",
    github_url: "https://github.com/linus-t",
    city: "Helsinki"
  }
];

export const mockMessages: Message[] = [
  {
    id: "msg-1",
    match_id: "demo",
    sender_id: "other",
    content: "your repo names are suspiciously charming.",
    created_at: new Date().toISOString()
  },
  {
    id: "msg-2",
    match_id: "demo",
    sender_id: "me",
    content: "wait until you see the commit messages.",
    created_at: new Date().toISOString()
  }
];

export const mockMatches: Match[] = [
  {
    id: "demo",
    user_a_id: "me",
    user_b_id: mockProfiles[0].id,
    created_at: new Date().toISOString(),
    other_profile: mockProfiles[0],
    last_message: mockMessages[0]
  },
  {
    id: "demo-2",
    user_a_id: "me",
    user_b_id: mockProfiles[1].id,
    created_at: new Date().toISOString(),
    other_profile: mockProfiles[1],
    last_message: null
  }
];
