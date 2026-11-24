"use client";

import { FlowDurationCurve } from "@/components/visualization/FlowDurationCurve";
import { MasterHydrograph } from "@/components/visualization/MasterHydrograph";
import { MonthlyClimatologyChart } from "@/components/visualization/MonthlyClimatologyChart";
import { api } from "@/lib/api";
import { useWorkspaceStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  ChevronRight,
  Download,
  Plus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CatchmentProfilePage() {
  const params = useParams();
  const catchmentId = params.id as string;
  const { comparisonEventIds, addToComparison, removeFromComparison } =
    useWorkspaceStore();

  // Profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["catchment", catchmentId],
    queryFn: () => api.getCatchment(catchmentId),
  });

  // Observations
  const { data: obsData, isLoading: obsLoading } = useQuery({
    queryKey: ["catchment-obs", catchmentId],
    queryFn: () => api.getCatchmentObservations(catchmentId, 1500),
  });

  // Statistics (FDC & Climatology)
  const { data: statsData } = useQuery({
    queryKey: ["catchment-stats", catchmentId],
    queryFn: () => api.getCatchmentStatistics(catchmentId),
  });

  // Detected events
  const { data: eventsData } = useQuery({
    queryKey: ["catchment-events", catchmentId],
    queryFn: () => api.getCatchmentEvents(catchmentId),
  });

  if (profileLoading) {
    return (
      <div className="py-20 text-center text-xs font-mono text-hydro-muted">
        Loading scientific catchment profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center text-xs font-mono text-hydro-flag">
        Catchment {catchmentId} not found in index.
      </div>
    );
  }

  const events = eventsData?.events || [];
  const observations = obsData?.observations || [];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-hydro-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-hydro-elevated text-hydro-streamflow font-semibold">
              {profile.dataset || "Caravan v1.6"} •{" "}
              {profile.sub_dataset || "camels"}
            </span>
            <span className="text-xs text-hydro-muted">
              Gauge ID: {profile.gauge_id}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-hydro-text">
            {profile.gauge_name}
          </h1>
          <div className="text-xs text-hydro-muted font-mono mt-1 flex flex-wrap items-center gap-3">
            <span>{profile.country}</span>
            <span>•</span>
            <span>
              Lat: {profile.latitude?.toFixed(4)}°, Lon:{" "}
              {profile.longitude?.toFixed(4)}°
            </span>
            <span>•</span>
            <span>{profile.area_km2?.toLocaleString()} km²</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/events?catchment_id=${catchmentId}`}
            className="px-3.5 py-2 rounded bg-hydro-surface hover:bg-hydro-elevated border border-hydro-border text-xs font-medium text-hydro-text flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[#5C82FF]" />
            Browse {events.length} Events
          </Link>
          <a
            href={`/api/v1/exports/events?catchment_id=${catchmentId}&format=csv`}
            className="px-3.5 py-2 rounded bg-hydro-elevated hover:bg-hydro-border border border-hydro-border text-xs font-medium text-hydro-muted hover:text-hydro-text flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Environmental Context Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[10px] font-mono text-hydro-muted uppercase">
            Drainage Basin Area
          </div>
          <div className="text-base font-bold font-mono text-hydro-text mt-1">
            {profile.area_km2?.toLocaleString()} km²
          </div>
        </div>

        <div className="p-3 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[10px] font-mono text-hydro-muted uppercase">
            Mean Elevation
          </div>
          <div className="text-base font-bold font-mono text-hydro-text mt-1">
            {profile.elevation_m} m
          </div>
        </div>

        <div className="p-3 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[10px] font-mono text-hydro-muted uppercase">
            Mean Slope
          </div>
          <div className="text-base font-bold font-mono text-hydro-text mt-1">
            {profile.slope_m_per_km} m/km
          </div>
        </div>

        <div className="p-3 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[10px] font-mono text-hydro-muted uppercase">
            Climate Regime
          </div>
          <div
            className="text-xs font-semibold text-hydro-streamflow mt-1.5 truncate"
            title={profile.climate_zone}
          >
            {profile.climate_zone}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[10px] font-mono text-hydro-muted uppercase">
            Aridity Index
          </div>
          <div className="text-base font-bold font-mono text-hydro-text mt-1">
            {profile.aridity_index}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-hydro-surface border border-hydro-border">
          <div className="text-[10px] font-mono text-hydro-muted uppercase">
            Median Runoff Ratio
          </div>
          <div className="text-base font-bold font-mono text-[#2DD4BF] mt-1">
            {profile.median_runoff_ratio
              ? profile.median_runoff_ratio.toFixed(3)
              : "—"}
          </div>
        </div>
      </div>

      {/* Continuous Multi-Year Hydrological Time Series */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-hydro-text flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-hydro-streamflow" />
            Continuous Precipitation &amp; Streamflow Timeline (Daily)
          </h2>
          <span className="text-xs text-hydro-muted font-mono">
            {observations.length} daily records
          </span>
        </div>

        {observations.length > 0 && (
          <MasterHydrograph
            data={observations}
            catchmentAreaKm2={profile.area_km2}
            height={360}
            title={`${profile.gauge_name} Continuous Record`}
          />
        )}
      </div>

      {/* Flow Duration Curve and Monthly Climatology Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow Duration Curve */}
        <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-hydro-border/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-hydro-text">
              Flow Duration Curve (FDC)
            </h3>
            <span className="text-[11px] font-mono text-hydro-muted">
              Log Q Exceedance
            </span>
          </div>
          {statsData?.fdc && (
            <FlowDurationCurve data={statsData.fdc} height={240} />
          )}
        </div>

        {/* Monthly Climatology */}
        <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-hydro-border/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-hydro-text">
              Monthly Precipitation &amp; Runoff Climatology
            </h3>
            <span className="text-[11px] font-mono text-hydro-muted">
              Seasonality
            </span>
          </div>
          {statsData?.monthly_climatology && (
            <MonthlyClimatologyChart
              data={statsData.monthly_climatology}
              height={240}
            />
          )}
        </div>
      </div>

      {/* Detected Events in this Catchment */}
      <div className="rounded-lg border border-hydro-border bg-hydro-surface overflow-hidden">
        <div className="p-3 border-b border-hydro-border flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-hydro-text">
            Historical Rainfall-Runoff Events ({events.length})
          </span>
          <span className="text-xs text-hydro-muted">
            Click to analyze in Studio or add to comparison
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-hydro-border bg-hydro-elevated/40 text-[11px] font-mono text-hydro-muted">
                <th className="py-2.5 px-3">Start Date</th>
                <th className="py-2.5 px-3 text-right">Rainfall (mm)</th>
                <th className="py-2.5 px-3 text-right">Max Daily (mm)</th>
                <th className="py-2.5 px-3 text-right">Duration</th>
                <th className="py-2.5 px-3 text-right">Peak Flow (mm/d)</th>
                <th className="py-2.5 px-3 text-right">Runoff Ratio</th>
                <th className="py-2.5 px-3 text-right">Lag</th>
                <th className="py-2.5 px-3 text-center">Quality</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hydro-border/40 font-mono">
              {events.slice(0, 25).map((ev: any) => {
                const isCompared = comparisonEventIds.includes(ev.event_id);
                return (
                  <tr
                    key={ev.event_id}
                    className="hover:bg-hydro-elevated/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-hydro-text font-semibold">
                      {ev.precip_start_date}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#5C82FF] font-semibold">
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
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        Valid
                      </span>
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
                        title="Analyze in Event Studio"
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
      </div>
    </div>
  );
}
