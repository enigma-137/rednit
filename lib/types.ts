export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  city: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
