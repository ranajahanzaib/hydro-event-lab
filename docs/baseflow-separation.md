# Baseflow Separation Methods

HydroEventLab implements continuous recursive digital filtering over the full observation record to eliminate event-boundary startup artifacts.

## 1. Lyne & Hollick (1979) Digital Recursive Filter

The Lyne-Hollick algorithm uses a standard 3-pass recursive filter (Nathan & McMahon 1990; Ladson et al. 2013):

- **Pass 1 (Forward)**: Computes quickflow $q_f(t)$ from observed streamflow $q(t)$:
  $$q_f(t) = \alpha q_f(t-1) + \frac{1+\alpha}{2} (q(t) - q(t-1))$$
  subject to $0 \le b(t) \le q(t)$ where $b(t) = q(t) - q_f(t)$.
- **Pass 2 (Backward)**: Filters baseflow from Pass 1 in reverse chronological order.
- **Pass 3 (Forward)**: Filters baseflow from Pass 2 forward to produce final smoothed baseflow.
- Default filter parameter: $\alpha = 0.925$.

## 2. Eckhardt (2005) Two-Parameter Recursive Filter

The Eckhardt filter accounts for maximum baseflow index ($BFI_{max}$) and aquifer recession characteristics ($\alpha$):
$$b(t) = \frac{(1 - BFI_{max}) \alpha b(t-1) + (1 - \alpha) BFI_{max} q(t)}{1 - \alpha BFI_{max}}$$
subject to physical constraint:
$$0 \le b(t) \le q(t)$$

- Default parameters: $\alpha = 0.98$, $BFI_{max} = 0.80$.

## 3. Constant Pre-Event Baseline

Assumes streamflow baseline remains constant at the antecedent discharge rate $Q_{ant}$ observed prior to event rise:
$$b(t) = \min(q(t), Q_{ant})$$

> **Analytical Transparency**: Baseflow separation estimates groundwater and slow subsurface contributions analytically. They do not constitute direct physical groundwater observations.
