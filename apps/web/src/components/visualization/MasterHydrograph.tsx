"use client";

import * as d3 from "d3";
import { Download } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface HydrographPoint {
  date: string;
  precipitation: number | null;
  streamflow: number | null;
  baseflow?: number | null;
  direct_runoff?: number | null;
  temperature?: number | null;
  is_precip_event?: boolean;
  is_response_event?: boolean;
  is_peak_precip?: boolean;
  is_peak_discharge?: boolean;
}

interface MasterHydrographProps {
  data: HydrographPoint[];
  catchmentAreaKm2?: number;
  height?: number;
  unitMode?: "mm_day" | "m3_s";
  showAnnotations?: boolean;
  title?: string;
}

export function MasterHydrograph({
  data,
  catchmentAreaKm2 = 100,
  height = 480,
  unitMode = "mm_day",
  showAnnotations = true,
  title,
}: MasterHydrographProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Series visibility toggles
  const [showPrecip, setShowPrecip] = useState(true);
  const [showStreamflow, setShowStreamflow] = useState(true);
  const [showBaseflow, setShowBaseflow] = useState(true);
  const [showDirectRunoff, setShowDirectRunoff] = useState(true);
  const [isLogScale, setIsLogScale] = useState(false);

  // Zoom / time window state
  const [zoomDomain, setZoomDomain] = useState<[Date, Date] | null>(null);

  // Crosshair hover state
  const [hoveredPoint, setHoveredPoint] = useState<HydrographPoint | null>(
    null,
  );
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Unit conversion factor
  const toUnit = useCallback(
    (val: number | null | undefined): number => {
      if (val === null || val === undefined || isNaN(val)) return 0;
      if (unitMode === "m3_s" && catchmentAreaKm2 > 0) {
        return (val * catchmentAreaKm2) / 86.4;
      }
      return val;
    },
    [unitMode, catchmentAreaKm2],
  );

  const unitLabel = unitMode === "m3_s" ? "m³/s" : "mm/day";

  // Parse dates
  const parsedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      parsedDate: new Date(d.date + "T00:00:00"),
    }));
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || parsedData.length === 0)
      return;

    const containerWidth = containerRef.current.clientWidth;
    const margin = { top: 30, right: 65, bottom: 40, left: 65 };
    const width = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Split vertical space: Upper 30% for hyetograph (inverted precipitation), Lower 65% for hydrograph
    const hyetoHeight = chartHeight * 0.28;
    const gap = chartHeight * 0.07;
    const hydroHeight = chartHeight - hyetoHeight - gap;
    const hydroTop = hyetoHeight + gap;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Clip path for zooming
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "chart-clip")
      .append("rect")
      .attr("width", width)
      .attr("height", chartHeight);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale: Date
    const fullXDomain = d3.extent(parsedData, (d) => d.parsedDate) as [
      Date,
      Date,
    ];
    const xDomain = zoomDomain || fullXDomain;
    const xScale = d3.scaleTime().domain(xDomain).range([0, width]);

    // Upper Y Scale: Inverted Precipitation (mm/day)
    const maxPrecip = Math.max(
      10,
      d3.max(parsedData, (d) => d.precipitation || 0) || 10,
    );
    // Inverted: 0 is at top (0), maxPrecip is at hyetoHeight
    const yPrecipScale = d3
      .scaleLinear()
      .domain([0, maxPrecip * 1.15])
      .range([0, hyetoHeight]);

    // Lower Y Scale: Streamflow (Discharge)
    const maxFlow = Math.max(
      1.0,
      d3.max(parsedData, (d) => toUnit(d.streamflow)) || 1.0,
    );
    let yFlowScale: d3.ScaleContinuousNumeric<number, number>;
    if (isLogScale) {
      yFlowScale = d3
        .scaleLog()
        .domain([0.01, maxFlow * 1.25])
        .range([chartHeight, hydroTop]);
    } else {
      yFlowScale = d3
        .scaleLinear()
        .domain([0, maxFlow * 1.15])
        .range([chartHeight, hydroTop]);
    }

    // Gridlines
    const yGrid = d3
      .axisLeft(yFlowScale)
      .ticks(5)
      .tickSize(-width)
      .tickFormat(() => "");
    g.append("g")
      .attr("class", "grid")
      .call(yGrid)
      .selectAll("line")
      .attr("stroke", "#162433")
      .attr("stroke-dasharray", "3,3");

    // Event Shading Regions
    if (showAnnotations) {
      const precipEvents = parsedData.filter((d) => d.is_precip_event);
      if (precipEvents.length > 0) {
        const pStart = precipEvents[0].parsedDate;
        const pEnd = precipEvents[precipEvents.length - 1].parsedDate;
        g.append("rect")
          .attr("x", xScale(pStart))
          .attr("width", Math.max(4, xScale(pEnd) - xScale(pStart)))
          .attr("y", 0)
          .attr("height", chartHeight)
          .attr("fill", "#5C82FF")
          .attr("fill-opacity", 0.04)
          .attr("stroke", "#5C82FF")
          .attr("stroke-opacity", 0.15)
          .attr("stroke-dasharray", "4,4")
          .attr("clip-path", "url(#chart-clip)");
      }
    }

    const contentG = g.append("g").attr("clip-path", "url(#chart-clip)");

    // 1. Inverted Precipitation Bars (Hyetograph)
    if (showPrecip) {
      const barWidth = Math.max(2, (width / parsedData.length) * 0.75);
      contentG
        .selectAll(".precip-bar")
        .data(parsedData)
        .enter()
        .append("rect")
        .attr("class", "precip-bar")
        .attr("x", (d) => xScale(d.parsedDate) - barWidth / 2)
        .attr("y", 0)
        .attr("width", barWidth)
        .attr("height", (d) =>
          d.precipitation ? yPrecipScale(d.precipitation) : 0,
        )
        .attr("fill", (d) => (d.is_peak_precip ? "#8EA5FF" : "#5C82FF"))
        .attr("opacity", 0.85);
    }

    // 2. Baseflow Area
    if (showBaseflow) {
      const baseflowArea = d3
        .area<any>()
        .x((d) => xScale(d.parsedDate))
        .y0(chartHeight)
        .y1((d) => yFlowScale(Math.max(0.01, toUnit(d.baseflow))))
        .curve(d3.curveMonotoneX);

      contentG
        .append("path")
        .datum(parsedData)
        .attr("fill", "#E3BD69")
        .attr("fill-opacity", 0.25)
        .attr("stroke", "#E3BD69")
        .attr("stroke-width", 1.2)
        .attr("stroke-dasharray", "3,2")
        .attr("d", baseflowArea);
    }

    // 3. Direct Runoff Area (Between total streamflow and baseflow)
    if (showDirectRunoff) {
      const directArea = d3
        .area<any>()
        .x((d) => xScale(d.parsedDate))
        .y0((d) => yFlowScale(Math.max(0.01, toUnit(d.baseflow))))
        .y1((d) => yFlowScale(Math.max(0.01, toUnit(d.streamflow))))
        .curve(d3.curveMonotoneX);

      contentG
        .append("path")
        .datum(parsedData)
        .attr("fill", "#2DD4BF")
        .attr("fill-opacity", 0.3)
        .attr("d", directArea);
    }

    // 4. Observed Streamflow Line
    if (showStreamflow) {
      const streamflowLine = d3
        .line<any>()
        .x((d) => xScale(d.parsedDate))
        .y((d) => yFlowScale(Math.max(0.01, toUnit(d.streamflow))))
        .curve(d3.curveMonotoneX);

      contentG
        .append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "#46B5F5")
        .attr("stroke-width", 2.2)
        .attr("d", streamflowLine);

      // Peak discharge marker
      const peakPt = parsedData.find((d) => d.is_peak_discharge);
      if (peakPt && showAnnotations) {
        const peakX = xScale(peakPt.parsedDate);
        const peakY = yFlowScale(toUnit(peakPt.streamflow));

        contentG
          .append("circle")
          .attr("cx", peakX)
          .attr("cy", peakY)
          .attr("r", 5)
          .attr("fill", "#46B5F5")
          .attr("stroke", "#E7EEF5")
          .attr("stroke-width", 1.8);

        contentG
          .append("text")
          .attr("x", peakX)
          .attr("y", peakY - 10)
          .attr("text-anchor", "middle")
          .attr("fill", "#46B5F5")
          .attr("font-size", "11px")
          .attr("font-weight", "600")
          .text(`Peak: ${toUnit(peakPt.streamflow).toFixed(2)} ${unitLabel}`);
      }
    }

    // Axes
    // Bottom X Axis (Time)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(8)
      .tickFormat(d3.timeFormat("%b %d") as any);
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#94A7B8")
      .attr("font-size", "11px");

    // Left Y Axis (Streamflow)
    const yFlowAxis = d3.axisLeft(yFlowScale).ticks(6);
    g.append("g")
      .call(yFlowAxis)
      .selectAll("text")
      .attr("fill", "#46B5F5")
      .attr("font-size", "11px");

    // Left Y Axis Label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 18)
      .attr("x", -(hydroTop + hydroHeight / 2))
      .attr("text-anchor", "middle")
      .attr("fill", "#46B5F5")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .text(`Discharge Q (${unitLabel})`);

    // Right Y Axis (Inverted Precipitation)
    const yPrecipAxis = d3.axisRight(yPrecipScale).ticks(3);
    g.append("g")
      .attr("transform", `translate(${width},0)`)
      .call(yPrecipAxis)
      .selectAll("text")
      .attr("fill", "#5C82FF")
      .attr("font-size", "11px");

    // Right Y Axis Label
    g.append("text")
      .attr("transform", "rotate(90)")
      .attr("y", -width - margin.right + 18)
      .attr("x", hyetoHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#5C82FF")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .text("Precipitation (mm/day)");

    // Interactive Crosshair & Brush Overlays
    const crosshair = g
      .append("line")
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .attr("stroke", "#E7EEF5")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .style("opacity", 0)
      .style("pointer-events", "none");

    const overlay = g
      .append("rect")
      .attr("width", width)
      .attr("height", chartHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    // Bisector for hover tracking
    const bisectDate = d3.bisector((d: any) => d.parsedDate).left;

    overlay
      .on("mousemove", (event) => {
        const [mx, my] = d3.pointer(event);
        const xDate = xScale.invert(mx);
        const idx = bisectDate(parsedData, xDate, 1);
        const d0 = parsedData[idx - 1];
        const d1 = parsedData[idx];
        const pt = !d1
          ? d0
          : xDate.getTime() - d0.parsedDate.getTime() >
              d1.parsedDate.getTime() - xDate.getTime()
            ? d1
            : d0;

        if (pt) {
          const px = xScale(pt.parsedDate);
          crosshair.attr("x1", px).attr("x2", px).style("opacity", 1);
          setHoveredPoint(pt);
          setTooltipPos({ x: event.clientX, y: event.clientY });
        }
      })
      .on("mouseleave", () => {
        crosshair.style("opacity", 0);
        setHoveredPoint(null);
        setTooltipPos(null);
      });
  }, [
    parsedData,
    height,
    showPrecip,
    showStreamflow,
    showBaseflow,
    showDirectRunoff,
    isLogScale,
    unitMode,
    zoomDomain,
    catchmentAreaKm2,
    showAnnotations,
    toUnit,
    unitLabel,
  ]);

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hydrograph_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative flex flex-col bg-hydro-surface border border-hydro-border rounded-lg p-4 select-none">
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-hydro-border gap-2">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold tracking-wide text-hydro-text">
            {title || "Rainfall-Runoff Master Hydrograph"}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-hydro-elevated text-hydro-muted font-mono">
            Daily Resolution
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Series Toggles */}
          <button
            onClick={() => setShowPrecip(!showPrecip)}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              showPrecip
                ? "bg-[#5C82FF]/20 text-[#5C82FF] border border-[#5C82FF]/40"
                : "bg-hydro-elevated text-hydro-muted"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#5C82FF]" />
            Precip
          </button>
          <button
            onClick={() => setShowStreamflow(!showStreamflow)}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              showStreamflow
                ? "bg-[#46B5F5]/20 text-[#46B5F5] border border-[#46B5F5]/40"
                : "bg-hydro-elevated text-hydro-muted"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#46B5F5]" />
            Discharge Q
          </button>
          <button
            onClick={() => setShowDirectRunoff(!showDirectRunoff)}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              showDirectRunoff
                ? "bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/40"
                : "bg-hydro-elevated text-hydro-muted"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#2DD4BF]" />
            Direct Runoff
          </button>
          <button
            onClick={() => setShowBaseflow(!showBaseflow)}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              showBaseflow
                ? "bg-[#E3BD69]/20 text-[#E3BD69] border border-[#E3BD69]/40"
                : "bg-hydro-elevated text-hydro-muted"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#E3BD69]" />
            Est. Baseflow
          </button>

          {/* Scale & Unit Toggles */}
          <button
            onClick={() => setIsLogScale(!isLogScale)}
            className={`px-2.5 py-1 rounded transition-colors ${
              isLogScale
                ? "bg-hydro-selected/20 text-hydro-selected border border-hydro-selected/40"
                : "bg-hydro-elevated text-hydro-muted"
            }`}
          >
            Log Q
          </button>

          <button
            onClick={handleExportSvg}
            title="Export Vector SVG"
            className="p-1.5 rounded bg-hydro-elevated hover:bg-hydro-border text-hydro-muted hover:text-hydro-text transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div ref={containerRef} className="w-full relative mt-2">
        <svg ref={svgRef} className="w-full" style={{ height }} />

        {/* Hover Crosshair Tooltip */}
        {hoveredPoint && tooltipPos && (
          <div
            className="fixed z-50 pointer-events-none bg-hydro-bg/95 border border-hydro-border rounded px-3 py-2 text-xs shadow-xl backdrop-blur-sm"
            style={{
              left: tooltipPos.x + 15,
              top: tooltipPos.y - 40,
            }}
          >
            <div className="font-mono text-hydro-muted pb-1 border-b border-hydro-border/60">
              {hoveredPoint.date}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1.5 tabular-nums">
              <span className="text-[#5C82FF] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5C82FF]" />{" "}
                Rainfall:
              </span>
              <span className="font-mono text-right text-hydro-text">
                {hoveredPoint.precipitation !== null
                  ? `${hoveredPoint.precipitation.toFixed(1)} mm`
                  : "N/A"}
              </span>

              <span className="text-[#46B5F5] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#46B5F5]" /> Total
                Q:
              </span>
              <span className="font-mono text-right text-hydro-text">
                {hoveredPoint.streamflow !== null
                  ? `${toUnit(hoveredPoint.streamflow).toFixed(2)} ${unitLabel}`
                  : "N/A"}
              </span>

              {hoveredPoint.direct_runoff !== undefined && (
                <>
                  <span className="text-[#2DD4BF] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" />{" "}
                    Direct:
                  </span>
                  <span className="font-mono text-right text-hydro-text">
                    {toUnit(hoveredPoint.direct_runoff).toFixed(2)} {unitLabel}
                  </span>
                </>
              )}

              {hoveredPoint.baseflow !== undefined && (
                <>
                  <span className="text-[#E3BD69] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E3BD69]" />{" "}
                    Baseflow:
                  </span>
                  <span className="font-mono text-right text-hydro-text">
                    {toUnit(hoveredPoint.baseflow).toFixed(2)} {unitLabel}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Scientific Notation */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-hydro-border/60 text-xs text-hydro-muted mt-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-[#5C82FF] rounded-sm" /> Inverted Daily
            Hyetograph
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#46B5F5]" /> Observed Discharge
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-[#2DD4BF]/40 border-t border-[#2DD4BF]" />{" "}
            Direct Runoff
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-[#E3BD69]/30 border-t border-dashed border-[#E3BD69]" />{" "}
            Digital Filter Baseflow
          </span>
        </div>
        <div className="text-[11px] text-hydro-muted/80">
          Observed streamflow = Estimated baseflow + Estimated direct runoff
        </div>
      </div>
    </div>
  );
}
