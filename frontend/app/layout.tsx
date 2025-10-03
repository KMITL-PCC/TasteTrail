import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Outfit, Kanit } from "next/font/google";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";
import FeedbackButton from "@/components/FeedbackButton";

export const metadata: Metadata = {
  title: "TasteTrail",
  description:
    "TasteTrail is a platform for food lovers to discover new restaurants and dishes.",
  keywords: ["food", "restaurant", "dish", "taste", "trail"],
};

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const kanit = Kanit({
  subsets: ["thai"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-kanit",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`flex min-h-svh w-full flex-col ${outfit.variable} ${kanit.variable}`}
      >
        <Header />
        <main className="flex flex-col flex-1">{children}</main>
        <Footer />
        <FeedbackButton />

        <Toaster />
      </body>
    </html>
  );
}
