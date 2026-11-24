"use client";

import { RelationshipScatterPlot } from "@/components/visualization/RelationshipScatterPlot";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useState } from "react";

const VARIABLE_OPTIONS = [
  { value: "precip_total_mm", label: "Event Total Rainfall (mm)" },
  { value: "direct_runoff_ratio", label: "Direct Runoff Ratio (R_direct / P)" },
  { value: "peak_discharge_mm_day", label: "Peak Discharge (mm/day)" },
  { value: "lag_peak_to_peak_days", label: "Response Lag (Peak-to-Peak Days)" },
  {
    value: "antecedent_precip_7d_mm",
    label: "Antecedent Precipitation 7d (mm)",
  },
  { value: "area_km2", label: "Catchment Area (km²)" },
  { value: "recession_k", label: "Recession Constant k (day⁻¹)" },
];

export default function RelationshipsPage() {
  const [xVar, setXVar] = useState("precip_total_mm");
  const [yVar, setYVar] = useState("direct_runoff_ratio");
  const [logX, setLogX] = useState(false);
  const [logY, setLogY] = useState(false);
  const [climate, setClimate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["statistics-query", xVar, yVar, logX, logY, climate],
    queryFn: () =>
      api.queryStatistics({
        x_var: xVar,
        y_var: yVar,
        log_x: logX,
        log_y: logY,
        climate: climate || undefined,
      }),
  });

  const binnedSummary = data?.binned_summary || [];
  const linearFit = data?.linear_fit;
  const scatterPoints = data?.points || [];
  const xLabel = VARIABLE_OPTIONS.find((o) => o.value === xVar)?.label || xVar;
  const yLabel = VARIABLE_OPTIONS.find((o) => o.value === yVar)?.label || yVar;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-hydro-border">
        <div>
          <div className="text-xs font-mono text-hydro-streamflow uppercase tracking-wider">
            Multivariate Analytics
          </div>
          <h1 className="text-2xl font-bold text-hydro-text">
            Statistical Relationship Explorer
          </h1>
          <p className="text-xs text-hydro-muted mt-0.5">
            Investigate empirical relationships between meteorological forcing,
            landscape attributes, and catchment streamflow responses.
          </p>
        </div>
      </div>

      {/* Variable Selection & Controls */}
      <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border flex flex-wrap items-center gap-4 text-xs">
        {/* X Variable */}
        <div className="flex items-center gap-2">
          <span className="text-hydro-muted font-bold">X Axis:</span>
          <select
            value={xVar}
            onChange={(e) => setXVar(e.target.value)}
            className="bg-hydro-elevated border border-hydro-border rounded px-3 py-1.5 text-hydro-text outline-none cursor-pointer"
          >
            {VARIABLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 cursor-pointer text-hydro-muted hover:text-hydro-text">
            <input
              type="checkbox"
              checked={logX}
              onChange={(e) => setLogX(e.target.checked)}
              className="rounded bg-hydro-elevated border-hydro-border"
            />
            Log X
          </label>
        </div>

        {/* Y Variable */}
        <div className="flex items-center gap-2">
          <span className="text-hydro-muted font-bold">Y Axis:</span>
          <select
            value={yVar}
            onChange={(e) => setYVar(e.target.value)}
            className="bg-hydro-elevated border border-hydro-border rounded px-3 py-1.5 text-hydro-text outline-none cursor-pointer"
          >
            {VARIABLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 cursor-pointer text-hydro-muted hover:text-hydro-text">
            <input
              type="checkbox"
              checked={logY}
              onChange={(e) => setLogY(e.target.checked)}
              className="rounded bg-hydro-elevated border-hydro-border"
            />
            Log Y
          </label>
        </div>

        {/* Climate Subset Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-hydro-muted">Filter:</span>
          <select
            value={climate}
            onChange={(e) => setClimate(e.target.value)}
            className="bg-hydro-elevated border border-hydro-border rounded px-3 py-1.5 text-hydro-text outline-none cursor-pointer"
          >
            <option value="">All Climates</option>
            <option value="Mediterranean">Mediterranean</option>
            <option value="Continental">Continental</option>
            <option value="Subtropical">Subtropical</option>
            <option value="Alpine">Alpine</option>
            <option value="Oceanic">Oceanic</option>
          </select>
        </div>
      </div>

      {/* Regression & Correlation Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[10px] font-mono text-hydro-muted uppercase">
            Sample Size (n)
          </div>
          <div className="text-xl font-bold font-mono text-hydro-text mt-1">
            {data?.n || 0} events
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[10px] font-mono text-hydro-muted uppercase">
            Pearson r
          </div>
          <div className="text-xl font-bold font-mono text-[#46B5F5] mt-1">
            {data?.pearson_r !== null && data?.pearson_r !== undefined
              ? data.pearson_r
              : "N/A"}
          </div>
          <div className="text-[10px] text-hydro-muted mt-0.5">
            p ={" "}
            {data?.pearson_p !== null && data?.pearson_p !== undefined
              ? data.pearson_p.toExponential(2)
              : "N/A"}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[10px] font-mono text-hydro-muted uppercase">
            Spearman &rho;
          </div>
          <div className="text-xl font-bold font-mono text-[#2DD4BF] mt-1">
            {data?.spearman_rho !== null && data?.spearman_rho !== undefined
              ? data.spearman_rho
              : "N/A"}
          </div>
          <div className="text-[10px] text-hydro-muted mt-0.5">
            Rank Correlation
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[10px] font-mono text-hydro-muted uppercase">
            Linear Fit R²
          </div>
          <div className="text-xl font-bold font-mono text-[#E3BD69] mt-1">
            {linearFit?.r_squared !== null && linearFit?.r_squared !== undefined
              ? linearFit.r_squared
              : "N/A"}
          </div>
          <div className="text-[10px] text-hydro-muted mt-0.5">
            slope = {linearFit?.slope}
          </div>
        </div>
      </div>

      {/* Interactive Scatter & Linear Fit Visualization */}
      <div className="rounded-lg border border-hydro-border bg-hydro-surface p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-hydro-border">
          <span className="text-xs font-bold uppercase tracking-wider text-hydro-text">
            Bivariate Scatterplot & Linear Empirical Fit
          </span>
          <span className="text-xs text-hydro-muted font-mono">
            {scatterPoints.length} events plotted
          </span>
        </div>
        <RelationshipScatterPlot
          points={scatterPoints}
          linearFit={linearFit}
          xLabel={xLabel}
          yLabel={yLabel}
          logX={logX}
          logY={logY}
          height={320}
        />
      </div>

      {/* Binned Decile Trend Table */}
      <div className="rounded-lg border border-hydro-border bg-hydro-surface overflow-hidden">
        <div className="p-3 border-b border-hydro-border flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-hydro-text">
            Binned Quantile Distribution ({xVar} &rarr; {yVar})
          </span>
          <span className="text-xs text-hydro-muted font-mono">
            Median and Interquartile Ranges across 10 deciles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-hydro-border bg-hydro-elevated/40 text-[11px] text-hydro-muted">
                <th className="py-2.5 px-3">Bin Bin Center ({xVar})</th>
                <th className="py-2.5 px-3 text-right">Event Count</th>
                <th className="py-2.5 px-3 text-right">Median ({yVar})</th>
                <th className="py-2.5 px-3 text-right">Q25</th>
                <th className="py-2.5 px-3 text-right">Q75</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hydro-border/40">
              {binnedSummary.map((b: any, i: number) => (
                <tr
                  key={i}
                  className="hover:bg-hydro-elevated/40 transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-hydro-text">
                    {b.x_center}
                  </td>
                  <td className="py-2.5 px-3 text-right text-hydro-muted">
                    {b.count}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#2DD4BF]">
                    {b.y_median}
                  </td>
                  <td className="py-2.5 px-3 text-right text-hydro-muted">
                    {b.y_q25}
                  </td>
                  <td className="py-2.5 px-3 text-right text-hydro-muted">
                    {b.y_q75}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scientific Cautionary Notice */}
      <div className="p-3 rounded bg-hydro-surface border border-hydro-border text-xs text-hydro-muted flex items-start gap-2.5">
        <Info className="w-4 h-4 text-hydro-streamflow flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-hydro-text">
            Scientific Inference Principle:
          </strong>{" "}
          Statistical correlation indicates empirical association across
          catchments, not direct hydrological causality. Local antecedent
          storage, lithology, and catchment morphology interact non-linearly to
          govern runoff generation.
        </p>
      </div>
    </div>
  );
}
