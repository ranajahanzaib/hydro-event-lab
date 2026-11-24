"use client";

import { Layers, Maximize2, Minimize2 } from "lucide-react";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

interface CatchmentMapProps {
  catchments: any[];
  selectedCatchmentId?: string | null;
  onSelectCatchment?: (id: string) => void;
  height?: string;
  activeMetric?: string;
  onMetricChange?: (metric: string) => void;
}

export function CatchmentMap({
  catchments,
  selectedCatchmentId,
  onSelectCatchment,
  height = "520px",
  activeMetric = "direct_runoff_ratio",
  onMetricChange,
}: CatchmentMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectCatchmentRef = useRef(onSelectCatchment);
  onSelectCatchmentRef.current = onSelectCatchment;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [metric, setMetric] = useState(activeMetric);

  const handleMetricSelect = (m: string) => {
    setMetric(m);
    if (onMetricChange) onMetricChange(m);
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize MapLibre Map with Esri World Dark Gray Canvas basemap (free, reliable raster tiles, no watermark or API key required)
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "esri-dark": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "esri-dark-layer",
            type: "raster",
            source: "esri-dark",
            minzoom: 0,
            maxzoom: 16,
          },
        ],
      },
      center: [-40, 35],
      zoom: 1.8,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right",
    );

    map.on("load", () => {
      // Build GeoJSON FeatureCollection from catchments
      const geojsonFeatures = catchments
        .filter((c) => c.geometry)
        .map((c) => ({
          type: "Feature",
          id: c.catchment_id,
          geometry:
            typeof c.geometry === "string"
              ? JSON.parse(c.geometry)
              : c.geometry,
          properties: {
            catchment_id: c.catchment_id,
            gauge_name: c.gauge_name,
            country: c.country,
            climate_zone: c.climate_zone,
            area_km2: c.area_km2,
            direct_runoff_ratio: c.median_runoff_ratio || 0.25,
            mean_precipitation_mm_day: c.mean_precipitation_mm_day || 3.0,
            lag_peak_to_peak_days: c.median_lag_days || 1,
            aridity_index: c.aridity_index || 0.8,
            forest_fraction: c.forest_fraction || 0.5,
          },
        }));

      if (geojsonFeatures.length > 0) {
        map.addSource("catchments-source", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: geojsonFeatures as any,
          },
        });

        // 1. Polygons Fill Layer
        map.addLayer({
          id: "catchments-fill",
          type: "fill",
          source: "catchments-source",
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", metric],
              0.05,
              "#102A45",
              0.25,
              "#2DD4BF",
              0.6,
              "#46B5F5",
              1.0,
              "#F0D58C",
            ],
            "fill-opacity": 0.65,
          },
        });

        // 2. Boundary Outline Layer
        map.addLayer({
          id: "catchments-borders",
          type: "line",
          source: "catchments-source",
          paint: {
            "line-color": "#46B5F5",
            "line-width": 1.5,
            "line-opacity": 0.85,
          },
        });

        // 3. Selected Catchment Highlight Layer
        map.addLayer({
          id: "catchments-selected",
          type: "line",
          source: "catchments-source",
          filter: ["==", "catchment_id", selectedCatchmentId || ""],
          paint: {
            "line-color": "#F0D58C",
            "line-width": 3,
            "line-opacity": 1.0,
          },
        });

        // Popup inspection
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        map.on("mousemove", "catchments-fill", (e) => {
          map.getCanvas().style.cursor = "pointer";
          if (e.features && e.features.length > 0) {
            const props = e.features[0].properties;
            popup
              .setLngLat(e.lngLat)
              .setHTML(
                `<div class="text-xs font-sans">
                  <div class="font-bold text-[#E7EEF5]">${props.gauge_name}</div>
                  <div class="text-[#94A7B8] font-mono text-[11px] mb-1">${props.country} • ${props.catchment_id}</div>
                  <div class="grid grid-cols-2 gap-x-2 text-[11px] tabular-nums">
                    <span class="text-[#94A7B8]">Area:</span><span class="text-right text-[#E7EEF5]">${props.area_km2} km²</span>
                    <span class="text-[#94A7B8]">Climate:</span><span class="text-right text-[#46B5F5]">${props.climate_zone}</span>
                    <span class="text-[#94A7B8]">Runoff Ratio:</span><span class="text-right text-[#2DD4BF] font-bold">${props.direct_runoff_ratio}</span>
                    <span class="text-[#94A7B8]">Mean Precip:</span><span class="text-right text-[#5C82FF]">${props.mean_precipitation_mm_day} mm/d</span>
                  </div>
                </div>`,
              )
              .addTo(map);
          }
        });

        map.on("mouseleave", "catchments-fill", () => {
          map.getCanvas().style.cursor = "";
          popup.remove();
        });

        map.on("click", "catchments-fill", (e) => {
          if (e.features && e.features.length > 0) {
            const cid = e.features[0].properties?.catchment_id;
            if (cid && onSelectCatchmentRef.current) {
              onSelectCatchmentRef.current(cid);
            }
          }
        });
      }
    });

    return () => {
      map.remove();
    };
  }, [catchments, metric, selectedCatchmentId]);

  // Update selection highlight when selectedCatchmentId changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.isStyleLoaded() && map.getLayer("catchments-selected")) {
      map.setFilter("catchments-selected", [
        "==",
        "catchment_id",
        selectedCatchmentId || "",
      ]);
    }
  }, [selectedCatchmentId]);

  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-hydro-border bg-hydro-bg ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "w-full"
      }`}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Map Controls & Choropleth Selector */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <div className="bg-hydro-surface/90 border border-hydro-border rounded px-3 py-1.5 backdrop-blur shadow-lg flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-hydro-streamflow" />
          <span className="text-xs font-semibold text-hydro-text">
            Choropleth:
          </span>
          <select
            value={metric}
            onChange={(e) => handleMetricSelect(e.target.value)}
            className="bg-hydro-elevated text-xs text-hydro-text border border-hydro-border rounded px-2 py-0.5 outline-none cursor-pointer"
          >
            <option value="direct_runoff_ratio">Median Runoff Ratio</option>
            <option value="mean_precipitation_mm_day">
              Mean Precipitation (mm/d)
            </option>
            <option value="area_km2">Catchment Area (km²)</option>
            <option value="lag_peak_to_peak_days">
              Median Response Lag (days)
            </option>
            <option value="aridity_index">Aridity Index</option>
            <option value="forest_fraction">Forest Fraction</option>
          </select>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-hydro-surface/90 border border-hydro-border rounded px-3 py-2 backdrop-blur shadow-lg text-xs">
        <div className="text-[11px] font-mono text-hydro-muted mb-1 flex items-center justify-between">
          <span>Low</span>
          <span className="font-semibold text-hydro-text capitalize">
            {metric.replace(/_/g, " ")}
          </span>
          <span>High</span>
        </div>
        <div className="w-48 h-2 rounded bg-gradient-to-r from-[#102A45] via-[#2DD4BF] via-[#46B5F5] to-[#F0D58C]" />
      </div>

      {/* Fullscreen Button */}
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute top-3 right-12 z-10 p-2 rounded bg-hydro-surface/90 border border-hydro-border text-hydro-muted hover:text-hydro-text backdrop-blur shadow transition-colors"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
