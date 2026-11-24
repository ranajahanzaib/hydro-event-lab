"use client";

import { CatchmentMap } from "@/components/map/CatchmentMap";
import { MasterHydrograph } from "@/components/visualization/MasterHydrograph";
import { api } from "@/lib/api";
import { useWorkspaceStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronRight,
  Compass,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function OverviewPage() {
  const { selectedCatchmentId, setSelectedCatchmentId, setSelectedEventId } =
    useWorkspaceStore();
  const [activeMetric, setActiveMetric] = useState("direct_runoff_ratio");

  // Fetch overview statistics
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: api.getOverview,
  });

  // Fetch catchments
  const { data: catchmentsData } = useQuery({
    queryKey: ["catchments"],
    queryFn: () => api.getCatchments({ limit: 100 }),
  });

  // Fetch selected catchment profile
  const activeCid =
    selectedCatchmentId || catchmentsData?.catchments?.[0]?.catchment_id;
  const { data: catchmentProfile } = useQuery({
    queryKey: ["catchment", activeCid],
    queryFn: () => api.getCatchment(activeCid!),
    enabled: !!activeCid,
  });

  // Fetch events for selected catchment
  const { data: catchmentEvents } = useQuery({
    queryKey: ["catchment-events", activeCid],
    queryFn: () => api.getCatchmentEvents(activeCid!),
    enabled: !!activeCid,
  });

  // Featured benchmark event for preview
  const featuredEvent = catchmentEvents?.events?.[0];
  const { data: featuredEventDetail } = useQuery({
    queryKey: ["event", featuredEvent?.event_id],
    queryFn: () => api.getEvent(featuredEvent!.event_id),
    enabled: !!featuredEvent?.event_id,
  });

  const catchments = catchmentsData?.catchments || [];

  return (
    <div className="space-y-6">
      {/* Platform Scientific Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-hydro-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-hydro-streamflow uppercase tracking-wider">
              Comparative Hydrology Research Platform
            </span>
            <span className="w-1 h-1 rounded-full bg-hydro-muted" />
            <span className="text-xs text-hydro-muted">
              Caravan v1.6 &amp; GRDC-Caravan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-hydro-text tracking-tight">
            Every catchment responds differently.
          </h1>
          <p className="text-sm text-hydro-muted mt-1 max-w-3xl leading-relaxed">
            Investigate why catchments receiving similar rainfall produce
            drastically different streamflow responses. Explore thousands of
            historical daily rainfall-runoff events across global climate
            regimes.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/similarity"
            className="px-3.5 py-2 rounded-md bg-hydro-surface hover:bg-hydro-elevated border border-hydro-border text-xs font-medium text-hydro-text flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-hydro-selected" />
            Similar Rainfall Search
          </Link>
          <Link
            href="/explore"
            className="px-3.5 py-2 rounded-md bg-[#46B5F5] hover:bg-[#389ed6] text-xs font-semibold text-slate-950 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" />
            Launch Explorer
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* Key Analytical Index Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[11px] font-mono text-hydro-muted uppercase">
            Indexed Catchments
          </div>
          <div className="text-xl font-bold font-mono text-hydro-text mt-1">
            {overviewLoading ? "..." : overview?.catchment_count || 8}
          </div>
          <div className="text-[10px] text-hydro-muted mt-0.5">
            8 Global Benchmarks
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[11px] font-mono text-hydro-muted uppercase">
            Detected Events
          </div>
          <div className="text-xl font-bold font-mono text-[#5C82FF] mt-1">
            {overviewLoading ? "..." : overview?.event_count || 487}
          </div>
          <div className="text-[10px] text-hydro-muted mt-0.5">
            Algorithm v1.0.0
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[11px] font-mono text-hydro-muted uppercase">
            Coverage Period
          </div>
          <div className="text-sm font-bold font-mono text-hydro-text mt-1.5">
            2018 — 2022
          </div>
          <div className="text-[10px] text-hydro-muted mt-0.5">
            5 Continuous Years
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[11px] font-mono text-hydro-muted uppercase">
            Median Runoff Ratio
          </div>
          <div className="text-xl font-bold font-mono text-[#2DD4BF] mt-1">
            {overview?.hydrology_summary?.median_runoff_ratio?.toFixed(3) ||
              "0.284"}
          </div>
          <div className="text-[10px] text-hydro-muted mt-0.5">
            Direct runoff / rainfall
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[11px] font-mono text-hydro-muted uppercase">
            Median Response Lag
          </div>
          <div className="text-xl font-bold font-mono text-[#E3BD69] mt-1">
            {overview?.hydrology_summary?.median_lag_days || 1} day
          </div>
          <div className="text-[10px] text-hydro-muted mt-0.5">
            Peak rain to peak flow
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[11px] font-mono text-hydro-muted uppercase">
            Data Resolution
          </div>
          <div className="text-sm font-bold font-mono text-hydro-streamflow mt-1.5">
            Daily (24h)
          </div>
          <div className="text-[10px] text-hydro-muted mt-0.5">
            mm/day &amp; m³/s
          </div>
        </div>
      </div>

      {/* Main Research Atlas & Selected Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Global Catchment Map */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-hydro-text flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#46B5F5]" />
              Global Catchment Atlas
            </h2>
            <div className="text-xs text-hydro-muted flex items-center gap-2">
              <span>Click catchment to inspect</span>
            </div>
          </div>

          <CatchmentMap
            catchments={catchments}
            selectedCatchmentId={activeCid}
            onSelectCatchment={(id) => setSelectedCatchmentId(id)}
            height="460px"
            activeMetric={activeMetric}
            onMetricChange={setActiveMetric}
          />
        </div>

        {/* Right: Selected Catchment Quick Inspector */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border h-full flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-hydro-elevated text-hydro-streamflow font-semibold">
                    {catchmentProfile?.dataset || "Caravan v1.6"}
                  </span>
                  <h3 className="text-base font-bold text-hydro-text mt-1.5">
                    {catchmentProfile?.gauge_name ||
                      "Smith River near Crescent City, CA"}
                  </h3>
                  <div className="text-xs text-hydro-muted font-mono mt-0.5">
                    {catchmentProfile?.country || "United States"} • {activeCid}
                  </div>
                </div>
              </div>

              {/* Catchment Environmental Context Matrix */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs tabular-nums">
                <div className="p-2 rounded bg-hydro-elevated/60 border border-hydro-border/40">
                  <div className="text-[10px] text-hydro-muted">
                    Drainage Area
                  </div>
                  <div className="font-mono font-semibold text-hydro-text mt-0.5">
                    {catchmentProfile?.area_km2?.toLocaleString() || "1,589.5"}{" "}
                    km²
                  </div>
                </div>

                <div className="p-2 rounded bg-hydro-elevated/60 border border-hydro-border/40">
                  <div className="text-[10px] text-hydro-muted">
                    Mean Elevation
                  </div>
                  <div className="font-mono font-semibold text-hydro-text mt-0.5">
                    {catchmentProfile?.elevation_m || "612"} m
                  </div>
                </div>

                <div className="p-2 rounded bg-hydro-elevated/60 border border-hydro-border/40">
                  <div className="text-[10px] text-hydro-muted">
                    Climate Zone
                  </div>
                  <div
                    className="font-semibold text-hydro-streamflow mt-0.5 truncate"
                    title={catchmentProfile?.climate_zone}
                  >
                    {catchmentProfile?.climate_zone || "Mediterranean"}
                  </div>
                </div>

                <div className="p-2 rounded bg-hydro-elevated/60 border border-hydro-border/40">
                  <div className="text-[10px] text-hydro-muted">
                    Aridity Index
                  </div>
                  <div className="font-mono font-semibold text-hydro-text mt-0.5">
                    {catchmentProfile?.aridity_index || "0.34"} (Humid)
                  </div>
                </div>

                <div className="p-2 rounded bg-hydro-elevated/60 border border-hydro-border/40">
                  <div className="text-[10px] text-hydro-muted">
                    Median Runoff Ratio
                  </div>
                  <div className="font-mono font-bold text-[#2DD4BF] mt-0.5">
                    {catchmentProfile?.median_runoff_ratio || "0.412"}
                  </div>
                </div>

                <div className="p-2 rounded bg-hydro-elevated/60 border border-hydro-border/40">
                  <div className="text-[10px] text-hydro-muted">
                    Forest Cover
                  </div>
                  <div className="font-mono font-semibold text-hydro-text mt-0.5">
                    {(
                      (catchmentProfile?.forest_fraction || 0.94) * 100
                    ).toFixed(0)}
                    %
                  </div>
                </div>
              </div>

              {/* Event count notice */}
              <div className="mt-4 p-2.5 rounded bg-hydro-bg border border-hydro-border/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-hydro-muted">
                    Identified Historical Events:
                  </span>
                  <span className="font-mono font-bold text-hydro-text">
                    {catchmentEvents?.total_events || 0} events
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Navigation Links */}
            <div className="pt-4 border-t border-hydro-border/60 flex flex-col gap-2 mt-4">
              <Link
                href={`/catchments/${activeCid}`}
                className="w-full py-2 px-3 rounded bg-[#46B5F5]/10 hover:bg-[#46B5F5]/20 border border-[#46B5F5]/40 text-xs font-semibold text-[#46B5F5] flex items-center justify-center gap-1.5 transition-colors"
              >
                Open Catchment Profile
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Event Master Hydrograph Preview */}
      {featuredEventDetail && (
        <div className="space-y-3 pt-4 border-t border-hydro-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-hydro-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-hydro-streamflow" />
                Featured Historical Rainfall-Runoff Event
              </h2>
              <p className="text-xs text-hydro-muted">
                {featuredEventDetail.catchment_name} • Storm onset:{" "}
                {featuredEventDetail.precip_start_date} • Peak discharge:{" "}
                {featuredEventDetail.peak_discharge_date}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/events/${featuredEventDetail.event_id}`}
                className="px-3 py-1.5 rounded bg-hydro-surface hover:bg-hydro-elevated border border-hydro-border text-xs font-semibold text-hydro-streamflow flex items-center gap-1 transition-colors"
              >
                Inspect in Studio
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <MasterHydrograph
            data={featuredEventDetail.hydrograph}
            catchmentAreaKm2={featuredEventDetail.area_km2}
            height={380}
            title={`${featuredEventDetail.catchment_name} (${featuredEventDetail.event_id})`}
          />
        </div>
      )}
    </div>
  );
}
