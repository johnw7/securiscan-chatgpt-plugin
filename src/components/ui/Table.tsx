import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("scrollbar-thin overflow-x-auto", className)}>
      <table className="w-full border-separate border-spacing-0 text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "sticky top-0 border-b border-line bg-slate-50/80 px-4 py-3 text-[10.5px] font-semibold tracking-[0.08em] whitespace-nowrap text-slate-500 uppercase first:pl-5 last:pr-5",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function SortableTh<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: K;
  sort: { key: K; dir: "asc" | "desc" };
  onSort: (key: K) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <Th className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button onClick={() => onSort(sortKey)} className={cn("inline-flex items-center gap-1 uppercase transition hover:text-navy", active && "text-navy")}>
        {label}
        <Icon className="size-3" />
      </button>
    </Th>
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-line px-4 py-3.5 align-middle first:pl-5 last:pr-5", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("group transition-colors hover:bg-slate-50/70 [&:last-child>td]:border-b-0", className)} {...props} />;
}

export type SortState<K extends string> = { key: K; dir: "asc" | "desc" };

/** Clic sur un en-tête : inverse l'ordre si la colonne est déjà triée, sinon tri descendant (ascendant pour les textes). */
export function nextSort<K extends string>(current: SortState<K>, key: K, textKeys: K[] = []): SortState<K> {
  if (current.key === key) return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  return { key, dir: textKeys.includes(key) ? "asc" : "desc" };
}
