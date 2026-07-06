import { cn } from "@/lib/utils";

interface AnimatedIconSwapProps {
  active: boolean;
  idle: React.ReactNode;
  activeIcon: React.ReactNode;
  size?: string;
  className?: string;
}

/** Cross-fades between two icons with a slow scale/rotate transition. */
export function AnimatedIconSwap({
  active,
  idle,
  activeIcon,
  size = "w-4 h-4",
  className,
}: AnimatedIconSwapProps) {
  return (
    <span className={cn("relative inline-flex flex-shrink-0", size, className)}>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out",
          active ? "opacity-0 scale-75 rotate-45" : "opacity-100 scale-100 rotate-0",
        )}
      >
        {idle}
      </span>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out delay-100",
          active ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-45",
        )}
      >
        {activeIcon}
      </span>
    </span>
  );
}
