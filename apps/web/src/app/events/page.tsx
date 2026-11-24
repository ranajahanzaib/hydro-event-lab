"use client";

import { api } from "@/lib/api";
import { useWorkspaceStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight, Download, GitCompare, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function EventsCatalogPage() {
  const { comparisonEventIds, addToComparison, removeFromComparison } =
    useWorkspaceStore();

  const [country, setCountry] = useState("");
  const [climate, setClimate] = useState("");
  const [minPrecip, setMinPrecip] = useState<number | undefined>(undefined);
  const [minRunoffRatio, setMinRunoffRatio] = useState<number | undefined>(
    undefined,
  );
  const [orderBy, setOrderBy] = useState("precip_total_mm DESC");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const { data, isLoading } = useQuery({
    queryKey: [
      "events",
      country,
      climate,
      minPrecip,
      minRunoffRatio,
      orderBy,
      page,
    ],
    queryFn: () =>
      api.getEvents({
        country: country || undefined,
        climate: climate || undefined,
        min_precip: minPrecip,
        min_runoff_ratio: minRunoffRatio,
        order_by: orderBy,
        limit: pageSize,
        offset: page * pageSize,
      }),
  });

  const events = data?.events || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-hydro-border">
        <div>
          <div className="text-xs font-mono text-hydro-streamflow uppercase tracking-wider">
            Hydrological Database
          </div>
          <h1 className="text-2xl font-bold text-hydro-text">
            Historical Event Catalog
          </h1>
          <p className="text-xs text-hydro-muted mt-0.5">
            Query detected rainfall-runoff events, filter by
            hydro-meteorological characteristics, and select events for
            comparative analysis.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {comparisonEventIds.length >= 2 && (
            <Link
              href="/compare"
              className="px-3 py-1.5 rounded bg-hydro-selected text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare Selected ({comparisonEventIds.length})
            </Link>
          )}
          <a
            href="/api/v1/exports/events?format=csv"
            className="px-3 py-1.5 rounded bg-hydro-surface hover:bg-hydro-elevated border border-hydro-border text-xs text-hydro-text flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border flex flex-wrap items-center gap-3 text-xs">
        {/* Country */}
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setPage(0);
          }}
          className="bg-hydro-elevated border border-hydro-border rounded px-2.5 py-1.5 text-hydro-text outline-none cursor-pointer"
        >
          <option value="">All Countries</option>
          <option value="United States">United States</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Australia">Australia</option>
          <option value="Austria">Austria</option>
        </select>

        {/* Climate */}
        <select
          value={climate}
          onChange={(e) => {
            setClimate(e.target.value);
            setPage(0);
          }}
          className="bg-hydro-elevated border border-hydro-border rounded px-2.5 py-1.5 text-hydro-text outline-none cursor-pointer"
        >
          <option value="">All Climates</option>
          <option value="Mediterranean">Mediterranean</option>
          <option value="Continental">Continental</option>
          <option value="Subtropical">Subtropical</option>
          <option value="Alpine">Alpine</option>
          <option value="Oceanic">Oceanic</option>
        </select>

        {/* Min Precip */}
        <select
          value={minPrecip ?? ""}
          onChange={(e) => {
            setMinPrecip(
              e.target.value ? parseFloat(e.target.value) : undefined,
            );
            setPage(0);
          }}
          className="bg-hydro-elevated border border-hydro-border rounded px-2.5 py-1.5 text-hydro-text outline-none cursor-pointer"
        >
          <option value="">Min Rainfall</option>
          <option value="25">&ge; 25 mm</option>
          <option value="50">&ge; 50 mm</option>
          <option value="75">&ge; 75 mm</option>
          <option value="100">&ge; 100 mm</option>
        </select>

        {/* Min Runoff Ratio */}
        <select
          value={minRunoffRatio ?? ""}
          onChange={(e) => {
            setMinRunoffRatio(
              e.target.value ? parseFloat(e.target.value) : undefined,
            );
            setPage(0);
          }}
          className="bg-hydro-elevated border border-hydro-border rounded px-2.5 py-1.5 text-hydro-text outline-none cursor-pointer"
        >
          <option value="">Runoff Ratio</option>
          <option value="0.2">&ge; 0.20</option>
          <option value="0.4">&ge; 0.40</option>
          <option value="0.6">&ge; 0.60</option>
        </select>

        {/* Sorting */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-hydro-muted text-[11px]">Sort:</span>
          <select
            value={orderBy}
            onChange={(e) => {
              setOrderBy(e.target.value);
              setPage(0);
            }}
            className="bg-hydro-elevated border border-hydro-border rounded px-2.5 py-1.5 text-hydro-text outline-none cursor-pointer font-mono"
          >
            <option value="precip_total_mm DESC">
              Precipitation (High to Low)
            </option>
            <option value="direct_runoff_ratio DESC">
              Runoff Ratio (High to Low)
            </option>
            <option value="peak_discharge_mm_day DESC">
              Peak Flow (High to Low)
            </option>
            <option value="precip_start_date DESC">Date (Newest First)</option>
            <option value="lag_peak_to_peak_days DESC">
              Response Lag (Longest)
            </option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-lg border border-hydro-border bg-hydro-surface overflow-hidden">
        <div className="p-3 border-b border-hydro-border flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-hydro-text">
            Detected Events ({total})
          </span>
          <span className="text-xs text-hydro-muted font-mono">
            Showing {page * pageSize + 1}–
            {Math.min((page + 1) * pageSize, total)} of {total}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-hydro-border bg-hydro-elevated/40 text-[11px] font-mono text-hydro-muted">
                <th className="py-2.5 px-3">Event Date</th>
                <th className="py-2.5 px-3">Catchment</th>
                <th className="py-2.5 px-3">Country</th>
                <th className="py-2.5 px-3 text-right">Rain Total (mm)</th>
                <th className="py-2.5 px-3 text-right">Max Daily (mm)</th>
                <th className="py-2.5 px-3 text-right">Duration</th>
                <th className="py-2.5 px-3 text-right">Peak Flow (mm/d)</th>
                <th className="py-2.5 px-3 text-right">Runoff Ratio</th>
                <th className="py-2.5 px-3 text-right">Lag</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hydro-border/40 font-mono">
              {events.map((ev: any) => {
                const isCompared = comparisonEventIds.includes(ev.event_id);
                return (
                  <tr
                    key={ev.event_id}
                    className="hover:bg-hydro-elevated/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-hydro-text">
                      {ev.precip_start_date}
                    </td>
                    <td
                      className="py-2.5 px-3 font-sans text-hydro-text font-medium truncate max-w-[200px]"
                      title={ev.catchment_name}
                    >
                      {ev.catchment_name}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-hydro-muted">
                      {ev.country}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#5C82FF]">
                      {ev.precip_total_mm?.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-hydro-muted">
                      {ev.precip_max_daily_mm?.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-hydro-muted">
                      {ev.precip_duration_days} d
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#46B5F5] font-semibold">
                      {ev.peak_discharge_mm_day?.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#2DD4BF]">
                      {ev.direct_runoff_ratio?.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#E3BD69]">
                      {ev.lag_peak_to_peak_days} d
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      <button
                        onClick={() =>
                          isCompared
                            ? removeFromComparison(ev.event_id)
                            : addToComparison(ev.event_id)
                        }
                        className={`p-1 rounded text-xs transition-colors ${
                          isCompared
                            ? "bg-hydro-selected text-slate-950 font-bold"
                            : "bg-hydro-elevated hover:bg-hydro-border text-hydro-muted hover:text-hydro-text"
                        }`}
                        title={
                          isCompared
                            ? "Remove from comparison"
                            : "Add to comparison"
                        }
                      >
                        {isCompared ? (
                          <Check className="w-3.5 h-3.5 inline" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 inline" />
                        )}
                      </button>
                      <Link
                        href={`/events/${ev.event_id}`}
                        className="p-1 rounded bg-[#46B5F5]/10 hover:bg-[#46B5F5]/20 text-hydro-streamflow inline-flex items-center"
                        title="Open in Event Studio"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-hydro-border flex items-center justify-between text-xs">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 rounded bg-hydro-elevated border border-hydro-border text-hydro-text disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="font-mono text-hydro-muted">
            Page {page + 1} of {Math.max(1, totalPages)}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 rounded bg-hydro-elevated border border-hydro-border text-hydro-text disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
