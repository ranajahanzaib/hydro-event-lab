"""Baseflow separation module."""

from hydro.baseflow.separation import (
    BaseflowMethod,
    separate_baseflow,
    separate_constant_baseline,
    separate_eckhardt,
    separate_lyne_hollick,
)

__all__ = [
    "BaseflowMethod",
    "separate_baseflow",
    "separate_constant_baseline",
    "separate_eckhardt",
    "separate_lyne_hollick",
]
