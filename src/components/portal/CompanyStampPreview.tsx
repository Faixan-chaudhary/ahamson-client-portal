import { cn } from "@/lib/utils";

interface CompanyStampPreviewProps {
  src: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Slight ink stamp tilt */
  tilted?: boolean;
}

function isImageSrc(src: string) {
  return (
    src.startsWith("data:image") ||
    src.startsWith("blob:") ||
    /^https?:\/\//i.test(src) ||
    /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(src)
  );
}

const SIZE = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-28 h-28",
} as const;

/** Renders an uploaded company stamp with a physical rubber-stamp look. */
export function CompanyStampPreview({
  src,
  size = "md",
  className,
  tilted = true,
}: CompanyStampPreviewProps) {
  const showImage = isImageSrc(src);

  return (
    <div
      className={cn(
        "relative flex-shrink-0 overflow-hidden rounded-full",
        SIZE[size],
        className,
      )}
      title="Company stamp"
    >
      <div
        className={cn(
          "absolute inset-0",
          tilted && "-rotate-[8deg] scale-[0.88]",
        )}
      >
        {/* Outer ink ring */}
        <div className="absolute inset-0 rounded-full border-[2.5px] border-[#C0392B]/75 shadow-[inset_0_0_0_1px_rgba(192,57,43,0.25)]" />
        <div className="absolute inset-[5px] rounded-full border border-[#C0392B]/45" />

        <div className="absolute inset-[9px] overflow-hidden rounded-full bg-white/40">
          {showImage ? (
            <img
              src={src}
              alt="Company stamp"
              className="h-full w-full object-cover object-center"
              style={{
                filter: "contrast(1.15) sepia(0.45) hue-rotate(-18deg) saturate(2.4) brightness(0.92)",
                mixBlendMode: "multiply",
                opacity: 0.92,
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-1 text-center text-[7px] font-bold leading-tight text-[#C0392B]/80 uppercase tracking-wide">
              {src}
            </div>
          )}
        </div>

        {/* Soft ink texture */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full opacity-30 mix-blend-multiply"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, transparent 40%, rgba(192,57,43,0.25) 100%)",
          }}
        />
      </div>
    </div>
  );
}
