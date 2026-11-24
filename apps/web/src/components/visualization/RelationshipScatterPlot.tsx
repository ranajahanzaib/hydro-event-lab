"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface ScatterPoint {
  event_id: string;
  catchment_id: string;
  catchment_name: string;
  x: number;
  y: number;
  climate_zone?: string;
}

interface LinearFit {
  slope: number;
  intercept: number;
  r_squared: number;
  std_err: number;
}

interface ScatterPlotProps {
  points: ScatterPoint[];
  linearFit?: LinearFit;
  xLabel: string;
  yLabel: string;
  logX?: boolean;
  logY?: boolean;
  height?: number;
}

export function RelationshipScatterPlot({
  points,
  linearFit,
  xLabel,
  yLabel,
  logX = false,
  logY = false,
  height = 340,
}: ScatterPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || points.length === 0) return;

    const containerWidth = containerRef.current.clientWidth || 800;
    const margin = { top: 20, right: 30, bottom: 45, left: 65 };
    const width = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xExtent = d3.extent(points, (d) => d.x) as [number, number];
    const yExtent = d3.extent(points, (d) => d.y) as [number, number];

    const xPadding = (xExtent[1] - xExtent[0]) * 0.05 || 1;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.05 || 0.1;

    const xScale = d3
      .scaleLinear()
      .domain([Math.max(0, xExtent[0] - xPadding), xExtent[1] + xPadding])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, yExtent[0] - yPadding), yExtent[1] + yPadding])
      .range([chartHeight, 0]);

    // Gridlines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#1E293B")
      .attr("stroke-dasharray", "2,2");

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickSize(-chartHeight)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#1E293B")
      .attr("stroke-dasharray", "2,2");

    // Regression Line
    if (linearFit) {
      const x1 = xScale.domain()[0];
      const x2 = xScale.domain()[1];
      const y1 = linearFit.slope * x1 + linearFit.intercept;
      const y2 = linearFit.slope * x2 + linearFit.intercept;

      g.append("line")
        .attr("x1", xScale(x1))
        .attr("y1", yScale(y1))
        .attr("x2", xScale(x2))
        .attr("y2", yScale(y2))
        .attr("stroke", "#E3BD69")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,3")
        .attr("opacity", 0.85);
    }

    // Scatter Points
    g.selectAll("circle.point")
      .data(points)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 4)
      .attr("fill", "#46B5F5")
      .attr("fill-opacity", 0.6)
      .attr("stroke", "#2DD4BF")
      .attr("stroke-width", 1)
      .append("title")
      .text(
        (d) =>
          `${d.catchment_name || d.catchment_id}\n` +
          `${xLabel}: ${d.x}\n` +
          `${yLabel}: ${d.y}`
      );

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .selectAll("text")
      .attr("fill", "#64748B")
      .attr("font-size", "10px")
      .attr("font-family", "monospace");

    g.append("text")
      .attr("x", width / 2)
      .attr("y", chartHeight + 36)
      .attr("text-anchor", "middle")
      .attr("fill", "#94A3B8")
      .attr("font-size", "11px")
      .attr("font-family", "sans-serif")
      .attr("font-weight", 500)
      .text(`${xLabel} ${logX ? "(log10)" : ""}`);

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll("text")
      .attr("fill", "#64748B")
      .attr("font-size", "10px")
      .attr("font-family", "monospace");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -chartHeight / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .attr("fill", "#94A3B8")
      .attr("font-size", "11px")
      .attr("font-family", "sans-serif")
      .attr("font-weight", 500)
      .text(`${yLabel} ${logY ? "(log10)" : ""}`);

    // Domain baseline styling
    g.selectAll(".domain").attr("stroke", "#334155");
    g.selectAll(".tick line").attr("stroke", "#334155");
  }, [points, linearFit, xLabel, yLabel, logX, logY, height]);

  return (
    <div ref={containerRef} className="w-full">
      <svg
        ref={svgRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}
