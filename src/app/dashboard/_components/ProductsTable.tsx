"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type ProductRow = {
  status: "ATTIVO" | "ESAURITO";
  tone: "green" | "red";
  when: [string, string];
  name: string;
  asin: string;
  sku: string;
  variants?: string;
  perf: Array<[string, string]>;
  inv: Array<[string, string]>;
  ship: Array<[string, string]>;
  total: [string, string, string];
  action: string;
};

export function ProductsTable({
  title = "Articoli in vendita",
  rows,
  footerHref = "#",
  footerLabel = "Visualizza tutto il magazzino",
  selectable = false,
  pagination,
  rowActionHrefBuilder,
  onSelectionChange,
}: {
  title?: string;
  rows: ProductRow[];
  footerHref?: string;
  footerLabel?: string;
  selectable?: boolean;
  pagination?: { totalPages: number; initialPage?: number };
  rowActionHrefBuilder?: (row: ProductRow) => string;
  onSelectionChange?: (rows: ProductRow[]) => void;
}) {
  const [page, setPage] = useState(pagination?.initialPage ?? 1);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());

  const rowIds = useMemo(() => rows.map((r, idx) => `${r.sku}-${idx}`), [rows]);

  const allChecked = useMemo(() => {
    if (!selectable) return false;
    if (rows.length === 0) return false;
    return rowIds.every((id) => selectedRowIds.has(id));
  }, [rows.length, rowIds, selectable, selectedRowIds]);

  const someChecked = useMemo(() => {
    if (!selectable) return false;
    return rowIds.some((id) => selectedRowIds.has(id)) && !allChecked;
  }, [allChecked, rowIds, selectable, selectedRowIds]);

  const selectedRows = useMemo(
    () => rows.filter((row, idx) => selectedRowIds.has(`${row.sku}-${idx}`)),
    [rows, selectedRowIds],
  );
  const selectedIdsKey = useMemo(
    () => Array.from(selectedRowIds).sort().join("|"),
    [selectedRowIds],
  );
  const lastSelectionEmitRef = useRef("");

  useEffect(() => {
    if (!onSelectionChange) return;
    if (lastSelectionEmitRef.current === selectedIdsKey) return;
    lastSelectionEmitRef.current = selectedIdsKey;
    onSelectionChange(selectedRows);
  }, [onSelectionChange, selectedRows, selectedIdsKey]);

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
      {title ? (
        <>
          <div className="px-6 pt-6">
            <div className="text-[16px] font-semibold tracking-tight text-[#1f2b20]">
              {title}
            </div>
          </div>
          <div className="mt-4 h-px w-full bg-[#eef1ef]" />
        </>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left">
          <thead className="bg-[#f6f7f6] text-[10px] font-semibold tracking-wide text-[#9aa39a]">
            <tr className="border-b border-black/5">
              {selectable ? (
                <th className="w-[44px] px-6 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-black/10"
                    checked={allChecked}
                    ref={(el) => {
                      if (!el) return;
                      el.indeterminate = someChecked;
                    }}
                    onChange={(e) => {
                      const next = new Set<string>();
                      if (e.target.checked) rowIds.forEach((id) => next.add(id));
                      setSelectedRowIds(next);
                    }}
                    aria-label="Seleziona tutti"
                  />
                </th>
              ) : null}
              <th className="px-6 py-4">STATO</th>
              <th className="py-4 pr-4">DETTAGLI PRODOTTO</th>
              <th className="py-4 pr-4">PERFORMANCE (30GG)</th>
              <th className="py-4 pr-4">INVENTARIO</th>
              <th className="py-4 pr-4">PREZZO &amp; SPEDIZIONE</th>
              <th className="py-4 pr-4">TOTALE</th>
              <th className="py-4 pr-6 text-right">AZIONI</th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-[#1f2b20]">
            {rows.map((row, idx) => {
              const rowId = `${row.sku}-${idx}`;
              return (
              <tr key={rowId} className="border-b border-black/5">
                {selectable ? (
                  <td className="w-[44px] px-6 py-6 align-top">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-black/10"
                      checked={selectedRowIds.has(rowId)}
                      onChange={(e) => {
                        setSelectedRowIds((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(rowId);
                          else next.delete(rowId);
                          return next;
                        });
                      }}
                      aria-label={`Seleziona ${row.name}`}
                    />
                  </td>
                ) : null}
                <td className="w-[140px] px-6 py-6 align-top">
                  <div
                    className={`text-[11px] font-semibold ${row.tone === "red" ? "text-[#b42318]" : "text-[#2f6b3c]"}`}
                  >
                    {row.status}
                  </div>
                  <div className="mt-2 space-y-1 text-[10px] font-semibold text-[#9aa39a]">
                    <div>{row.when[0]}</div>
                    <div>{row.when[1]}</div>
                  </div>
                </td>

                <td className="py-6 pr-4 align-top">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-2xl bg-[#f2f4f2] ring-1 ring-black/5" />
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-semibold text-[#1f2b20]">
                        {row.name}
                      </div>
                      <div className="mt-2 text-[10px] font-semibold text-[#9aa39a]">
                        <div>
                          <span className="text-[#6b746c]">ASIN:</span> {row.asin}
                        </div>
                        <div>
                          <span className="text-[#6b746c]">SKU:</span> {row.sku}
                        </div>
                        {row.variants ? (
                          <div className="mt-1 text-[#2f6b3c]">{row.variants}</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-6 pr-4 align-top text-[10px] font-semibold text-[#6b746c]">
                  <div className="space-y-1.5">
                    {row.perf.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <span className="text-[#9aa39a]">{k}</span>
                        <span
                          className={`font-semibold ${k === "Rank:" ? "text-[#16A34A]" : "text-[#1f2b20]"}`}
                        >
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>

                <td className="py-6 pr-4 align-top text-[10px] font-semibold text-[#6b746c]">
                  <div className="space-y-1.5">
                    {row.inv.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <span
                          className={`${k === "Disponibili:" ? "text-[#1f2b20] font-semibold" : "text-[#9aa39a]"}`}
                        >
                          {k}
                        </span>
                        <span
                          className={`font-semibold ${k === "Disponibili:" ? "text-[#16A34A]" : "text-[#1f2b20]"}`}
                        >
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>

                <td className="py-6 pr-4 align-top text-[10px] font-semibold text-[#6b746c]">
                  <div className="space-y-1.5">
                    {row.ship.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <span className="text-[#1f2b20]">{k}</span>
                        <span className="font-regular text-[#9aa39a]">{v}</span>
                      </div>
                    ))}
                  </div>
                </td>

                <td className="py-6 pr-4 align-top">
                  <div className="text-[10px] font-semibold text-[#6b746c]">
                    {row.total[0]}
                  </div>
                  <div className="mt-1 text-[12px] font-semibold text-[#1f2b20]">
                    {row.total[1]}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-[#c0c6c0]">
                    {row.total[2]}
                  </div>
                </td>

                <td className="py-6 pr-6 align-top text-right">
                  {rowActionHrefBuilder ? (
                    <Link
                      href={rowActionHrefBuilder(row)}
                      className="inline-flex h-6 items-center justify-center gap-1 rounded-md border border-black/10 bg-white px-2 text-[11px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                    >
                      {row.action}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex h-6 items-center justify-center gap-1 rounded-md border border-black/10 bg-white px-2 text-[11px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5"
                    >
                      {row.action}
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-6">
        {pagination ? (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-[#6b746c] hover:cursor-pointer hover:bg-black/5"
              aria-label="Pagina precedente"
            >
              ‹
            </button>

            {[1, 2, 3].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-semibold hover:cursor-pointer ${
                  page === p
                    ? "bg-[#214e3a] text-white"
                    : "border border-black/10 bg-white text-[#1f2b20] hover:bg-black/5"
                }`}
              >
                {p}
              </button>
            ))}

            <div className="px-1 text-[12px] font-semibold text-[#9aa39a]">…</div>

            <button
              type="button"
              onClick={() => setPage(pagination.totalPages)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-semibold hover:cursor-pointer ${
                page === pagination.totalPages
                  ? "bg-[#214e3a] text-white"
                  : "border border-black/10 bg-white text-[#1f2b20] hover:bg-black/5"
              }`}
            >
              {pagination.totalPages}
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-[#6b746c] hover:cursor-pointer hover:bg-black/5"
              aria-label="Pagina successiva"
            >
              ›
            </button>
          </div>
        ) : (
          <a
            href={footerHref}
            className="flex items-center justify-center gap-2 text-[11px] font-semibold text-[#16A34A] hover:cursor-pointer hover:underline"
          >
            {footerLabel} <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </section>
  );
}

export const demoProductsRows: ProductRow[] = [
  {
    status: "ATTIVO",
    tone: "green",
    when: ["Dal: 12 Gen 2024", "14:30 PM"],
    name: "Cuffie Wireless Pro - Cancellazione Rumore...",
    asin: "B0DK7SVN8L",
    sku: "3R-9921-BLK",
    variants: "+3 Varianti",
    perf: [
      ["Vendite:", "€9.796,00"],
      ["Unità vendute:", "124"],
      ["Visualizzazioni:", "3,420"],
      ["Rank:", "#42 Elettronica"],
    ],
    inv: [
      ["Disponibili:", "20"],
      ["Soglia minima", "10"],
      ["Sito", "Scaffale A-12"],
    ],
    ship: [
      ["Prezzo:", "€79,00"],
      ["Commissioni:", "+ %2.50"],
      ["Spedizione:", "+ €9.00"],
    ],
    total: ["Totale:", "€90.00", "(IVA esclusa)"],
    action: "Modifica",
  },
  {
    status: "ATTIVO",
    tone: "green",
    when: ["Dal: 05 Feb 2024", "09:15 AM"],
    name: "Smart Watch Ultra - GPS, Cellular, Cassa Titanio...",
    asin: "B0CKB2XYML",
    sku: "3R-8402-ORG",
    perf: [
      ["Vendite:", "€22,161.00"],
      ["Unità vendute:", "89"],
      ["Visualizzazioni:", "5,102"],
      ["Rank:", "#12 Wearables"],
    ],
    inv: [
      ["Disponibili:", "40"],
      ["Soglia minima", "10"],
      ["Sito", "Scaffale A-15"],
    ],
    ship: [
      ["Prezzo:", "€27.00"],
      ["Commissioni:", "+ %2.50"],
      ["Spedizione:", "+ €9.00"],
    ],
    total: ["Totale:", "€37.35", "(IVA esclusa)"],
    action: "Modifica",
  },
  {
    status: "ESAURITO",
    tone: "red",
    when: ["Dal: 20 Mar 2024", "11:00 AM"],
    name: "Macchina Caffè Barista Pro - Doppia Caldaia,...",
    asin: "B09J8K4L2M",
    sku: "3R-1120-SS",
    perf: [
      ["Vendite:", "€35,168.00"],
      ["Unità vendute:", "32"],
      ["Visualizzazioni:", "1,205"],
      ["Rank:", "-"],
    ],
    inv: [
      ["Disponibili:", "0"],
      ["Soglia minima", "0"],
      ["Sito", "Scaffale C-03"],
    ],
    ship: [
      ["Prezzo:", "€110.00"],
      ["Commissioni:", "+ %2.50"],
      ["Spedizione:", "+ €19.99"],
    ],
    total: ["Totale:", "€130.50", "(IVA esclusa)"],
    action: "Rifornisci",
  },
  {
    status: "ATTIVO",
    tone: "green",
    when: ["Dal: 15 Apr 2024", "16:45 PM"],
    name: "Auricolari Air Buds - TWS, Custodia Ricarica...",
    asin: "B0BL5P7Q3R",
    sku: "3R-5582-WHT",
    perf: [
      ["Vendite:", "€26,187.00"],
      ["Unità vendute:", "203"],
      ["Visualizzazioni:", "8,920"],
      ["Rank:", "#3 Audio"],
    ],
    inv: [
      ["Disponibili:", "120"],
      ["Soglia minima", "10"],
      ["Sito", "Scaffale B-8"],
    ],
    ship: [
      ["Prezzo:", "€19.00"],
      ["Commissioni:", "+ %2.50"],
      ["Spedizione:", "N.D."],
    ],
    total: ["Totale:", "€19.51", "(IVA esclusa)"],
    action: "Modifica",
  },
];
