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
      <body className="antialiased bg-background text-foreground">
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
