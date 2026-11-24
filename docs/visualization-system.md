# Visualization System Architecture

HydroEventLab implements a reusable, accessible scientific visualization suite using D3.js and MapLibre GL JS.

## Color System

- Background: `#080F18`
- Surface: `#101B27`
- Elevated Surface: `#162433`
- Border: `#263747`
- Primary Text: `#E7EEF5`
- Muted Secondary Text: `#94A7B8`
- Streamflow Discharge: `#46B5F5`
- Precipitation: `#5C82FF`
- Estimated Direct Runoff: `#2DD4BF`
- Estimated Baseflow: `#E3BD69`
- Selected Catchment: `#F0D58C`
- Quality Diagnostics Flag: `#F87171`

## Components

1. **Master Hydrograph (`MasterHydrograph.tsx`)**:
   - Dual vertical axes: Upper 30% inverted precipitation hyetograph, Lower 65% streamflow hydrograph.
   - Total discharge line with shaded direct runoff and baseflow areas.
   - Synchronized crosshairs and hover inspection tooltips.
   - Toggle series visibility, logarithmic scales, and area-normalized vs volumetric discharge.
   - SVG vector export.

2. **Global Catchment Map (`CatchmentMap.tsx`)**:
   - CartoDB dark raster tiles basemap with high-contrast scientific cartography.
   - Zoom-dependent polygon rendering and choropleth metrics.
   - Interactive hover tooltips and boundary selection.

3. **Flow Duration Curve (`FlowDurationCurve.tsx`)**:
   - Exceedance probability on linear x-axis ($0-100\%$) against logarithmic streamflow.

4. **Monthly Climatology Chart (`MonthlyClimatologyChart.tsx`)**:
   - Synchronized monthly rainfall bars and streamflow response curve.
