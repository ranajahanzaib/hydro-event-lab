"use client";

import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Play, Sliders } from "lucide-react";
import { useState } from "react";

export default function EventDetectionWorkbenchPage() {
  const [catchmentId, setCatchmentId] = useState("camels_11532500");
  const [wetDayThreshold, setWetDayThreshold] = useState(1.0);
  const [minPrecip, setMinPrecip] = useState(10.0);
  const [dryGap, setDryGap] = useState(1);
  const [antWindow, setAntWindow] = useState(7);
  const [respWindow, setRespWindow] = useState(7);
  const [baseflowMethod, setBaseflowMethod] = useState("lyne_hollick");
  const [alpha, setAlpha] = useState(0.925);
  const [bfiMax, setBfiMax] = useState(0.8);

  // Fetch available catchments
  const { data: catchmentsData } = useQuery({
    queryKey: ["catchments-list"],
    queryFn: () => api.getCatchments({ limit: 50 }),
  });

  // Detection mutation
  const detectMutation = useMutation({
    mutationFn: (payload: any) => api.detectEvents(payload),
  });

  const handleRunDetection = () => {
    detectMutation.mutate({
      catchment_id: catchmentId,
      wet_day_threshold_mm: wetDayThreshold,
      min_event_precip_mm: minPrecip,
      max_intervening_dry_gap_days: dryGap,
      antecedent_window_days: antWindow,
      post_rainfall_window_days: respWindow,
      baseflow_method: baseflowMethod,
      baseflow_alpha: alpha,
      baseflow_bfi_max: bfiMax,
    });
  };

  const results = detectMutation.data;
  const catchments = catchmentsData?.catchments || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-hydro-border">
        <div>
          <div className="text-xs font-mono text-hydro-streamflow uppercase tracking-wider">
            Hydrological Algorithm Workbench
          </div>
          <h1 className="text-2xl font-bold text-hydro-text">
            Event Detection Workbench
          </h1>
          <p className="text-xs text-hydro-muted mt-0.5">
            Modify mathematical thresholds, adjust baseflow separation
            parameters, and execute live recalculations against continuous
            observations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Configuration Panel */}
        <div className="lg:col-span-5 p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-hydro-border/60">
            <span className="font-bold uppercase tracking-wider text-hydro-text flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-hydro-streamflow" />
              Detection Parameters
            </span>
            <span className="font-mono text-hydro-muted text-[11px]">
              v1.0.0
            </span>
          </div>

          {/* Catchment Selector */}
          <div className="space-y-1">
            <label className="text-hydro-muted font-medium">
              Target Catchment:
            </label>
            <select
              value={catchmentId}
              onChange={(e) => setCatchmentId(e.target.value)}
              className="w-full bg-hydro-elevated border border-hydro-border rounded px-3 py-1.5 text-hydro-text outline-none cursor-pointer font-sans"
            >
              {catchments.map((c: any) => (
                <option key={c.catchment_id} value={c.catchment_id}>
                  {c.gauge_name} ({c.country})
                </option>
              ))}
            </select>
          </div>

          {/* Wet Day Threshold */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-hydro-muted">
                Wet-Day Precipitation Threshold:
              </span>
              <span className="font-mono font-bold text-[#5C82FF]">
                {wetDayThreshold} mm/day
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={wetDayThreshold}
              onChange={(e) => setWetDayThreshold(parseFloat(e.target.value))}
              className="w-full accent-hydro-streamflow cursor-pointer"
            />
            <div className="text-[10px] text-hydro-muted">
              Minimum rainfall to mark a day as meteorologically wet.
            </div>
          </div>

          {/* Min Event Accumulation */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-hydro-muted">
                Minimum Event Accumulation:
              </span>
              <span className="font-mono font-bold text-[#5C82FF]">
                {minPrecip} mm
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              value={minPrecip}
              onChange={(e) => setMinPrecip(parseFloat(e.target.value))}
              className="w-full accent-hydro-streamflow cursor-pointer"
            />
            <div className="text-[10px] text-hydro-muted">
              Filter out minor precipitation pulses without hydrological
              significance.
            </div>
          </div>

          {/* Intervening Dry Gap */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-hydro-muted">Dry-Gap Tolerance:</span>
              <span className="font-mono font-bold text-hydro-text">
                {dryGap} day(s)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={dryGap}
              onChange={(e) => setDryGap(parseInt(e.target.value))}
              className="w-full accent-hydro-streamflow cursor-pointer"
            />
            <div className="text-[10px] text-hydro-muted">
              Permissible dry gap days before splitting into a distinct storm.
            </div>
          </div>

          {/* Response Search Window */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-hydro-muted">
                Post-Rainfall Response Window:
              </span>
              <span className="font-mono font-bold text-[#E3BD69]">
                {respWindow} days
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="14"
              step="1"
              value={respWindow}
              onChange={(e) => setRespWindow(parseInt(e.target.value))}
              className="w-full accent-hydro-streamflow cursor-pointer"
            />
            <div className="text-[10px] text-hydro-muted">
              Window following storm end to detect peak discharge crest.
            </div>
          </div>

          {/* Baseflow Method */}
          <div className="space-y-1 pt-2 border-t border-hydro-border/40">
            <label className="text-hydro-muted font-medium">
              Baseflow Separation Method:
            </label>
            <select
              value={baseflowMethod}
              onChange={(e) => setBaseflowMethod(e.target.value)}
              className="w-full bg-hydro-elevated border border-hydro-border rounded px-3 py-1.5 text-hydro-text outline-none cursor-pointer"
            >
              <option value="lyne_hollick">
                Lyne &amp; Hollick (Digital Recursive Filter)
              </option>
              <option value="eckhardt">
                Eckhardt (Two-Parameter Recursive Filter)
              </option>
              <option value="constant_baseline">
                Constant Pre-Event Baseline
              </option>
            </select>
          </div>

          {/* Baseflow Alpha */}
          {baseflowMethod !== "constant_baseline" && (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-hydro-muted">
                  Recession Parameter (&alpha;):
                </span>
                <span className="font-mono font-bold text-[#E3BD69]">
                  {alpha}
                </span>
              </div>
              <input
                type="range"
                min="0.900"
                max="0.990"
                step="0.005"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full accent-hydro-streamflow cursor-pointer"
              />
            </div>
          )}

          {/* Run Button */}
          <button
            onClick={handleRunDetection}
            disabled={detectMutation.isPending}
            className="w-full py-2.5 rounded bg-[#46B5F5] hover:bg-[#389ed6] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {detectMutation.isPending
              ? "Executing Backend Detection..."
              : "Run Detection Algorithm"}
          </button>
        </div>

        {/* Right Column: Execution Results and Preview */}
        <div className="lg:col-span-7 space-y-4">
          {results ? (
            <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-hydro-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-hydro-text flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Detection Execution Summary
                </span>
                <span className="text-xs font-mono text-hydro-muted">
                  {results.total_detected} total events
                </span>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded bg-hydro-elevated border border-hydro-border">
                  <div className="text-[10px] font-mono text-hydro-muted uppercase">
                    Accepted Events
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {results.accepted_count}
                  </div>
                </div>

                <div className="p-3 rounded bg-hydro-elevated border border-hydro-border">
                  <div className="text-[10px] font-mono text-hydro-muted uppercase">
                    Candidate Responses
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {results.candidate_count}
                  </div>
                </div>

                <div className="p-3 rounded bg-hydro-elevated border border-hydro-border">
                  <div className="text-[10px] font-mono text-hydro-muted uppercase">
                    Rainfall Only
                  </div>
                  <div className="text-xl font-bold font-mono text-hydro-muted mt-1">
                    {results.rainfall_only_count}
                  </div>
                </div>
              </div>

              {/* Results Event Table */}
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-hydro-border text-[11px] font-mono text-hydro-muted bg-hydro-bg">
                      <th className="py-2 px-2.5">Onset Date</th>
                      <th className="py-2 px-2.5 text-right">Rain (mm)</th>
                      <th className="py-2 px-2.5 text-right">
                        Peak Flow (mm/d)
                      </th>
                      <th className="py-2 px-2.5 text-right">Runoff Ratio</th>
                      <th className="py-2 px-2.5 text-right">Lag (d)</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hydro-border/40 font-mono text-xs">
                    {results.events.slice(0, 30).map((ev: any) => (
                      <tr
                        key={ev.event_id}
                        className="hover:bg-hydro-elevated/40"
                      >
                        <td className="py-2 px-2.5 font-semibold text-hydro-text">
                          {ev.precip_start_date}
                        </td>
                        <td className="py-2 px-2.5 text-right text-[#5C82FF]">
                          {ev.metrics?.precip_total_mm}
                        </td>
                        <td className="py-2 px-2.5 text-right text-[#46B5F5]">
                          {ev.metrics?.peak_discharge_mm_day}
                        </td>
                        <td className="py-2 px-2.5 text-right text-[#2DD4BF] font-bold">
                          {ev.metrics?.direct_runoff_ratio}
                        </td>
                        <td className="py-2 px-2.5 text-right text-[#E3BD69]">
                          {ev.metrics?.lag_peak_to_peak_days}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-medium ${
                              ev.status === "accepted"
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                                : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-lg bg-hydro-surface border border-hydro-border space-y-2 text-hydro-muted">
              <Sliders className="w-8 h-8 text-hydro-streamflow mx-auto stroke-1" />
              <div className="text-sm font-semibold text-hydro-text">
                Workbench Ready
              </div>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Adjust parameters on the left and click{" "}
                <strong>Run Detection Algorithm</strong> to calculate real event
                segmentation against the database.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
