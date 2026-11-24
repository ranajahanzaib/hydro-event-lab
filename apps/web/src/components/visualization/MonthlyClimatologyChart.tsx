"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface MonthlyClimPoint {
  month: number;
  mean_precipitation_mm_day: number;
  mean_streamflow_mm_day: number;
}

interface MonthlyClimatologyChartProps {
  data: MonthlyClimPoint[];
  height?: number;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function MonthlyClimatologyChart({
  data,
  height = 260,
}: MonthlyClimatologyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const width = containerRef.current.clientWidth - 80;
    const margin = { top: 20, right: 40, bottom: 35, left: 45 };
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(MONTH_NAMES)
      .range([0, width])
      .padding(0.25);

    const maxP = Math.max(
      5,
      d3.max(data, (d) => d.mean_precipitation_mm_day) || 5,
    );
    const yPScale = d3
      .scaleLinear()
      .domain([0, maxP * 1.2])
      .range([chartHeight, 0]);

    const maxQ = Math.max(
      2,
      d3.max(data, (d) => d.mean_streamflow_mm_day) || 2,
    );
    const yQScale = d3
      .scaleLinear()
      .domain([0, maxQ * 1.2])
      .range([chartHeight, 0]);

    // Precipitation bars
    g.selectAll(".p-bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(MONTH_NAMES[d.month - 1]) || 0)
      .attr("y", (d) => yPScale(d.mean_precipitation_mm_day))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => chartHeight - yPScale(d.mean_precipitation_mm_day))
      .attr("fill", "#5C82FF")
      .attr("fill-opacity", 0.45)
      .attr("rx", 2);

    // Streamflow line
    const qLine = d3
      .line<MonthlyClimPoint>()
      .x(
        (d) => (xScale(MONTH_NAMES[d.month - 1]) || 0) + xScale.bandwidth() / 2,
      )
      .y((d) => yQScale(d.mean_streamflow_mm_day))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#46B5F5")
      .attr("stroke-width", 2.2)
      .attr("d", qLine);

    // Dots
    g.selectAll(".q-dot")
      .data(data)
      .enter()
      .append("circle")
      .attr(
        "cx",
        (d) => (xScale(MONTH_NAMES[d.month - 1]) || 0) + xScale.bandwidth() / 2,
      )
      .attr("cy", (d) => yQScale(d.mean_streamflow_mm_day))
      .attr("r", 3.5)
      .attr("fill", "#46B5F5");

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("fill", "#94A7B8")
      .attr("font-size", "10px");

    // Left Axis (Precip)
    g.append("g")
      .call(d3.axisLeft(yPScale).ticks(4))
      .selectAll("text")
      .attr("fill", "#5C82FF")
      .attr("font-size", "10px");

    // Right Axis (Streamflow)
    g.append("g")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(yQScale).ticks(4))
      .selectAll("text")
      .attr("fill", "#46B5F5")
      .attr("font-size", "10px");
  }, [data, height]);

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex items-center justify-end gap-3 text-[11px] text-hydro-muted mb-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-[#5C82FF]/50 rounded-sm" /> Mean
          Precip (mm/d)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-[#46B5F5]" /> Mean Runoff (mm/d)
        </span>
      </div>
      <svg ref={svgRef} className="w-full" style={{ height }} />
    </div>
  );
}
