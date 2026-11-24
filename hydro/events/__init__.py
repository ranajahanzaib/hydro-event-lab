"""Event detection module."""

from hydro.events.detector import (
    DetectedHydrologicalEvent,
    EventDetectionConfig,
    detect_events_for_catchment,
)

__all__ = [
    "DetectedHydrologicalEvent",
    "EventDetectionConfig",
    "detect_events_for_catchment",
]
