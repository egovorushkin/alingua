"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState, type CSSProperties } from "react";

export type Icon3DFile = `${string}.${"png" | "webp"}`;

export default function Icon3D({
  name, size = 48, fallback, className = "", preload = false, loading,
}: {
  name: string;
  size?: number;
  fallback?: string;
  className?: string;
  preload?: boolean;
  loading?: "eager" | "lazy";
}) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const src = /^[a-z0-9-]+(?:\.(?:png|webp))?$/.test(name)
    ? `/icons/3dicons/${name.includes(".") ? name : `${name}.webp`}`
    : undefined;
  const style = { "--icon-size": `${size}px`, fontSize: size * 0.7 } as CSSProperties;

  return (
    <span
      aria-hidden="true"
      className={`block size-(--icon-size) shrink-0 leading-none ${className}`}
      style={style}
    >
      {src && failedSrc !== src ? (
        <Image
          key={src}
          src={src}
          alt=""
          width={size}
          height={size}
          unoptimized
          preload={preload}
          loading={loading}
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="grid h-full w-full place-items-center">
          {fallback || <ImageIcon size="55%" className="text-[#9b91bd]" />}
        </span>
      )}
    </span>
  );
}
