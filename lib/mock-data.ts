import type { Match, Message, Profile, Community } from "@/lib/types";

export const mockProfiles: Profile[] = [
  {
    id: "7f0e4e16-6f34-46c5-ae2e-000000000001",
    username: "ada-l",
    full_name: "Ada Lovelace",
    avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
    bio: "Compiler romantic. I write notes in the margin and tests before coffee.",
    portfolio_url: "https://example.com/ada",
    github_url: "https://github.com/ada-l",
    city: "London",
    skills: ["Rust", "C", "Compiler Design", "Assembly"],
    looking_for: ["co-founder", "friend"],
    role_title: "Lead Compiler Architect",
    company: "Analytical Engine Corp",
    twitter_url: "https://twitter.com/ada_lovelace"
  },
  {
    id: "7f0e4e16-6f34-46c5-ae2e-000000000002",
    username: "grace-h",
    full_name: "Grace Hopper",
    avatar_url: "https://avatars.githubusercontent.com/u/2?v=4",
    bio: "Distributed systems, precise words, and tiny CLIs that do one thing beautifully.",
    portfolio_url: "https://example.com/grace",
    github_url: "https://github.com/grace-h",
    city: "New York",
    skills: ["COBOL", "Systems Programming", "Fortran"],
    looking_for: ["employee", "friend"],
    role_title: "Rear Admiral & Engineer",
    company: "US Navy",
    twitter_url: "https://twitter.com/grace_hopper"
  },
  {
    id: "7f0e4e16-6f34-46c5-ae2e-000000000003",
    username: "linus-t",
    full_name: "Linus Torvalds",
    avatar_url: "https://avatars.githubusercontent.com/u/3?v=4",
    bio: "Kernel mode, direct communication, and bike rides between review queues.",
    portfolio_url: "https://example.com/linus",
    github_url: "https://github.com/linus-t",
    city: "Helsinki",
    skills: ["C", "Git", "Linux Kernel", "Assembly"],
    looking_for: ["co-founder", "employee", "friend"],
    role_title: "Linux Creator",
    company: "Linux Foundation",
    twitter_url: "https://twitter.com/linus_torvalds"
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

export const mockCommunities: Community[] = [
  {
    id: "comm-1",
    creator_id: mockProfiles[2].id,
    name: "Rust Family",
    slug: "rust-family",
    description: "A cozy community for Rustaceans. Memory safety, speed, and clean code macros.",
    avatar_url: "",
    banner_url: "",
    created_at: new Date().toISOString()
  },
  {
    id: "comm-2",
    creator_id: mockProfiles[0].id,
    name: "Next.js Pioneers",
    slug: "nextjs-pioneers",
    description: "Front-end engineering group building fast web apps with React Server Components.",
    avatar_url: "",
    banner_url: "",
    created_at: new Date().toISOString()
  }
];
