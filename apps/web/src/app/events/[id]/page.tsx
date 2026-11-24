"use client";

import { MasterHydrograph } from "@/components/visualization/MasterHydrograph";
import { api } from "@/lib/api";
import { useWorkspaceStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Droplets,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function EventAnalysisStudioPage() {
  const params = useParams();
  const eventId = params.id as string;
  const {
    comparisonEventIds,
    addToComparison,
    removeFromComparison,
    unitMode,
    toggleUnitMode,
  } = useWorkspaceStore();

  const [activeBaseflowMethod, setActiveBaseflowMethod] =
    useState("lyne_hollick");

  // Fetch full event
  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => api.getEvent(eventId),
  });

  // Fetch similar events preview
  const { data: similarData } = useQuery({
    queryKey: ["similar", eventId],
    queryFn: () => api.getSimilarEvents(eventId, "contrasting_response"),
    enabled: !!event,
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-hydro-muted">
        Loading Event Analysis Studio...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-20 text-center font-mono text-xs text-hydro-flag">
        Event {eventId} not found.
      </div>
    );
  }

  const isCompared = comparisonEventIds.includes(eventId);
  const hydrograph = event.hydrograph || [];
  const similarMatches = similarData?.matches || [];

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-hydro-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-hydro-elevated text-hydro-streamflow font-semibold">
              Event Studio
            </span>
            <span className="text-xs text-hydro-muted font-mono">
              {event.dataset} • {event.event_id}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-hydro-text">
            {event.catchment_name}
          </h1>
          <div className="text-xs text-hydro-muted font-mono mt-1 flex flex-wrap items-center gap-3">
            <span>{event.country}</span>
            <span>•</span>
            <span>{event.climate_zone}</span>
            <span>•</span>
            <span>Drainage: {event.area_km2?.toLocaleString()} km²</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() =>
              isCompared
                ? removeFromComparison(eventId)
                : addToComparison(eventId)
            }
            className={`px-3 py-2 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isCompared
                ? "bg-hydro-selected text-slate-950 shadow"
                : "bg-hydro-surface hover:bg-hydro-elevated border border-hydro-border text-hydro-text"
            }`}
          >
            {isCompared ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {isCompared ? "In Comparison" : "Add to Compare"}
          </button>

          <Link
            href={`/similarity?target_id=${eventId}`}
            className="px-3.5 py-2 rounded bg-[#5C82FF] hover:bg-[#4b70ed] text-white text-xs font-semibold flex items-center gap-1.5 shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Find Similar Storms
          </Link>
        </div>
      </div>

      {/* Main Master Hydrograph Canvas */}
      <div className="space-y-2">
        <MasterHydrograph
          data={hydrograph}
          catchmentAreaKm2={event.area_km2}
          height={440}
          unitMode={unitMode}
          title={`Hydrograph: ${event.catchment_name} (${event.precip_start_date} to ${event.response_end_date})`}
        />
      </div>

      {/* Event Anatomy & Scientific Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Precipitation Anatomy */}
        <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-hydro-border/60">
            <Droplets className="w-4 h-4 text-[#5C82FF]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-hydro-text">
              1. Precipitation Episode
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Total Rainfall Depth:</span>
              <span className="font-mono font-bold text-[#5C82FF]">
                {event.precip_total_mm?.toFixed(1)} mm
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Maximum Daily Rainfall:</span>
              <span className="font-mono text-hydro-text">
                {event.precip_max_daily_mm?.toFixed(1)} mm/day
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Event Duration:</span>
              <span className="font-mono text-hydro-text">
                {event.precip_duration_days} days
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Wet Days (P &ge; 1mm):</span>
              <span className="font-mono text-hydro-text">
                {event.precip_wet_days} days
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">
                Antecedent Precip (7-day):
              </span>
              <span className="font-mono text-hydro-text">
                {event.antecedent_precip_7d_mm?.toFixed(1)} mm
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-hydro-muted">
                Storm Onset &rarr; Peak Rain:
              </span>
              <span className="font-mono text-hydro-text">
                {event.precip_start_date} &rarr; {event.peak_precip_date}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Streamflow Response Anatomy */}
        <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-hydro-border/60">
            <TrendingUp className="w-4 h-4 text-[#46B5F5]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-hydro-text">
              2. Streamflow Response
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Peak Observed Discharge:</span>
              <span className="font-mono font-bold text-[#46B5F5]">
                {event.peak_discharge_mm_day?.toFixed(2)} mm/day
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Antecedent Streamflow:</span>
              <span className="font-mono text-hydro-text">
                {event.antecedent_discharge_mm_day?.toFixed(3)} mm/day
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Direct Runoff Depth:</span>
              <span className="font-mono font-bold text-[#2DD4BF]">
                {event.direct_runoff_depth_mm?.toFixed(1)} mm
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">
                Estimated Baseflow Depth:
              </span>
              <span className="font-mono text-[#E3BD69]">
                {event.baseflow_depth_mm?.toFixed(1)} mm
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Rising / Falling Limb:</span>
              <span className="font-mono text-hydro-text">
                {event.rising_limb_days}d rise / {event.falling_limb_days}d fall
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-hydro-muted">
                Peak Rain &rarr; Peak Flow Lag:
              </span>
              <span className="font-mono font-bold text-[#E3BD69]">
                {event.lag_peak_to_peak_days} days
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Response Efficiency & Recession */}
        <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-hydro-border/60">
            <Clock className="w-4 h-4 text-[#2DD4BF]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-hydro-text">
              3. Efficiency &amp; Recession
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Direct Runoff Ratio:</span>
              <span className="font-mono font-extrabold text-[#2DD4BF] text-sm">
                {event.direct_runoff_ratio?.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Total Runoff Ratio:</span>
              <span className="font-mono text-hydro-text">
                {event.total_runoff_ratio?.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Recession Decay (k):</span>
              <span className="font-mono text-hydro-text">
                {event.recession_k
                  ? `${event.recession_k.toFixed(3)} day⁻¹`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">E-folding Time (&tau;):</span>
              <span className="font-mono text-hydro-text">
                {event.recession_tau_days
                  ? `${event.recession_tau_days.toFixed(1)} days`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-hydro-border/30">
              <span className="text-hydro-muted">Recession Fit R²:</span>
              <span className="font-mono text-hydro-text">
                {event.recession_r2 ? event.recession_r2.toFixed(3) : "N/A"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-hydro-muted">Quality Flag:</span>
              <span className="font-semibold text-emerald-400">
                Accepted Event
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Rainfall Discovery Preview Banner */}
      {similarMatches.length > 0 && (
        <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-hydro-text flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-hydro-selected" />
                Comparable Rainfall Events Across Other Catchments
              </h3>
              <p className="text-[11px] text-hydro-muted mt-0.5">
                Catchments receiving comparable rainfall depth (
                {event.precip_total_mm?.toFixed(0)} mm) but displaying
                contrasting streamflow responses.
              </p>
            </div>
            <Link
              href={`/similarity?target_id=${eventId}`}
              className="text-xs text-hydro-streamflow hover:underline flex items-center gap-1 font-semibold"
            >
              View Full Discovery Matrix
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {similarMatches.slice(0, 3).map((match: any) => (
              <div
                key={match.event_id}
                className="p-3 rounded bg-hydro-elevated/60 border border-hydro-border text-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-hydro-text">
                    {match.matched_catchment_name}
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-hydro-selected/20 text-hydro-selected font-mono font-bold">
                    {match.similarity_score.toFixed(0)}% match
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] tabular-nums font-mono">
                  <span className="text-hydro-muted">Rainfall:</span>
                  <span className="text-right text-[#5C82FF]">
                    {match.precipitation?.matched_total_mm} mm
                  </span>
                  <span className="text-hydro-muted">Runoff Ratio:</span>
                  <span className="text-right font-bold text-[#2DD4BF]">
                    {match.response_divergence?.matched_runoff_ratio}
                  </span>
                  <span className="text-hydro-muted">Response Lag:</span>
                  <span className="text-right text-[#E3BD69]">
                    {match.response_divergence?.matched_lag_days} d
                  </span>
                </div>

                <div className="pt-2 border-t border-hydro-border/40 flex items-center justify-between">
                  <span className="text-[10px] text-hydro-muted font-sans font-medium">
                    &Delta; Runoff Ratio:{" "}
                    <strong className="text-hydro-selected">
                      {match.response_divergence?.runoff_ratio_delta > 0
                        ? "+"
                        : ""}
                      {match.response_divergence?.runoff_ratio_delta?.toFixed(
                        3,
                      )}
                    </strong>
                  </span>
                  <Link
                    href={`/events/${match.event_id}`}
                    className="text-xs text-hydro-streamflow hover:underline flex items-center"
                  >
                    Inspect <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
