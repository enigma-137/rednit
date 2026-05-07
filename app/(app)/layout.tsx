import { BottomNav } from "@/components/nav/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen pb-16">
      {children}
      <BottomNav />
    </main>
  );
}
