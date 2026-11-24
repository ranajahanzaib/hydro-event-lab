# Rainfall-Runoff Event Detection Engine

HydroEventLab implements a configurable two-stage event detection algorithm:

```
[Continuous Daily Observations]
             │
             ▼
[1. Identify Wet Days] ──── (P ≥ wet_day_threshold, e.g. 1.0 mm)
             │
             ▼
[2. Group Storm Episodes] ─ (Allow dry gap ≤ max_dry_gap, e.g. 1 day)
             │
             ▼
[3. Filter Accumulation] ── (P_total ≥ min_event_precip, e.g. 10 mm)
             │
             ▼
[4. Antecedent Analysis] ── (7d, 14d, 30d antecedent P & antecedent Q)
             │
             ▼
[5. Response Crest Search]─ (Search [p_start, p_end + post_window])
             │
             ├── If no significant rise: Classify as "rainfall_only"
             │
             ▼
[6. Hydrograph Segmentation](Rising onset, peak Q crest, recession boundary)
             │
             ▼
[7. Metrics & Diagnostics] (Direct runoff ratio, recession k, lag, quality flags)
             │
             ▼
[8. Store Provenance] ───── (Algorithm version & exact parameters stored)
```

## Detection Parameters & Research Defaults

- `wet_day_threshold_mm` (default: 1.0 mm/day): Minimum precipitation depth to mark a wet observation day.
- `min_event_precip_mm` (default: 10.0 mm): Minimum cumulative rainfall required to constitute a hydrologically significant event.
- `max_intervening_dry_gap_days` (default: 1 day): Dry days allowed between consecutive rainfall pulses before segmenting into separate storms.
- `antecedent_window_days` (default: 7 days): Observation period prior to storm onset used to assess antecedent catchment moisture.
- `post_rainfall_window_days` (default: 7 days): Search window following storm cessation used to detect peak streamflow crest.
