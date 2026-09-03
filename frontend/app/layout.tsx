import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font — no render-blocking <link> to
// fonts.googleapis.com, no layout shift, and no extra DNS round trip.
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AURUM RECOVERY | AI Revenue Recovery Engine",
  description:
    "Autonomous Agent for Revenue Risk Detection, AI Diagnosis, Safety Policy Enforcement, and Money Recovery.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/next.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${hankenGrotesk.variable} ${jetBrainsMono.variable}`}>
      <head>
        {/* Material Symbols is an icon font, not a text font, so it stays a
            stylesheet link — next/font/google does not handle icon ligatures. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0b0f35] text-[#e0e0ff] min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
