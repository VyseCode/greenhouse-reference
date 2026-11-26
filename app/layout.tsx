import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rowan — Applicant Tracking",
  description:
    "A focused applicant tracking workspace: jobs, candidates, interviews, scorecards and offers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
