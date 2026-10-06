import { cn, initials } from "@/lib/utils";

const PALETTE = ["#0B58FF", "#0891B2", "#8B5CF6", "#D97706", "#021448", "#0E7490"];

function colorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({
  name,
  color,
  size = "md",
  status,
  className,
}: {
  name: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "busy" | "offline";
  className?: string;
}) {
  const bg = color ?? colorFor(name);
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-full font-semibold text-white ring-2 ring-white",
          size === "xs" && "size-6 text-[10px]",
          size === "sm" && "size-8 text-xs",
          size === "md" && "size-10 text-sm",
          size === "lg" && "size-14 text-lg",
          size === "xl" && "size-20 text-2xl",
        )}
        style={{ background: `linear-gradient(135deg, ${bg}, ${bg}cc)` }}
        aria-hidden
      >
        {initials(name)}
      </span>
      {status && (
        <span
          className={cn(
            "absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-white",
            status === "online" && "bg-emerald-500",
            status === "busy" && "bg-cyan-500",
            status === "offline" && "bg-slate-300",
          )}
        />
      )}
    </span>
  );
}
