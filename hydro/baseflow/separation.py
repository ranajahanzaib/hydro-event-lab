"""Baseflow separation algorithms for continuous daily streamflow records.

Scientific Methods:
1. Constant Pre-Event Baseline:
   b(t) = min(q(t), q_pre) where q_pre is antecedent discharge prior to storm onset.

2. Lyne & Hollick (1979) Digital Filter:
   Standard recursive filtering (Nathan & McMahon 1990; Ladson et al. 2013).
   Pass 1 (forward): filter on streamflow q.
   Pass 2 (backward): filter on baseflow from pass 1.
   Pass 3 (forward): filter on baseflow from pass 2.
   Subject to 0 <= b(t) <= q(t).

3. Eckhardt (2005) Two-Parameter Recursive Digital Filter:
   b(t) = [ (1 - BFI_max) * alpha * b(t-1) + (1 - alpha) * BFI_max * q(t) ] / [ 1 - alpha * BFI_max ]
   subject to 0 <= b(t) <= q(t).
   Valid parameter ranges: alpha in [0.90, 0.995], BFI_max in [0.10, 0.90].
"""

from enum import StrEnum

import numpy as np


class BaseflowMethod(StrEnum):
    CONSTANT_BASELINE = "constant_baseline"
    LYNE_HOLLICK = "lyne_hollick"
    ECKHARDT = "eckhardt"


def separate_constant_baseline(
    streamflow: np.ndarray,
    antecedent_q: float,
) -> tuple[np.ndarray, np.ndarray]:
    """Separate streamflow using a constant pre-event antecedent discharge baseline."""
    q = np.asarray(streamflow, dtype=float)
    baseflow = np.minimum(q, np.maximum(0.0, antecedent_q))
    baseflow = np.where(np.isnan(q), np.nan, baseflow)
    direct_runoff = np.maximum(0.0, q - baseflow)
    direct_runoff = np.where(np.isnan(q), np.nan, direct_runoff)
    return baseflow, direct_runoff


def separate_lyne_hollick(
    streamflow: np.ndarray,
    alpha: float = 0.925,
    passes: int = 3,
) -> tuple[np.ndarray, np.ndarray]:
    """Lyne-Hollick (1979) digital recursive filter for continuous streamflow records.

    Parameters
    ----------
    streamflow : np.ndarray
        Continuous observed total daily discharge series.
    alpha : float, optional
        Filter parameter, default 0.925 (Nathan & McMahon 1990). Must be in (0, 1).
    passes : int, optional
        Number of filtering passes (default 3: forward, backward, forward).

    Returns
    -------
    baseflow, direct_runoff : Tuple[np.ndarray, np.ndarray]
    """
    if not (0.0 < alpha < 1.0):
        raise ValueError(f"Lyne-Hollick alpha must be in (0, 1), got {alpha}")
    if passes < 1:
        raise ValueError(f"Passes must be >= 1, got {passes}")

    q = np.asarray(streamflow, dtype=float).copy()
    n = len(q)
    if n == 0:
        return np.array([]), np.array([])

    valid_mask = ~np.isnan(q)
    if not np.any(valid_mask):
        return np.full(n, np.nan), np.full(n, np.nan)

    # Fill NaNs temporarily for continuous filter propagation
    q_filled = np.copy(q)
    for i in range(1, n):
        if np.isnan(q_filled[i]) and not np.isnan(q_filled[i - 1]):
            q_filled[i] = q_filled[i - 1]
    for i in range(n - 2, -1, -1):
        if np.isnan(q_filled[i]) and not np.isnan(q_filled[i + 1]):
            q_filled[i] = q_filled[i + 1]

    # Current series to filter (starts with total streamflow)
    b_curr = q_filled.copy()

    for p in range(passes):
        is_forward = (p % 2 == 0)
        q_f = np.zeros(n, dtype=float)
        b_next = np.copy(b_curr)

        if is_forward:
            q_f[0] = 0.0
            for i in range(1, n):
                delta = b_curr[i] - b_curr[i - 1]
                val = alpha * q_f[i - 1] + 0.5 * (1.0 + alpha) * delta
                # Compute baseflow candidate: b = y - q_f
                b_cand = b_curr[i] - val
                if b_cand > b_curr[i]:
                    b_cand = b_curr[i]
                elif b_cand < 0.0:
                    b_cand = 0.0
                b_next[i] = b_cand
                q_f[i] = b_curr[i] - b_cand
        else:
            q_f[-1] = 0.0
            for i in range(n - 2, -1, -1):
                delta = b_curr[i] - b_curr[i + 1]
                val = alpha * q_f[i + 1] + 0.5 * (1.0 + alpha) * delta
                b_cand = b_curr[i] - val
                if b_cand > b_curr[i]:
                    b_cand = b_curr[i]
                elif b_cand < 0.0:
                    b_cand = 0.0
                b_next[i] = b_cand
                q_f[i] = b_curr[i] - b_cand

        b_curr = b_next

    baseflow = np.clip(b_curr, 0.0, q_filled)
    baseflow = np.minimum(baseflow, q_filled)
    baseflow[~valid_mask] = np.nan

    direct_runoff = np.maximum(0.0, q - baseflow)
    direct_runoff[~valid_mask] = np.nan

    return baseflow, direct_runoff


