"use client";

import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { useState } from "react";

export default function SeasonalityPage() {
  const [hemisphere, setHemisphere] = useState("north");

  const { data, isLoading } = useQuery({
    queryKey: ["seasonality", hemisphere],
    queryFn: () => api.getSeasonality(undefined, hemisphere),
  });

  const monthly = data?.monthly || [];
  const seasonal = data?.seasonal || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-hydro-border">
        <div>
          <div className="text-xs font-mono text-hydro-streamflow uppercase tracking-wider">
            Hydrological Regimes
          </div>
          <h1 className="text-2xl font-bold text-hydro-text">
            Seasonal Response Analysis
          </h1>
          <p className="text-xs text-hydro-muted mt-0.5">
            Investigate how seasonal soil moisture, evapotranspiration, and
            snowpack dynamics modulate runoff efficiency across the annual
            cycle.
          </p>
        </div>

        {/* Hemisphere Toggle */}
        <div className="flex items-center gap-2 bg-hydro-surface p-1 rounded-lg border border-hydro-border text-xs">
          <Globe className="w-3.5 h-3.5 text-hydro-muted ml-2" />
          <button
            onClick={() => setHemisphere("north")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              hemisphere === "north"
                ? "bg-hydro-elevated text-hydro-streamflow shadow"
                : "text-hydro-muted hover:text-hydro-text"
            }`}
          >
            Northern Hemisphere (DJF Winter)
          </button>
          <button
            onClick={() => setHemisphere("south")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              hemisphere === "south"
                ? "bg-hydro-elevated text-hydro-streamflow shadow"
                : "text-hydro-muted hover:text-hydro-text"
            }`}
          >
            Southern Hemisphere (JJA Winter)
          </button>
        </div>
      </div>

      {/* Seasonal Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {seasonal.map((s: any) => (
          <div
            key={s.season}
            className="p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-2"
          >
            <div className="text-xs font-bold text-hydro-text uppercase tracking-wider">
              {s.season}
            </div>
            <div className="text-2xl font-bold font-mono text-hydro-streamflow">
              {s.event_count}{" "}
              <span className="text-xs font-sans text-hydro-muted font-normal">
                events
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums pt-2 border-t border-hydro-border/40">
              <div>
                <span className="text-[10px] text-hydro-muted">
                  Median Rain:
                </span>
                <div className="font-semibold text-[#5C82FF]">
                  {s.median_precip_mm} mm
                </div>
              </div>
              <div>
                <span className="text-[10px] text-hydro-muted">
                  Median Runoff Ratio:
                </span>
                <div className="font-bold text-[#2DD4BF]">
                  {s.median_runoff_ratio}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Heatmap / Breakdown Table */}
      <div className="rounded-lg border border-hydro-border bg-hydro-surface overflow-hidden">
        <div className="p-3 border-b border-hydro-border flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-hydro-text">
            Monthly Hydrological Response Climatology
          </span>
          <span className="text-xs text-hydro-muted font-mono">
            Annual Cycle (Jan–Dec)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-hydro-border bg-hydro-elevated/40 text-[11px] font-mono text-hydro-muted">
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3 text-right">Event Count</th>
                <th className="py-2.5 px-3 text-right">Median Rainfall (mm)</th>
                <th className="py-2.5 px-3 text-right">Median Runoff Ratio</th>
                <th className="py-2.5 px-3 text-right">IQR (Q25–Q75)</th>
                <th className="py-2.5 px-3 text-right">Response Lag (days)</th>
                <th className="py-2.5 px-3 text-right">
                  Median Peak Flow (mm/d)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hydro-border/40 font-mono">
              {monthly.map((m: any) => {
                // Color intensity for runoff ratio
                const rr = m.median_runoff_ratio;
                return (
                  <tr
                    key={m.month}
                    className="hover:bg-hydro-elevated/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-hydro-text flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-hydro-streamflow" />
                      {m.month_name}
                    </td>
                    <td className="py-2.5 px-3 text-right text-hydro-text font-bold">
                      {m.event_count}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#5C82FF] font-semibold">
                      {m.median_precip_mm?.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-[#2DD4BF]">
                      {m.median_runoff_ratio?.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-hydro-muted text-[11px]">
                      {m.q25_runoff_ratio?.toFixed(2)} –{" "}
                      {m.q75_runoff_ratio?.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#E3BD69] font-semibold">
                      {m.median_lag_days} d
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#46B5F5]">
                      {m.median_peak_q_mm_day?.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
