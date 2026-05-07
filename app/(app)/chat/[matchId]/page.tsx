import { ChatWindow } from "@/components/chat/ChatWindow";

type ChatPageProps = {
  params: {
    matchId: string;
  };
};

export default function ChatPage({ params }: ChatPageProps) {
  return <ChatWindow matchId={params.matchId} />;
}
