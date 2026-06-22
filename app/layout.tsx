import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
// @ts-ignore: side-effect import for global styles
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "700"],
  display: "swap"
});

export const metadata : Metadata = {
  title: "Rednit",
  description: "A minimalist developer meeting app",
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  icons: {
    icon: "/android/launchericon-192x192.png",
    apple: "/android/launchericon-192x192.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
