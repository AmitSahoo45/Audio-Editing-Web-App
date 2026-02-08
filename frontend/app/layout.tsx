import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audio Editor Pro",
  description: "Professional browser-based audio editing application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
          {children}
        </main>
      </body>
    </html>
  );
}