def separate_eckhardt(
    streamflow: np.ndarray,
    alpha: float = 0.98,
    bfi_max: float = 0.80,
) -> tuple[np.ndarray, np.ndarray]:
    """Eckhardt (2005) two-parameter recursive digital filter for continuous streamflow records."""
    if not (0.80 <= alpha < 1.0):
        raise ValueError(f"Eckhardt alpha must be between 0.80 and 1.0, got {alpha}")
    if not (0.05 <= bfi_max <= 0.95):
        raise ValueError(f"Eckhardt BFI_max must be between 0.05 and 0.95, got {bfi_max}")

    denom = 1.0 - alpha * bfi_max
    if denom <= 0:
        raise ValueError(f"1 - alpha * bfi_max must be positive, got {denom}")

    q = np.asarray(streamflow, dtype=float)
    n = len(q)
    if n == 0:
        return np.array([]), np.array([])

    valid_mask = ~np.isnan(q)
    b = np.full(n, np.nan, dtype=float)

    first_valid = np.where(valid_mask)[0]
    if len(first_valid) == 0:
        return b, np.full(n, np.nan)

    start_idx = first_valid[0]
    b[start_idx] = 0.5 * q[start_idx] * bfi_max

    c1 = (1.0 - bfi_max) * alpha / denom
    c2 = (1.0 - alpha) * bfi_max / denom

    for i in range(start_idx + 1, n):
        if not valid_mask[i]:
            b[i] = alpha * b[i - 1] if not np.isnan(b[i - 1]) else np.nan
            continue

        prev_b = b[i - 1]
        if np.isnan(prev_b):
            prev_b = 0.5 * q[i] * bfi_max

        b_val = c1 * prev_b + c2 * q[i]
        b[i] = max(0.0, min(q[i], b_val))

    b[~valid_mask] = np.nan
    direct_runoff = np.maximum(0.0, q - b)
    direct_runoff[~valid_mask] = np.nan

    return b, direct_runoff


def separate_baseflow(
    streamflow: np.ndarray,
    method: BaseflowMethod | str = BaseflowMethod.LYNE_HOLLICK,
    alpha: float = 0.925,
    bfi_max: float = 0.80,
    antecedent_q: float | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    """Unified interface to separate baseflow using any supported method."""
    method_str = str(method).lower().replace("baseflowmethod.", "")
    if method_str == "constant_baseline":
        ant_q = antecedent_q if antecedent_q is not None else float(np.nanmin(streamflow))
        return separate_constant_baseline(streamflow, ant_q)
    elif method_str == "lyne_hollick":
        return separate_lyne_hollick(streamflow, alpha=alpha)
    elif method_str == "eckhardt":
        eckhardt_alpha = alpha if alpha >= 0.90 else 0.98
        return separate_eckhardt(streamflow, alpha=eckhardt_alpha, bfi_max=bfi_max)
    else:
        raise ValueError(f"Unknown baseflow separation method: {method}")
