import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Text to Speech Studio",
  description:
    "Transform any text into natural speech directly in your browser with adjustable voices, rate, pitch, and volume.",
  openGraph: {
    title: "Text to Speech Studio",
    description:
      "Transform any text into natural speech directly in your browser with adjustable voices, rate, pitch, and volume.",
    url: "https://agentic-7399f586.vercel.app",
    siteName: "Text to Speech Studio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Text to Speech Studio",
    description:
      "Transform any text into natural speech directly in your browser with adjustable voices, rate, pitch, and volume.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
