"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface FdcPoint {
  exceedance_probability: number;
  streamflow_mm_day: number;
}

interface FlowDurationCurveProps {
  data: FdcPoint[];
  height?: number;
}

export function FlowDurationCurve({
  data,
  height = 260,
}: FlowDurationCurveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const width = containerRef.current.clientWidth - 70;
    const margin = { top: 15, right: 20, bottom: 35, left: 50 };
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);

    const maxQ = Math.max(1.0, d3.max(data, (d) => d.streamflow_mm_day) || 1.0);
    const minQ = Math.max(
      0.001,
      d3.min(data, (d) => d.streamflow_mm_day) || 0.01,
    );
    const yScale = d3
      .scaleLog()
      .domain([minQ, maxQ * 1.5])
      .range([chartHeight, 0]);

    // Gridlines
    g.append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(4)
          .tickSize(-width)
          .tickFormat(() => ""),
      )
      .selectAll("line")
      .attr("stroke", "#162433")
      .attr("stroke-dasharray", "2,2");

    // Curve Line
    const line = d3
      .line<FdcPoint>()
      .x((d) => xScale(d.exceedance_probability))
      .y((d) => yScale(Math.max(minQ, d.streamflow_mm_day)))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#46B5F5")
      .attr("stroke-width", 2.2)
      .attr("d", line);

    // Points
    g.selectAll(".fdc-pt")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.exceedance_probability))
      .attr("cy", (d) => yScale(Math.max(minQ, d.streamflow_mm_day)))
      .attr("r", 3)
      .attr("fill", "#2DD4BF");

    // Bottom Axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickFormat((d) => `${d}%`),
      )
      .selectAll("text")
      .attr("fill", "#94A7B8")
      .attr("font-size", "10px");

    // Left Axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(4))
      .selectAll("text")
      .attr("fill", "#46B5F5")
      .attr("font-size", "10px");

    // Axis labels
    g.append("text")
      .attr("x", width / 2)
      .attr("y", chartHeight + 30)
      .attr("text-anchor", "middle")
      .attr("fill", "#94A7B8")
      .attr("font-size", "11px")
      .text("Exceedance Probability (%)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -38)
      .attr("x", -chartHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#46B5F5")
      .attr("font-size", "11px")
      .text("Flow Q (mm/d)");
  }, [data, height]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full" style={{ height }} />
    </div>
  );
}
