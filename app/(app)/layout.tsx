import { BottomNav } from "@/components/nav/BottomNav";
import { ProfileNudgeBanner } from "@/components/profile/ProfileNudgeBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen pb-16">
      <ProfileNudgeBanner />
      {children}
      <BottomNav />
    </main>
  );
}
