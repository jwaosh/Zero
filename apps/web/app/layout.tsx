import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zero — distraction tracker",
  description: "Track distracting impulses and how often you act on them.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
