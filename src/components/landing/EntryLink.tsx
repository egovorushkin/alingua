"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useProgress } from "@/context/ProgressContext";

export default function EntryLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const { markEntered } = useProgress();
  return <Link href={href} className={className} onNavigate={markEntered}>{children}</Link>;
}
