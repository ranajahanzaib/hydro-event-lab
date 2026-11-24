"use client";

import { CatchmentMap } from "@/components/map/CatchmentMap";
import { api } from "@/lib/api";
import { useWorkspaceStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function CatchmentExplorerPage() {
  const { selectedCatchmentId, setSelectedCatchmentId } = useWorkspaceStore();
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedClimate, setSelectedClimate] = useState<string>("");
  const [activeMetric, setActiveMetric] = useState("direct_runoff_ratio");

  const { data: catchmentsData, isLoading } = useQuery({
    queryKey: ["catchments", selectedCountry, selectedClimate, search],
    queryFn: () =>
      api.getCatchments({
        country: selectedCountry || undefined,
        climate: selectedClimate || undefined,
        search: search || undefined,
        limit: 100,
      }),
  });

  const catchments = useMemo(
    () => catchmentsData?.catchments || [],
    [catchmentsData],
  );

  // Extract unique countries and climate zones for filters
  const countries = useMemo(() => {
    return Array.from(new Set(catchments.map((c) => c.country)))
      .filter(Boolean)
      .sort();
  }, [catchments]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-hydro-border">
        <div>
          <div className="text-xs font-mono text-hydro-streamflow uppercase tracking-wider">
            Spatial Observatory
          </div>
          <h1 className="text-2xl font-bold text-hydro-text">
            Global Catchment Explorer
          </h1>
          <p className="text-xs text-hydro-muted mt-0.5">
            Explore global drainage basins, gauge coordinates, and
            catchment-aggregated hydrological characteristics.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-lg bg-hydro-surface border border-hydro-border flex flex-wrap items-center gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-hydro-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by river, gauge ID, or basin..."
            className="w-full pl-9 pr-3 py-1.5 rounded bg-hydro-elevated border border-hydro-border text-hydro-text placeholder:text-hydro-muted outline-none text-xs"
          />
        </div>

        {/* Country Filter */}
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="bg-hydro-elevated border border-hydro-border rounded px-3 py-1.5 text-hydro-text outline-none text-xs cursor-pointer"
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Climate Filter */}
        <select
          value={selectedClimate}
          onChange={(e) => setSelectedClimate(e.target.value)}
          className="bg-hydro-elevated border border-hydro-border rounded px-3 py-1.5 text-hydro-text outline-none text-xs cursor-pointer"
        >
          <option value="">All Climate Regimes</option>
          <option value="Continental">Continental</option>
          <option value="Mediterranean">Mediterranean</option>
          <option value="Subtropical">Subtropical</option>
          <option value="Alpine">Alpine</option>
          <option value="Oceanic">Oceanic / Maritime</option>
        </select>

        <div className="text-xs text-hydro-muted font-mono ml-auto">
          {catchments.length} catchments found
        </div>
      </div>

      {/* Map Atlas */}
      <CatchmentMap
        catchments={catchments}
        selectedCatchmentId={selectedCatchmentId}
        onSelectCatchment={(id) => setSelectedCatchmentId(id)}
        height="500px"
        activeMetric={activeMetric}
        onMetricChange={setActiveMetric}
      />

      {/* Catchments Table */}
      <div className="rounded-lg border border-hydro-border bg-hydro-surface overflow-hidden">
        <div className="p-3 border-b border-hydro-border flex items-center justify-between">
          <span className="text-xs font-bold text-hydro-text uppercase tracking-wider">
            Indexed Catchments Catalog
          </span>
          <span className="text-xs text-hydro-muted font-mono">
            Click row to view profile
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-hydro-border bg-hydro-elevated/40 text-[11px] font-mono text-hydro-muted">
                <th className="py-2.5 px-3">Catchment / Gauge Name</th>
                <th className="py-2.5 px-3">Gauge ID</th>
                <th className="py-2.5 px-3">Country</th>
                <th className="py-2.5 px-3">Climate Regime</th>
                <th className="py-2.5 px-3 text-right">Area (km²)</th>
                <th className="py-2.5 px-3 text-right">Elevation (m)</th>
                <th className="py-2.5 px-3 text-right">Runoff Ratio</th>
                <th className="py-2.5 px-3 text-right">Response Lag</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hydro-border/40 font-mono">
              {catchments.map((c) => {
                const isSelected = c.catchment_id === selectedCatchmentId;
                return (
                  <tr
                    key={c.catchment_id}
                    onClick={() => setSelectedCatchmentId(c.catchment_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-hydro-selected/10 text-hydro-selected"
                        : "hover:bg-hydro-elevated/40"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans font-semibold text-hydro-text flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? "bg-hydro-selected"
                            : "bg-hydro-streamflow"
                        }`}
                      />
                      {c.gauge_name}
                    </td>
                    <td className="py-2.5 px-3 text-hydro-muted">
                      {c.gauge_id}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-hydro-text">
                      {c.country}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-hydro-streamflow">
                      {c.climate_zone}
                    </td>
                    <td className="py-2.5 px-3 text-right text-hydro-text">
                      {c.area_km2?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-hydro-muted">
                      {c.elevation_m}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#2DD4BF]">
                      {c.median_runoff_ratio
                        ? c.median_runoff_ratio.toFixed(3)
                        : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#E3BD69]">
                      {c.median_lag_days !== null
                        ? `${c.median_lag_days} d`
                        : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/catchments/${c.catchment_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded hover:bg-hydro-elevated text-hydro-streamflow inline-flex items-center gap-1"
                        title="Open Research Profile"
                      >
                        Profile
                        <ChevronRight className="w-3 h-3" />
                      </Link>
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
