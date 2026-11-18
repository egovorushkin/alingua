import Link from "next/link";
import type { ReactNode } from "react";

export default function ActionButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border-b-4 border-[#ded7f5] bg-white px-6 py-3 text-sm font-extrabold text-[#4937a0] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:border-b-0"
    >
      {children}
    </Link>
  );
}
