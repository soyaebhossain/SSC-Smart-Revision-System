import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSC Smart Revision System",
  description: "Student performance tracking, learning-gap detection, and personalized revision planning.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
