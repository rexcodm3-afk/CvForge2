import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CVForge — Create a professional CV in minutes",
  description:
    "Build a polished, job-ready CV without fighting with Word or complicated templates. Choose a design, add your experience, preview it instantly, and get ready to apply.",
  metadataBase: new URL("https://cvforge.app"),
  openGraph: {
    title: "CVForge — Create a professional CV in minutes",
    description:
      "Build a polished, job-ready CV. Choose a design, add your experience, preview instantly.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBFAF7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
