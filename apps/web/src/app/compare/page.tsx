"use client";

import { api } from "@/lib/api";
import { useWorkspaceStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CompareWorkspacePage() {
  const { comparisonEventIds, removeFromComparison, clearComparison } =
    useWorkspaceStore();

  const [alignmentMode, setAlignmentMode] = useState<string>(
    "days_since_rainfall_onset",
  );
  const [normalizationMode, setNormalizationMode] =
    useState<string>("runoff_depth_mm");
  const [viewMode, setViewMode] = useState<"overlay" | "multiples" | "matrix">(
    "overlay",
  );

  // Fetch comparison data from backend
  const { data: compareData, isLoading } = useQuery({
    queryKey: ["compare", comparisonEventIds, alignmentMode, normalizationMode],
    queryFn: () =>
      api.compareEvents({
        event_ids: comparisonEventIds,
        alignment_mode: alignmentMode,
        normalization_mode: normalizationMode,
      }),
    enabled: comparisonEventIds.length >= 2,
  });

  const alignedEvents = compareData?.aligned_events || [];
  const contrast = compareData?.contrast_summary;

  // Colors for multi-event overlay comparison
  const EVENT_COLORS = [
    "#46B5F5",
    "#2DD4BF",
    "#F0D58C",
    "#F87171",
    "#A78BFA",
    "#FB923C",
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-hydro-border">
        <div>
          <div className="text-xs font-mono text-hydro-streamflow uppercase tracking-wider">
            Comparative Workspace
          </div>
          <h1 className="text-2xl font-bold text-hydro-text">
            Multi-Event Comparison
          </h1>
          <p className="text-xs text-hydro-muted mt-0.5">
            Compare 2 to 6 rainfall-runoff events with synchronized alignment,
            selectable normalization, and metric delta analysis.
          </p>
        </div>

        {comparisonEventIds.length > 0 && (
          <button
            onClick={clearComparison}
            className="px-3 py-1.5 rounded bg-hydro-surface hover:bg-hydro-elevated border border-hydro-border text-xs text-hydro-muted hover:text-hydro-flag flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Workspace
          </button>
        )}
      </div>

      {/* Selected Events Chips */}
      <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-hydro-text mr-1">
          Comparing ({comparisonEventIds.length}/6):
        </span>
        {comparisonEventIds.length === 0 ? (
          <div className="text-hydro-muted italic flex items-center gap-2">
            <span>No events selected yet. Select events from the</span>
            <Link
              href="/events"
              className="text-hydro-streamflow underline not-italic font-semibold"
            >
              Historical Event Catalog
            </Link>
            <span>or</span>
            <Link
              href="/similarity"
              className="text-hydro-streamflow underline not-italic font-semibold"
            >
              Similar Event Discovery
            </Link>
          </div>
        ) : (
          comparisonEventIds.map((eid, idx) => (
            <div
              key={eid}
              className="px-2.5 py-1 rounded bg-hydro-elevated border border-hydro-border flex items-center gap-2 font-mono text-xs"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: EVENT_COLORS[idx % EVENT_COLORS.length],
                }}
              />
              <span
                className="truncate max-w-[140px] text-hydro-text"
                title={eid}
              >
                {eid}
              </span>
              <button
                onClick={() => removeFromComparison(eid)}
                className="text-hydro-muted hover:text-hydro-flag"
              >
                &times;
              </button>
            </div>
          ))
        )}

        {comparisonEventIds.length < 2 && comparisonEventIds.length > 0 && (
          <span className="text-[11px] text-hydro-selected font-medium ml-2">
            (Select at least 2 events to activate comparative analysis)
          </span>
        )}
      </div>

      {comparisonEventIds.length >= 2 && (
        <>
          {/* Controls Bar: Alignment, Normalization, View Mode */}
          <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* View Mode */}
            <div className="flex items-center gap-1 bg-hydro-elevated p-1 rounded border border-hydro-border">
              <button
                onClick={() => setViewMode("overlay")}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  viewMode === "overlay"
                    ? "bg-hydro-surface text-hydro-streamflow shadow"
                    : "text-hydro-muted hover:text-hydro-text"
                }`}
              >
                Overlay
              </button>
              <button
                onClick={() => setViewMode("multiples")}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  viewMode === "multiples"
                    ? "bg-hydro-surface text-hydro-streamflow shadow"
                    : "text-hydro-muted hover:text-hydro-text"
                }`}
              >
                Small Multiples
              </button>
              <button
                onClick={() => setViewMode("matrix")}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  viewMode === "matrix"
                    ? "bg-hydro-surface text-hydro-streamflow shadow"
                    : "text-hydro-muted hover:text-hydro-text"
                }`}
              >
                Metric Matrix
              </button>
            </div>

            {/* Alignment Mode */}
            <div className="flex items-center gap-2">
              <span className="text-hydro-muted">Temporal Alignment:</span>
              <select
                value={alignmentMode}
                onChange={(e) => setAlignmentMode(e.target.value)}
                className="bg-hydro-elevated border border-hydro-border rounded px-2.5 py-1 text-hydro-text outline-none cursor-pointer font-mono text-xs"
              >
                <option value="days_since_rainfall_onset">
                  Days Since Storm Onset (t = 0)
                </option>
                <option value="days_since_peak_precip">
                  Days Relative to Peak Rainfall
                </option>
                <option value="days_relative_to_peak_q">
                  Days Relative to Peak Flow Crest
                </option>
                <option value="calendar_date">Absolute Calendar Date</option>
              </select>
            </div>

            {/* Normalization Mode */}
            <div className="flex items-center gap-2">
              <span className="text-hydro-muted">Flow Normalization:</span>
              <select
                value={normalizationMode}
                onChange={(e) => setNormalizationMode(e.target.value)}
                className="bg-hydro-elevated border border-hydro-border rounded px-2.5 py-1 text-hydro-text outline-none cursor-pointer font-mono text-xs"
              >
                <option value="runoff_depth_mm">
                  Area-Normalized Runoff Depth (mm/day)
                </option>
                <option value="volumetric_m3_s">
                  Absolute Volumetric Discharge (m³/s)
                </option>
                <option value="normalized_peak_fraction">
                  Peak Relative Hydrograph Shape (Q / Q_peak)
                </option>
              </select>
            </div>
          </div>

          {/* Scientific Contrast Alert */}
          {contrast && (
            <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border flex items-start gap-3 text-xs">
              <Sparkles className="w-4 h-4 text-hydro-selected flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-hydro-text">
                  Hydrological Divergence Summary:
                </div>
                <div className="text-hydro-muted mt-0.5 leading-relaxed">
                  {contrast.scientific_observation} Across the selected events,
                  direct runoff ratios diverge by{" "}
                  <strong className="text-[#2DD4BF] font-mono">
                    {contrast.runoff_ratio_range}
                  </strong>{" "}
                  (from{" "}
                  {Math.min(
                    ...alignedEvents.map((e: any) => e.direct_runoff_ratio),
                  )}{" "}
                  to{" "}
                  {Math.max(
                    ...alignedEvents.map((e: any) => e.direct_runoff_ratio),
                  )}
                  ) and response lags differ by{" "}
                  <strong className="text-[#E3BD69] font-mono">
                    {contrast.lag_days_range} days
                  </strong>
                  .
                </div>
              </div>
            </div>
          )}

          {/* View Mode 1: Overlay */}
          {viewMode === "overlay" && (
            <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-hydro-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-hydro-text">
                  Synchronized Hydrograph Overlay
                </span>
                <span className="text-xs text-hydro-muted font-mono">
                  {normalizationMode === "volumetric_m3_s"
                    ? "m³/s"
                    : normalizationMode === "normalized_peak_fraction"
                      ? "Q / Q_peak"
                      : "mm/day"}
                </span>
              </div>

              {/* Responsive SVG Overlay Render */}
              <div className="w-full h-80 relative overflow-hidden">
                <svg className="w-full h-full">
                  {alignedEvents.map((ev: any, idx: number) => {
                    const series = ev.series || [];
                    if (series.length < 2) return null;
                    const color = EVENT_COLORS[idx % EVENT_COLORS.length];

                    // Compute simple SVG polyline path
                    const xCoords = series.map((s: any) =>
                      typeof s.aligned_x === "number" ? s.aligned_x : 0,
                    );
                    const minX = Math.min(...xCoords);
                    const maxX = Math.max(...xCoords);
                    const yVals = series.map((s: any) => s.streamflow || 0);
                    const maxY = Math.max(1, Math.max(...yVals));

                    const pointsStr = series
                      .map((s: any) => {
                        const relX =
                          (typeof s.aligned_x === "number"
                            ? (s.aligned_x - minX) / (maxX - minX || 1)
                            : 0) *
                            800 +
                          40;
                        const relY = 270 - ((s.streamflow || 0) / maxY) * 230;
                        return `${relX},${relY}`;
                      })
                      .join(" ");

                    return (
                      <g key={ev.event_id}>
                        <polyline
                          fill="none"
                          stroke={color}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pointsStr}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Overlay Legend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-hydro-border/40 text-xs">
                {alignedEvents.map((ev: any, idx: number) => (
                  <div
                    key={ev.event_id}
                    className="p-2.5 rounded bg-hydro-elevated/40 border border-hydro-border/40 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            EVENT_COLORS[idx % EVENT_COLORS.length],
                        }}
                      />
                      <span className="font-bold text-hydro-text truncate">
                        {ev.catchment_name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 text-[11px] font-mono tabular-nums text-hydro-muted">
                      <span>
                        Rain Total:{" "}
                        <strong className="text-[#5C82FF]">
                          {ev.precip_total_mm} mm
                        </strong>
                      </span>
                      <span>
                        Runoff Ratio:{" "}
                        <strong className="text-[#2DD4BF]">
                          {ev.direct_runoff_ratio}
                        </strong>
                      </span>
                      <span>
                        Peak Q:{" "}
                        <strong className="text-[#46B5F5]">
                          {ev.peak_discharge_mm_day} mm/d
                        </strong>
                      </span>
                      <span>
                        Lag:{" "}
                        <strong className="text-[#E3BD69]">
                          {ev.lag_peak_to_peak_days} d
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View Mode 2: Small Multiples */}
          {viewMode === "multiples" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alignedEvents.map((ev: any, idx: number) => (
                <div
                  key={ev.event_id}
                  className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border space-y-2"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-hydro-border/40">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            EVENT_COLORS[idx % EVENT_COLORS.length],
                        }}
                      />
                      <span className="font-bold text-xs text-hydro-text truncate max-w-[200px]">
                        {ev.catchment_name}
                      </span>
                    </div>
                    <Link
                      href={`/events/${ev.event_id}`}
                      className="text-[11px] text-hydro-streamflow hover:underline flex items-center"
                    >
                      Studio <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono tabular-nums bg-hydro-bg p-2 rounded">
                    <div>
                      <div className="text-[10px] text-hydro-muted">
                        Rainfall
                      </div>
                      <div className="font-bold text-[#5C82FF]">
                        {ev.precip_total_mm} mm
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-hydro-muted">
                        Runoff Ratio
                      </div>
                      <div className="font-bold text-[#2DD4BF]">
                        {ev.direct_runoff_ratio}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-hydro-muted">
                        Response Lag
                      </div>
                      <div className="font-bold text-[#E3BD69]">
                        {ev.lag_peak_to_peak_days} days
                      </div>
                    </div>
                  </div>

                  <div className="h-32 w-full pt-1">
                    <svg className="w-full h-full">
                      {(() => {
                        const series = ev.series || [];
                        if (series.length < 2) return null;
                        const yVals = series.map((s: any) => s.streamflow || 0);
                        const maxY = Math.max(1, Math.max(...yVals));
                        const pts = series
                          .map((s: any, sIdx: number) => {
                            const x = (sIdx / (series.length - 1)) * 360 + 10;
                            const y = 110 - ((s.streamflow || 0) / maxY) * 95;
                            return `${x},${y}`;
                          })
                          .join(" ");
                        return (
                          <polyline
                            fill="none"
                            stroke={EVENT_COLORS[idx % EVENT_COLORS.length]}
                            strokeWidth="2"
                            points={pts}
                          />
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View Mode 3: Metric Comparison Matrix */}
          {viewMode === "matrix" && (
            <div className="rounded-lg border border-hydro-border bg-hydro-surface overflow-hidden">
              <div className="p-3 border-b border-hydro-border">
                <span className="text-xs font-bold uppercase tracking-wider text-hydro-text">
                  Hydrological &amp; Catchment Attribute Comparison Matrix
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-hydro-border bg-hydro-elevated/40 text-[11px] font-mono text-hydro-muted">
                      <th className="py-2.5 px-3">Metric / Characteristic</th>
                      {alignedEvents.map((ev: any, idx: number) => (
                        <th
                          key={ev.event_id}
                          className="py-2.5 px-3 font-semibold text-hydro-text"
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1.5"
                            style={{
                              backgroundColor:
                                EVENT_COLORS[idx % EVENT_COLORS.length],
                            }}
                          />
                          {ev.catchment_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hydro-border/40 font-mono text-xs">
                    <tr>
                      <td className="py-2.5 px-3 text-hydro-muted font-sans font-medium">
                        Catchment Country
                      </td>
                      {alignedEvents.map((ev: any) => (
                        <td
                          key={ev.event_id}
                          className="py-2.5 px-3 text-hydro-text"
                        >
                          {ev.country}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-hydro-muted font-sans font-medium">
                        Climate Classification
                      </td>
                      {alignedEvents.map((ev: any) => (
                        <td
                          key={ev.event_id}
                          className="py-2.5 px-3 text-hydro-streamflow"
                        >
                          {ev.climate_zone}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-hydro-muted font-sans font-medium">
                        Drainage Area (km²)
                      </td>
                      {alignedEvents.map((ev: any) => (
                        <td
                          key={ev.event_id}
                          className="py-2.5 px-3 text-hydro-text"
                        >
                          {ev.area_km2?.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-hydro-muted font-sans font-medium">
                        Event Total Rainfall (mm)
                      </td>
                      {alignedEvents.map((ev: any) => (
                        <td
                          key={ev.event_id}
                          className="py-2.5 px-3 font-bold text-[#5C82FF]"
                        >
                          {ev.precip_total_mm}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-hydro-muted font-sans font-medium">
                        Peak Discharge (mm/day)
                      </td>
                      {alignedEvents.map((ev: any) => (
                        <td
                          key={ev.event_id}
                          className="py-2.5 px-3 font-bold text-[#46B5F5]"
                        >
                          {ev.peak_discharge_mm_day}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-hydro-elevated/20">
                      <td className="py-2.5 px-3 text-hydro-text font-sans font-bold">
                        Direct Runoff Ratio
                      </td>
                      {alignedEvents.map((ev: any) => (
                        <td
                          key={ev.event_id}
                          className="py-2.5 px-3 font-extrabold text-[#2DD4BF] text-sm"
                        >
                          {ev.direct_runoff_ratio}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-hydro-elevated/20">
                      <td className="py-2.5 px-3 text-hydro-text font-sans font-bold">
                        Peak-to-Peak Response Lag
                      </td>
                      {alignedEvents.map((ev: any) => (
                        <td
                          key={ev.event_id}
                          className="py-2.5 px-3 font-bold text-[#E3BD69]"
                        >
                          {ev.lag_peak_to_peak_days} days
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
