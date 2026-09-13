import { ImageOff } from "lucide-react";

export interface ProductImageProps {
  src?: string | null;
  alt: string;
  aspectRatio?: "square" | "video" | "auto";
  fallbackIcon?: boolean;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}

const aspectStyles = {
  square: "aspect-square",
  video: "aspect-video",
  auto: "",
};

export default function ProductImage({
  src,
  alt,
  aspectRatio = "square",
  fallbackIcon = true,
  priority = false,
  className = "",
  imageClassName = "",
}: ProductImageProps) {
  const containerClassName = [
    "relative overflow-hidden bg-slate-100",
    aspectStyles[aspectRatio],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!src) {
    return (
      <div
        className={containerClassName}
        role="img"
        aria-label={alt}
      >
        {fallbackIcon && (
          <div className="flex h-full min-h-24 w-full items-center justify-center text-slate-400">
            <ImageOff
              className="h-10 w-10"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={[
          "h-full w-full object-cover",
          imageClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
