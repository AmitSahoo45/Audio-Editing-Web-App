import type { Metadata } from "next";
import { Poppins, Merriweather } from "next/font/google";
import "./globals.css";

const poppinsFont = Poppins({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const merriweatherFont = Merriweather({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-merriweather",
});

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
      <body
        className={`${poppinsFont.variable} ${merriweatherFont.variable} antialiased`}
      >
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
          {children}
        </main>
      </body>
    </html>
  );
}
