import Image from "next/image";

export type ThreeDIconName =
  | "rocket" | "boy" | "star" | "fire" | "headphone" | "puzzle" | "trophy"
  | "bag" | "crown" | "notebook" | "target" | "color-palette" | "reindeer" | "gingerbread";

export default function ThreeDIcon({
  name, size = 48, className = "", preload = false, loading,
}: {
  name: ThreeDIconName;
  size?: number;
  className?: string;
  preload?: boolean;
  loading?: "eager" | "lazy";
}) {
  return (
    <Image
      src={`/icons/3dicons/${name}.webp`}
      alt=""
      width={size}
      height={size}
      preload={preload}
      loading={loading}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
