"use client";

import { api } from "@/lib/api";
import { useWorkspaceStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight, Droplets, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SimilarEventDiscoveryContent() {
  const searchParams = useSearchParams();
  const targetIdParam = searchParams.get("target_id");
  const { comparisonEventIds, addToComparison, removeFromComparison } =
    useWorkspaceStore();

  const [targetEventId, setTargetEventId] = useState(
    targetIdParam || "caravan_camels_11532500_20210127",
  );
  const [discoveryMode, setDiscoveryMode] = useState<string>(
    "contrasting_response",
  ); // "contrasting_response", "similar_response", "all"
  const [targetPrecipTotal, setTargetPrecipTotal] = useState(65);
  const [targetDuration, setTargetDuration] = useState(3);

  // Fetch benchmark target events for dropdown selection
  const { data: eventsList } = useQuery({
    queryKey: ["target-events-list"],
    queryFn: () => api.getEvents({ limit: 20, min_precip: 30 }),
  });

  // Query similarity
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["similarity-search", targetEventId, discoveryMode],
    queryFn: () =>
      api.searchSimilarity({
        target_event_id: targetEventId || undefined,
        discovery_mode: discoveryMode,
        min_similarity_score: 50.0,
        top_k: 12,
      }),
  });

  const matches = searchResults?.matches || [];
  const targetEvent = eventsList?.events?.find(
    (e: any) => e.event_id === targetEventId,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-hydro-border">
        <div>
          <div className="text-xs font-mono text-hydro-streamflow uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-hydro-selected" />
            Signature Research Tool
          </div>
          <h1 className="text-2xl font-bold text-hydro-text">
            Similar Event Discovery
          </h1>
          <p className="text-xs text-hydro-muted mt-0.5">
            Find rainfall events with comparable meteorological forcing and
            investigate why their streamflow responses diverge.
          </p>
        </div>

        {/* Discovery Mode Selector */}
        <div className="flex items-center gap-1 bg-hydro-surface p-1 rounded-lg border border-hydro-border text-xs">
          <button
            onClick={() => setDiscoveryMode("contrasting_response")}
            className={`px-3 py-1.5 rounded font-semibold transition-colors ${
              discoveryMode === "contrasting_response"
                ? "bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/40"
                : "text-hydro-muted hover:text-hydro-text"
            }`}
          >
            Similar Rainfall &bull; Different Response
          </button>
          <button
            onClick={() => setDiscoveryMode("similar_response")}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              discoveryMode === "similar_response"
                ? "bg-hydro-elevated text-hydro-streamflow border border-hydro-border"
                : "text-hydro-muted hover:text-hydro-text"
            }`}
          >
            Similar Response
          </button>
          <button
            onClick={() => setDiscoveryMode("all")}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              discoveryMode === "all"
                ? "bg-hydro-elevated text-hydro-text border border-hydro-border"
                : "text-hydro-muted hover:text-hydro-text"
            }`}
          >
            All Matches
          </button>
        </div>
      </div>

      {/* Target Storm Selection Bar */}
      <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[#5C82FF]" />
            <span className="font-bold text-hydro-text uppercase tracking-wider text-[11px]">
              Target Storm Event:
            </span>
            <select
              value={targetEventId}
              onChange={(e) => setTargetEventId(e.target.value)}
              className="bg-hydro-elevated border border-hydro-border rounded px-3 py-1.5 text-hydro-text outline-none cursor-pointer font-mono"
            >
              {eventsList?.events?.map((ev: any) => (
                <option key={ev.event_id} value={ev.event_id}>
                  {ev.catchment_name} — {ev.precip_start_date} (
                  {ev.precip_total_mm?.toFixed(0)} mm rain, RR:{" "}
                  {ev.direct_runoff_ratio?.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {targetEvent && (
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-hydro-muted">
              <span>
                Rainfall:{" "}
                <strong className="text-[#5C82FF]">
                  {targetEvent.precip_total_mm?.toFixed(1)} mm
                </strong>
              </span>
              <span>
                Runoff Ratio:{" "}
                <strong className="text-[#2DD4BF]">
                  {targetEvent.direct_runoff_ratio?.toFixed(3)}
                </strong>
              </span>
              <span>
                Lag:{" "}
                <strong className="text-[#E3BD69]">
                  {targetEvent.lag_peak_to_peak_days} d
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Discovery Results Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hydro-text flex items-center gap-2">
            Comparable Precipitation Events ({matches.length} Discovered)
          </h2>
          <span className="text-xs text-hydro-muted">
            Ranked by precipitation feature distance &amp; response divergence
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center font-mono text-xs text-hydro-muted">
            Computing multidimensional feature distances across historical
            events...
          </div>
        ) : matches.length === 0 ? (
          <div className="py-16 text-center font-mono text-xs text-hydro-muted bg-hydro-surface rounded-lg border border-hydro-border">
            No events matched the current tolerance criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match: any) => {
              const isCompared = comparisonEventIds.includes(match.event_id);
              const rrDelta = match.response_divergence?.runoff_ratio_delta;
              const isPositive = rrDelta >= 0;

              return (
                <div
                  key={match.event_id}
                  className="p-4 rounded-lg bg-hydro-surface border border-hydro-border hover:border-hydro-streamflow/50 transition-colors flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* Header: Catchment and Match Score */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-mono text-hydro-muted uppercase">
                          {match.matched_climate} &bull; {match.dataset}
                        </div>
                        <h3 className="text-sm font-bold text-hydro-text mt-0.5">
                          {match.matched_catchment_name}
                        </h3>
                        <div className="text-[11px] text-hydro-muted font-mono">
                          Date: {match.matched_date}
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#5C82FF]/20 text-[#5C82FF] border border-[#5C82FF]/30">
                        {match.similarity_score?.toFixed(0)}% sim
                      </span>
                    </div>

                    {/* Meteorological Similarity vs Hydrological Divergence */}
                    <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded bg-hydro-bg border border-hydro-border/40 text-xs tabular-nums font-mono">
                      <div>
                        <div className="text-[10px] text-hydro-muted">
                          Matched Rain
                        </div>
                        <div className="font-bold text-[#5C82FF]">
                          {match.precipitation?.matched_total_mm} mm
                        </div>
                        <div className="text-[10px] text-hydro-muted/80">
                          (&Delta;{" "}
                          {(
                            match.precipitation?.matched_total_mm -
                            match.precipitation?.target_total_mm
                          ).toFixed(1)}{" "}
                          mm)
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-hydro-muted">
                          Runoff Ratio
                        </div>
                        <div className="font-bold text-[#2DD4BF]">
                          {match.response_divergence?.matched_runoff_ratio}
                        </div>
                        <div
                          className={`text-[10px] font-bold ${isPositive ? "text-emerald-400" : "text-amber-400"}`}
                        >
                          (&Delta; {isPositive ? "+" : ""}
                          {rrDelta?.toFixed(3)})
                        </div>
                      </div>

                      <div className="mt-1">
                        <div className="text-[10px] text-hydro-muted">
                          Storm Duration
                        </div>
                        <div className="text-hydro-text">
                          {match.precipitation?.matched_duration_days} days
                        </div>
                      </div>

                      <div className="mt-1">
                        <div className="text-[10px] text-hydro-muted">
                          Response Lag
                        </div>
                        <div className="text-[#E3BD69] font-bold">
                          {match.response_divergence?.matched_lag_days} days
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-hydro-border/60 flex items-center justify-between text-xs">
                    <button
                      onClick={() =>
                        isCompared
                          ? removeFromComparison(match.event_id)
                          : addToComparison(match.event_id)
                      }
                      className={`px-2.5 py-1 rounded flex items-center gap-1 font-semibold transition-colors ${
                        isCompared
                          ? "bg-hydro-selected text-slate-950"
                          : "bg-hydro-elevated hover:bg-hydro-border text-hydro-muted hover:text-hydro-text"
                      }`}
                    >
                      {isCompared ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      {isCompared ? "In Comparison" : "Compare"}
                    </button>

                    <Link
                      href={`/events/${match.event_id}`}
                      className="text-hydro-streamflow hover:underline flex items-center gap-1 font-medium"
                    >
                      Analyze <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SimilarEventDiscoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center font-mono text-xs text-hydro-muted">
          Loading Similar Event Discovery...
        </div>
      }
    >
      <SimilarEventDiscoveryContent />
    </Suspense>
  );
}
