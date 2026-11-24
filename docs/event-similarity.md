# Similar Event Discovery Engine

The central scientific question of HydroEventLab is:
**"Why do two catchments receiving similar rainfall produce very different streamflow responses?"**

## Multidimensional Feature Distance

Similarity is computed in meteorological forcing feature space:

- Total event precipitation ($P_{total}$)
- Peak daily precipitation ($P_{max}$)
- Rainfall duration ($D_p$)
- Antecedent precipitation ($P_{ant, 7d}$)
- Temporal centroid timing ($t_{centroid}$)

The standardized weighted Euclidean distance is calculated as:
$$D = \sqrt{\sum w_i \left( \frac{x_i - y_i}{\sigma_i} \right)^2}$$

The similarity score is converted to a percentage:
$$\text{Score} = \frac{100}{1 + 0.5 \cdot D} \times 100\%$$

## Signature Discovery Mode: "Similar Rainfall. Different Response."

1. Filters for candidates with high precipitation similarity.
2. Sorts to maximize the hydrological response divergence:
   $$|\Delta RR| = |RR_{matched} - RR_{target}| \ge 0.15 \quad \text{or} \quad |\Delta \text{lag}| \ge 3 \text{ days}$$
3. Highlights how catchment attributes (drainage area, soil permeability, slope, aridity, forest cover) explain the contrasting runoff responses.
