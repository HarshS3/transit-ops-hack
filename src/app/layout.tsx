import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TransitOps – Smart Transport Operations",
  description: "Fleet, drivers, trips, maintenance, fuel & analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
