"use client";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input, Select } from "./input";
import { EmptyState } from "./misc";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number | null;
  className?: string;
  hideOnMobile?: boolean;
};

export type Filter<T> = {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  predicate: (row: T, value: string) => boolean;
};

/**
 * Tableau filtrable : recherche plein texte, filtres, tri, pagination.
 * Les données sont déjà autorisées par la RLS côté serveur.
 */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  filters = [],
  searchText,
  searchPlaceholder = "Rechercher…",
  pageSize = 20,
  onRowHref,
  emptyTitle = "Aucun élément",
  emptyDescription,
  caption,
  toolbar,
}: {
  rows: T[];
  columns: Column<T>[];
  filters?: Filter<T>[];
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowHref?: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  caption: string;
  toolbar?: React.ReactNode;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({});
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    let out = rows.filter((row) => {
      if (q && searchText) {
        const text = searchText(row).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
        if (!text.includes(q)) return false;
      }
      return filters.every((f) => !filterValues[f.key] || f.predicate(row, filterValues[f.key]!));
    });
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const va = col.sortValue!(a);
          const vb = col.sortValue!(b);
          if (va === vb) return 0;
          if (va === null) return 1;
          if (vb === null) return -1;
          const r = va < vb ? -1 : 1;
          return sort.dir === "asc" ? r : -r;
        });
      }
    }
    return out;
  }, [rows, query, filterValues, sort, columns, filters, searchText]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        {searchText && (
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="pl-9"
              type="search"
            />
          </div>
        )}
        {filters.map((f) => (
          <Select
            key={f.key}
            aria-label={f.label}
            className="w-auto min-w-40"
            value={filterValues[f.key] ?? ""}
            onChange={(e) => {
              setFilterValues((v) => ({ ...v, [f.key]: e.target.value }));
              setPage(0);
            }}
            placeholder={`${f.label} : tous`}
            options={f.options}
          />
        ))}
        {toolbar}
      </div>

      {filtered.length === 0 ? (
        <div className="p-4">
          <EmptyState title={rows.length === 0 ? emptyTitle : "Aucun résultat"} description={rows.length === 0 ? emptyDescription : "Modifiez la recherche ou les filtres."} />
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                {columns.map((c) => {
                  const sorted = sort?.key === c.key ? sort.dir : null;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                      className={cn("px-4 py-3 font-medium", c.hideOnMobile && "hidden md:table-cell", c.className)}
                    >
                      {c.sortValue ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                          onClick={() =>
                            setSort((s) => (s?.key === c.key ? (s.dir === "asc" ? { key: c.key, dir: "desc" } : null) : { key: c.key, dir: "asc" }))
                          }
                        >
                          {c.header}
                          {sorted === "asc" ? <ArrowUp className="size-3" /> : sorted === "desc" ? <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-50" />}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.id}
                  className={cn("border-b border-border/60 last:border-0 hover:bg-surface-2/60", onRowHref && "cursor-pointer")}
                  onClick={(e) => {
                    if (!onRowHref) return;
                    if ((e.target as HTMLElement).closest("a,button,input,select,textarea,label")) return;
                    router.push(onRowHref(row));
                  }}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3 align-middle", c.hideOnMobile && "hidden md:table-cell", c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted">
          <span>
            {current * pageSize + 1}–{Math.min(filtered.length, (current + 1) * pageSize)} sur {filtered.length}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Page précédente">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1} aria-label="Page suivante">
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
