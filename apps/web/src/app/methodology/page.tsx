"use client";

import { Clock, Droplets, Layers, ShieldAlert, TrendingUp } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="border-b border-hydro-border pb-4">
        <div className="text-xs font-mono text-hydro-streamflow uppercase tracking-wider">
          Scientific Transparency
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-hydro-text mt-1">
          Hydrological Methods &amp; Mathematical Formulations
        </h1>
        <p className="text-xs text-hydro-muted mt-1 leading-relaxed">
          Comprehensive documentation of mathematical models, unit harmonization
          rules, digital filtering algorithms, and temporal resolution
          constraints implemented in HydroEventLab.
        </p>
      </div>

      {/* Mandatory Scientific Notice */}
      <div className="p-4 rounded-lg bg-hydro-surface border border-hydro-border flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-hydro-selected flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-hydro-muted">
          <strong className="text-hydro-text">
            Scientific Limitation &amp; Research Intent:
          </strong>{" "}
          HydroEventLab analyzes historical daily hydrological observations and
          meteorological forcing data from Caravan v1.6 and GRDC-Caravan. It is
          intended for comparative research, process understanding, and
          educational exploration —{" "}
          <span className="text-hydro-selected font-semibold">
            not for operational flood forecasting or emergency decision-making
          </span>
          .
        </div>
      </div>

      {/* Section 1: Daily Resolution Boundary */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-hydro-text flex items-center gap-2">
          <Clock className="w-4 h-4 text-hydro-streamflow" />
          1. Daily Temporal Resolution Constraints
        </h2>
        <div className="text-xs text-hydro-muted leading-relaxed space-y-2">
          <p>
            Caravan and GRDC-Caravan provide catchment-averaged daily
            meteorological forcing and daily observed streamflow. HydroEventLab
            strictly adheres to this physical measurement interval:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-hydro-text">
            <li>
              We <strong>never</strong> infer sub-daily storm intensity or
              hourly peak rates from daily rainfall totals.
            </li>
            <li>
              We <strong>never</strong> report hourly lag times; all timing
              metrics are reported strictly in days.
            </li>
            <li>
              We <strong>never</strong> artificially smooth daily observations
              in ways that simulate finer temporal resolution.
            </li>
            <li>
              Estimated baseflow is reported as an analytical digital filter
              estimate, not as direct physical groundwater monitoring.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 2: Unit Conversions & Volumetric Discharge */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-hydro-text flex items-center gap-2">
          <Droplets className="w-4 h-4 text-[#5C82FF]" />
          2. Unit Harmonization &amp; Volumetric Conversion
        </h2>
        <div className="text-xs text-hydro-muted leading-relaxed space-y-2">
          <p>
            Caravan standardizes streamflow observations as
            catchment-area-normalized runoff depth in millimeters per day (
            <span className="font-mono text-hydro-text">mm/day</span>). When
            valid gauge drainage area (
            <span className="font-mono text-hydro-text">A in km²</span>) is
            available, mean volumetric discharge is derived via:
          </p>
          <div className="p-3 rounded bg-hydro-surface border border-hydro-border font-mono text-hydro-streamflow text-xs">
            Q (m³/s) = runoff (mm/day) &times; Area (km²) / 86.4
          </div>
          <p>Daily volume in cubic meters is calculated as:</p>
          <div className="p-3 rounded bg-hydro-surface border border-hydro-border font-mono text-hydro-streamflow text-xs">
            V (m³) = Q (m³/s) &times; 86,400 seconds/day = runoff (mm/day)
            &times; Area (km²) &times; 1,000
          </div>
        </div>
      </section>

      {/* Section 3: Digital Filter Baseflow Separation */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-hydro-text flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#2DD4BF]" />
          3. Continuous Baseflow Separation Formulations
        </h2>
        <div className="text-xs text-hydro-muted leading-relaxed space-y-3">
          <p>
            HydroEventLab separates continuous streamflow records into estimated
            baseflow <span className="font-mono text-hydro-text">b(t)</span> and
            direct quickflow{" "}
            <span className="font-mono text-hydro-text">q_d(t)</span> using
            three documented methods:
          </p>

          <div className="p-3.5 rounded bg-hydro-surface border border-hydro-border space-y-1.5">
            <div className="font-bold text-hydro-text">
              Method A: Lyne &amp; Hollick (1979) Digital Recursive Filter
            </div>
            <div className="text-[11px] font-mono text-hydro-streamflow">
              q_f(t) = &alpha; &times; q_f(t-1) + 0.5(1 + &alpha;) &times; (q(t)
              - q(t-1))
            </div>
            <div className="text-[11px] text-hydro-muted">
              Standard 3-pass implementation (forward, backward, forward) with
              default filter parameter &alpha; = 0.925, subject to 0 &le; b(t)
              &le; q(t).
            </div>
          </div>

          <div className="p-3.5 rounded bg-hydro-surface border border-hydro-border space-y-1.5">
            <div className="font-bold text-hydro-text">
              Method B: Eckhardt (2005) Two-Parameter Recursive Digital Filter
            </div>
            <div className="text-[11px] font-mono text-hydro-streamflow">
              b(t) = [ (1 - BFI_max) &times; &alpha; &times; b(t-1) + (1 -
              &alpha;) &times; BFI_max &times; q(t) ] / [ 1 - &alpha; &times;
              BFI_max ]
            </div>
            <div className="text-[11px] text-hydro-muted">
              Valid parameter ranges: &alpha; &isin; [0.90, 0.995], BFI_max
              &isin; [0.10, 0.90]. Default &alpha; = 0.98, BFI_max = 0.80.
            </div>
          </div>

          <div className="p-3.5 rounded bg-hydro-surface border border-hydro-border space-y-1.5">
            <div className="font-bold text-hydro-text">
              Method C: Constant Pre-Event Baseline
            </div>
            <div className="text-[11px] font-mono text-hydro-streamflow">
              b(t) = min(q(t), q_antecedent)
            </div>
            <div className="text-[11px] text-hydro-muted">
              Horizontal baseline fixed to antecedent streamflow before storm
              response onset.
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Runoff Ratio and Recession Fitting */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-hydro-text flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#E3BD69]" />
          4. Runoff Ratio &amp; Recession Curve Fitting
        </h2>
        <div className="text-xs text-hydro-muted leading-relaxed space-y-2">
          <p>
            Event direct runoff ratio is the ratio of direct runoff depth to
            total precipitation depth over the defined event integration window:
          </p>
          <div className="p-3 rounded bg-hydro-surface border border-hydro-border font-mono text-[#2DD4BF] text-xs">
            Direct Runoff Ratio = Direct Runoff Depth (mm) / Event Total
            Rainfall (mm)
          </div>
          <p>
            Recession limbs following the peak discharge crest are modeled with
            an exponential decay curve:
          </p>
          <div className="p-3 rounded bg-hydro-surface border border-hydro-border font-mono text-hydro-streamflow text-xs">
            Q(t) = Q₀ &times; exp(-k &times; t) &rArr; ln Q(t) = ln Q₀ - k
            &times; t
          </div>
          <p>
            where <span className="font-mono text-hydro-text">k</span> is the
            recession rate coefficient (day⁻¹) and{" "}
            <span className="font-mono text-hydro-text">&tau; = 1/k</span> is
            the e-folding time in days.
          </p>
        </div>
      </section>
    </div>
  );
}
