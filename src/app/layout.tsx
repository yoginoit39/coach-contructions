import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Mono({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600"] });


export const metadata: Metadata = {
  title: "Coach Construction and Design | Kampala, Uganda",
  description:
    "Kampala-based construction and architectural firm. Architectural design, building construction, renovation, project management and finishing across Uganda.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plex.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
