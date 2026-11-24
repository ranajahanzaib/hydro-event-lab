# Hydrological Metrics Engine

All hydrological metrics are computed from daily observations and reported with explicit physical units.

## Precipitation Metrics

- **Total Precipitation ($P\_{total}$, mm)**: $\sum_{t=t_{start}}^{t_{end}} P(t)$
- **Maximum Daily Rainfall ($P\_{max}$, mm/day)**: $\max(P(t))$
- **Storm Duration ($D_p$, days)**: $t_{end} - t_{start} + 1$
- **Wet-Day Count ($N\_{wet}$)**: Count of days with $P(t) \ge \text{threshold}$
- **Antecedent Precipitation ($P\_{ant}$, mm)**: Cumulative rainfall over the preceding 7, 14, and 30 days prior to storm onset.
- **Precipitation Centroid Offset ($t\_{pcent}$, days)**: $\frac{\sum t \cdot P(t)}{\sum P(t)}$

## Streamflow & Response Metrics

- **Peak Discharge ($Q\_{peak}$, mm/day or m³/s)**: Maximum observed daily flow during response window.
- **Antecedent Discharge ($Q\_{ant}$, mm/day)**: Median streamflow in the 3 days preceding storm onset.
- **Peak Flow Increase ($\Delta Q$, mm/day)**: $Q_{peak} - Q_{ant}$
- **Event Total Runoff Depth ($R\_{total}$, mm)**: $\sum_{t=t_{resp\_start}}^{t_{resp\_end}} Q(t)$
- **Direct Runoff Depth ($R\_{direct}$, mm)**: $\sum_{t=t_{resp\_start}}^{t_{resp\_end}} (Q(t) - b(t))$
- **Estimated Baseflow Depth ($R\_{base}$, mm)**: $\sum_{t=t_{resp\_start}}^{t_{resp\_end}} b(t)$
- **Direct Runoff Ratio**: $R_{direct} / P_{total}$
- **Total Runoff Ratio**: $R_{total} / P_{total}$

## Timing Metrics (Strictly in Days)

- **Rising Limb Duration**: $t_{qpeak} - t_{resp\_start}$ (days)
- **Falling Limb Duration**: $t_{resp\_end} - t_{qpeak}$ (days)
- **Peak-to-Peak Response Lag**: $t_{qpeak} - t_{pmax}$ (days)
- **Time to Peak from Storm Onset**: $t_{qpeak} - t_{pstart}$ (days)

## Volumetric Conversions

$$Q(m^3/s) = \frac{\text{runoff}(mm/day) \times \text{area}(km^2)}{86.4}$$
$$V(m^3) = Q(m^3/s) \times 86400$$
Volumetric values are calculated only when a verified drainage basin area ($km^2$) is available.
