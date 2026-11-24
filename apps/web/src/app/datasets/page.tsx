"use client";

import { ExternalLink } from "lucide-react";

export default function DatasetsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="border-b border-hydro-border pb-4">
        <div className="text-xs font-mono text-hydro-streamflow uppercase tracking-wider">
          Data Provenance &amp; Attribution
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-hydro-text mt-1">
          Dataset Catalog &amp; Community Sources
        </h1>
        <p className="text-xs text-hydro-muted mt-1 leading-relaxed">
          HydroEventLab integrates openly licensed, globally harmonized
          large-sample hydrological benchmarks.
        </p>
      </div>

      {/* Dataset 1: Caravan v1.6 */}
      <div className="p-5 rounded-lg bg-hydro-surface border border-hydro-border space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-hydro-elevated text-hydro-streamflow font-semibold">
              Primary Benchmark Dataset
            </span>
            <h2 className="text-lg font-bold text-hydro-text mt-1">
              Caravan v1.6
            </h2>
            <div className="text-xs text-hydro-muted font-mono mt-0.5">
              DOI: 10.1038/s41597-023-01975-w &bull; Zenodo: 15529786 / 15530021
            </div>
          </div>
          <a
            href="https://github.com/kratzert/Caravan"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded bg-hydro-elevated hover:bg-hydro-border text-hydro-streamflow flex items-center gap-1 text-xs"
          >
            Repository <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="text-xs text-hydro-muted leading-relaxed">
          Caravan is a standardized open-source global dataset for large-sample
          hydrology, compiling daily meteorological forcing (ERA5-Land catchment
          aggregates) and quality-controlled daily streamflow from regional
          datasets including CAMELS (US, GB, AUS, BR, CL), HYSETS (North
          America), and LamaH-CE (Central Europe).
        </p>

        <div className="p-3 rounded bg-hydro-bg border border-hydro-border/40 text-xs font-mono text-hydro-muted">
          <strong className="text-hydro-text font-sans">Citation:</strong>{" "}
          Kratzert, F., Nearing, G., Addor, N. et al. Caravan - A global
          community dataset for large-sample hydrology. <em>Scientific Data</em>{" "}
          10, 61 (2023).
        </div>
      </div>

      {/* Dataset 2: GRDC-Caravan */}
      <div className="p-5 rounded-lg bg-hydro-surface border border-hydro-border space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-hydro-elevated text-emerald-400 font-semibold">
              Community Extension
            </span>
            <h2 className="text-lg font-bold text-hydro-text mt-1">
              GRDC-Caravan
            </h2>
            <div className="text-xs text-hydro-muted font-mono mt-0.5">
              DOI: 10.5194/essd-17-4613-2025 &bull; Zenodo: 15349031
            </div>
          </div>
          <a
            href="https://zenodo.org/records/15349031"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded bg-hydro-elevated hover:bg-hydro-border text-emerald-400 flex items-center gap-1 text-xs"
          >
            Zenodo <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="text-xs text-hydro-muted leading-relaxed">
          The GRDC-Caravan extension incorporates openly licensed global gauging
          stations from the Global Runoff Data Centre (GRDC), harmonized with
          the Caravan data model and geospatial processing pipelines under CC-BY
          4.0.
        </p>

        <div className="p-3 rounded bg-hydro-bg border border-hydro-border/40 text-xs font-mono text-hydro-muted">
          <strong className="text-hydro-text font-sans">Citation:</strong>{" "}
          Lehner et al. GRDC-Caravan: extending global large-sample hydrology
          benchmarks. <em>Earth System Science Data</em> 17, 4613–2025 (2025).
        </div>
      </div>

      {/* Variable Dictionary */}
      <div className="rounded-lg border border-hydro-border bg-hydro-surface overflow-hidden">
        <div className="p-3 border-b border-hydro-border">
          <span className="text-xs font-bold uppercase tracking-wider text-hydro-text">
            Standard Variable Dictionary &amp; Physical Units
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-hydro-border bg-hydro-elevated/40 text-[11px] font-mono text-hydro-muted">
                <th className="py-2.5 px-3">Variable Name</th>
                <th className="py-2.5 px-3">Physical Unit</th>
                <th className="py-2.5 px-3">Measurement / Forcing Source</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hydro-border/40 font-mono text-xs">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-hydro-text">
                  precipitation
                </td>
                <td className="py-2.5 px-3 text-[#5C82FF]">mm / day</td>
                <td className="py-2.5 px-3 font-sans text-hydro-muted">
                  ERA5-Land reanalysis
                </td>
                <td className="py-2.5 px-3 font-sans text-hydro-muted">
                  Catchment-averaged 24h total liquid &amp; solid precipitation.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-hydro-text">
                  streamflow
                </td>
                <td className="py-2.5 px-3 text-[#46B5F5]">mm / day</td>
                <td className="py-2.5 px-3 font-sans text-hydro-muted">
                  In-situ river gauge
                </td>
                <td className="py-2.5 px-3 font-sans text-hydro-muted">
                  Catchment-area normalized mean daily discharge depth.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-hydro-text">
                  temperature
                </td>
                <td className="py-2.5 px-3 text-hydro-text">&deg;C</td>
                <td className="py-2.5 px-3 font-sans text-hydro-muted">
                  ERA5-Land reanalysis
                </td>
                <td className="py-2.5 px-3 font-sans text-hydro-muted">
                  Mean daily 2-meter air temperature.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-hydro-text">
                  potential_evapotranspiration
                </td>
                <td className="py-2.5 px-3 text-hydro-muted">mm / day</td>
                <td className="py-2.5 px-3 font-sans text-hydro-muted">
                  ERA5-Land reanalysis
                </td>
                <td className="py-2.5 px-3 font-sans text-hydro-muted">
                  Potential evaporation rate over grass surface.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
