import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-hydro-border bg-hydro-bg mt-16 text-xs text-hydro-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {/* Scientific Limitation Callout */}
        <div className="p-3 rounded bg-hydro-surface/60 border border-hydro-border flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-hydro-selected flex-shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-hydro-muted">
            <span className="text-hydro-text font-semibold">
              Scientific Notice:
            </span>{" "}
            HydroEventLab analyzes historical daily hydrological observations
            and meteorological forcing data from Caravan v1.6 and GRDC-Caravan.
            It is strictly intended for scientific research and comparative
            catchment exploration, not operational flood forecasting or
            emergency decision-making. Daily records do not support sub-hourly
            peak or lag inferences.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-hydro-border/40 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()}{" "}
            <span className="text-hydro-text font-medium">HydroEventLab</span>.
            Built on open Caravan v1.6 & GRDC-Caravan community datasets.
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/methodology"
              className="hover:text-hydro-text transition-colors"
            >
              Methodology & Formulas
            </Link>
            <Link
              href="/datasets"
              className="hover:text-hydro-text transition-colors"
            >
              Attribution & Licenses
            </Link>
            <Link
              href="/settings"
              className="hover:text-hydro-text transition-colors"
            >
              Preferences
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
