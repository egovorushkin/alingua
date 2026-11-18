import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import SoundControls from "@/components/SoundControls";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Alingua | A little learning adventure",
  description: "A joyful place to discover new words, one adventure at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full"><SoundControls />{children}</body>
    </html>
  );
}
