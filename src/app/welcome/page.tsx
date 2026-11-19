import type { Metadata } from "next";
import LandingView from "@/components/landing/LandingView";

export const metadata: Metadata = {
  title: "Alingua — английский как приключение",
  description: "Короткие игры и задания по английскому для детей. Начните без аккаунта и познакомьтесь с красной пандой!",
};

export default function WelcomePage() {
  return <LandingView />;
}
