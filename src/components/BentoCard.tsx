import type { HTMLAttributes } from "react";

export default function BentoCard({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[28px] shadow-[0_8px_30px_rgba(47,39,89,0.06)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
