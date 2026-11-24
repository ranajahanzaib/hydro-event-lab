"""Hydrological Event Quality Flags and Diagnostics."""

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class QualityFlagCode(StrEnum):
    COMPLETE = "COMPLETE"
    MISSING_PRECIP = "MISSING_PRECIP"
    MISSING_DISCHARGE = "MISSING_DISCHARGE"
    OVERLAPPING_STORM = "OVERLAPPING_STORM"
    MULTI_PEAK = "MULTI_PEAK"
    TRUNCATED_SERIES = "TRUNCATED_SERIES"
    HIGH_RUNOFF_RATIO = "HIGH_RUNOFF_RATIO"  # RR > 1.0 (e.g. snowmelt or storage release)
    LOW_RUNOFF_RATIO = "LOW_RUNOFF_RATIO"   # RR < 0.01 (e.g. high loss or dry soil)
    SNOWMELT_INFLUENCED = "SNOWMELT_INFLUENCED"
    WEAK_DISCHARGE_RESPONSE = "WEAK_DISCHARGE_RESPONSE"
    RECESSION_INTERRUPTED = "RECESSION_INTERRUPTED"
    RECESSION_POOR_FIT = "RECESSION_POOR_FIT"
    BASEFLOW_UNCERTAIN = "BASEFLOW_UNCERTAIN"


FLAG_SEVERITY: dict[QualityFlagCode, str] = {
    QualityFlagCode.COMPLETE: "info",
    QualityFlagCode.MISSING_PRECIP: "critical",
    QualityFlagCode.MISSING_DISCHARGE: "critical",
    QualityFlagCode.OVERLAPPING_STORM: "warning",
    QualityFlagCode.MULTI_PEAK: "warning",
    QualityFlagCode.TRUNCATED_SERIES: "critical",
    QualityFlagCode.HIGH_RUNOFF_RATIO: "warning",
    QualityFlagCode.LOW_RUNOFF_RATIO: "info",
    QualityFlagCode.SNOWMELT_INFLUENCED: "warning",
    QualityFlagCode.WEAK_DISCHARGE_RESPONSE: "warning",
    QualityFlagCode.RECESSION_INTERRUPTED: "warning",
    QualityFlagCode.RECESSION_POOR_FIT: "warning",
    QualityFlagCode.BASEFLOW_UNCERTAIN: "info",
}

FLAG_DESCRIPTIONS: dict[QualityFlagCode, str] = {
    QualityFlagCode.COMPLETE: "Event contains complete, uninterrupted daily observations.",
    QualityFlagCode.MISSING_PRECIP: "Precipitation record has missing observation days within the event window.",
    QualityFlagCode.MISSING_DISCHARGE: "Streamflow record has missing observation days within the response window.",
    QualityFlagCode.OVERLAPPING_STORM: "A secondary precipitation pulse occurred before streamflow receded to baseline.",
    QualityFlagCode.MULTI_PEAK: "Multiple discharge crests detected during the response window.",
    QualityFlagCode.TRUNCATED_SERIES: "Event occurs too close to dataset beginning or end to evaluate full recession.",
    QualityFlagCode.HIGH_RUNOFF_RATIO: "Event runoff ratio exceeds 1.0; likely indicates snowmelt, groundwater contribution, or reservoir release.",
    QualityFlagCode.LOW_RUNOFF_RATIO: "Event runoff ratio is below 0.01; predominantly absorbed by soil moisture replenishment.",
    QualityFlagCode.SNOWMELT_INFLUENCED: "Sub-freezing temperatures or snowpack dynamics likely contribute to streamflow response.",
    QualityFlagCode.WEAK_DISCHARGE_RESPONSE: "Precipitation episode produced marginal discharge rise above antecedent flow.",
    QualityFlagCode.RECESSION_INTERRUPTED: "Event recession interrupted by subsequent rainfall before reaching baseline.",
    QualityFlagCode.RECESSION_POOR_FIT: "Exponential recession curve fit R² < 0.70 or fewer than 3 recession days.",
    QualityFlagCode.BASEFLOW_UNCERTAIN: "Substantial deviation between constant baseline, Lyne-Hollick, and Eckhardt baseflow methods.",
}


@dataclass
class QualityAssessment:
    flags: list[QualityFlagCode] = field(default_factory=list)
    completeness_precip: float = 1.0
    completeness_discharge: float = 1.0
    recession_r2: float = 0.0
    is_acceptable: bool = True
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "flags": [f.value for f in self.flags],
            "flag_severities": {f.value: FLAG_SEVERITY.get(f, "info") for f in self.flags},
            "flag_descriptions": {f.value: FLAG_DESCRIPTIONS.get(f, "") for f in self.flags},
            "completeness_precip": round(self.completeness_precip, 3),
            "completeness_discharge": round(self.completeness_discharge, 3),
            "recession_r2": round(self.recession_r2, 3),
            "is_acceptable": self.is_acceptable,
            "details": self.details,
        }
