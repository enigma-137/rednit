export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  city: string | null;
  skills: string[] | null;
  looking_for: string[] | null;
  current_role: string | null;
  company: string | null;
  twitter_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Match = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  other_profile?: Profile;
  last_message?: Message | null;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type Community = {
  id: string;
  creator_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at?: string;
};

export type CommunityMember = {
  id: string;
  community_id: string;
  profile_id: string;
  role: "admin" | "moderator" | "member";
  created_at?: string;
};

export type Post = {
  id: string;
  author_id: string;
  community_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
};

export type Event = {
  id: string;
  creator_id: string;
  community_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  location_type: "online" | "in_person";
  location_details: string | null;
  created_at?: string;
};

export type EventRSVP = {
  id: string;
  event_id: string;
  profile_id: string;
  status: "going" | "maybe" | "not_going";
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id" | "username">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          created_at: string;
        };
        Insert: {
          from_user_id: string;
          to_user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      matches: {
        Row: Match;
        Insert: {
          user_a_id: string;
          user_b_id: string;
        };
        Update: never;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: {
          match_id: string;
          sender_id: string;
          content: string;
        };
        Update: never;
        Relationships: [];
      };
      communities: {
        Row: Community;
        Insert: Omit<Community, "id" | "created_at">;
        Update: Partial<Omit<Community, "id">>;
        Relationships: [];
      };
      community_members: {
        Row: CommunityMember;
        Insert: Omit<CommunityMember, "id" | "created_at">;
        Update: Partial<Omit<CommunityMember, "id">>;
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Post, "id" | "created_at">>;
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, "id" | "created_at">;
        Update: Partial<Omit<Comment, "id">>;
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: Omit<Event, "id" | "created_at">;
        Update: Partial<Omit<Event, "id">>;
        Relationships: [];
      };
      event_rsvps: {
        Row: EventRSVP;
        Insert: Omit<EventRSVP, "id" | "created_at">;
        Update: Partial<Omit<EventRSVP, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

