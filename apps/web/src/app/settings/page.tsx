"use client";

import { useWorkspaceStore } from "@/lib/store";

export default function SettingsPage() {
  const {
    unitMode,
    toggleUnitMode,
    isLogScale,
    toggleLogScale,
    clearComparison,
  } = useWorkspaceStore();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="border-b border-hydro-border pb-4">
        <div className="text-xs font-mono text-hydro-streamflow uppercase tracking-wider">
          System Preferences
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-hydro-text mt-1">
          Application Preferences
        </h1>
        <p className="text-xs text-hydro-muted mt-1">
          Configure default unit displays, logarithmic axes, and local research
          session caching.
        </p>
      </div>

      <div className="space-y-4 text-xs">
        {/* Unit Preference */}
        <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border flex items-center justify-between">
          <div>
            <div className="font-bold text-hydro-text text-sm">
              Discharge Unit Preference
            </div>
            <div className="text-hydro-muted mt-0.5">
              Switch between catchment-area-normalized runoff depth (mm/day) and
              mean volumetric flow (m³/s).
            </div>
          </div>
          <button
            onClick={toggleUnitMode}
            className="px-3.5 py-1.5 rounded bg-hydro-elevated border border-hydro-border text-hydro-streamflow font-mono font-bold"
          >
            {unitMode === "mm_day"
              ? "mm / day (Normalized)"
              : "m³ / s (Volumetric)"}
          </button>
        </div>

        {/* Logarithmic Axis */}
        <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border flex items-center justify-between">
          <div>
            <div className="font-bold text-hydro-text text-sm">
              Default Hydrograph Logarithmic Scale
            </div>
            <div className="text-hydro-muted mt-0.5">
              Render streamflow discharge axes with logarithmic scaling to
              emphasize low baseflow recessions.
            </div>
          </div>
          <button
            onClick={toggleLogScale}
            className={`px-3.5 py-1.5 rounded border font-mono font-bold transition-colors ${
              isLogScale
                ? "bg-hydro-selected/20 border-hydro-selected text-hydro-selected"
                : "bg-hydro-elevated border-hydro-border text-hydro-muted"
            }`}
          >
            {isLogScale ? "Enabled" : "Linear Default"}
          </button>
        </div>

        {/* Local Storage & Cache */}
        <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border flex items-center justify-between">
          <div>
            <div className="font-bold text-hydro-text text-sm">
              Clear Active Comparison Selection
            </div>
            <div className="text-hydro-muted mt-0.5">
              Reset currently queued events from the comparative workspace
              buffer.
            </div>
          </div>
          <button
            onClick={clearComparison}
            className="px-3.5 py-1.5 rounded bg-hydro-elevated hover:bg-hydro-border border border-hydro-border text-hydro-flag font-semibold"
          >
            Clear Selected
          </button>
        </div>
      </div>
    </div>
  );
}
