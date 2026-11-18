import Image from "next/image";

export type ThreeDIconName =
  | "rocket" | "boy" | "star" | "fire" | "headphone" | "puzzle" | "trophy"
  | "bag" | "crown" | "notebook" | "target" | "color-palette" | "reindeer" | "gingerbread";

export default function ThreeDIcon({
  name, size = 48, className = "", preload = false,
}: {
  name: ThreeDIconName;
  size?: number;
  className?: string;
  preload?: boolean;
}) {
  return (
    <Image
      src={`/icons/3dicons/${name}.webp`}
      alt=""
      width={size}
      height={size}
      preload={preload}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
