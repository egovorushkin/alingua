import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import SoundControls from "@/components/SoundControls";
import { ProgressProvider } from "@/context/ProgressContext";
import { AuthProvider } from "@/context/AuthContext";
import { CurriculumNotice, CurriculumProvider } from "@/context/CurriculumContext";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Alingua | Английский с радостью",
  description: "Учим английские слова через игры, яркие карточки и маленькие приключения. Интерфейс и подсказки на русском языке.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full"><AuthProvider><CurriculumProvider><ProgressProvider><SoundControls /><CurriculumNotice />{children}</ProgressProvider></CurriculumProvider></AuthProvider></body>
    </html>
  );
}
