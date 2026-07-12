"use client";

import clsx from "clsx";

export type SortState<K extends string> = { key: K; dir: "asc" | "desc" };

export function useSortedRows<T extends Record<string, any>, K extends string>(
  rows: T[],
  sort: SortState<K>
): T[] {
  return [...rows].sort((a, b) => {
    const va = a[sort.key];
    const vb = b[sort.key];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "number" && typeof vb === "number") return sort.dir === "asc" ? va - vb : vb - va;
    return sort.dir === "asc"
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });
}

export function SortableHeader<K extends string>({
  label,
  colKey,
  sort,
  setSort,
}: {
  label: string;
  colKey: K;
  sort: SortState<K>;
  setSort: (s: SortState<K>) => void;
}) {
  const active = sort.key === colKey;
  return (
    <th
      onClick={() =>
        setSort({
          key: colKey,
          dir: active && sort.dir === "asc" ? "desc" : "asc",
        })
      }
      className={clsx("cursor-pointer select-none hover:text-text", active && "text-brand")}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-[10px] opacity-70">
          {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </span>
    </th>
  );
}
