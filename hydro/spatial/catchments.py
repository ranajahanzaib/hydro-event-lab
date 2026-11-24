"""Spatial operations and geometry utilities for catchments."""

from typing import Any

from shapely.geometry import mapping, shape


def simplify_geometry(
    geojson_geometry: dict[str, Any],
    tolerance: float = 0.01,
) -> dict[str, Any]:
    """Simplify polygon geometry for low-zoom web map display."""
    geom = shape(geojson_geometry)
    simplified = geom.simplify(tolerance, preserve_topology=True)
    return mapping(simplified)


def calculate_bounding_box(geojson_geometry: dict[str, Any]) -> tuple[float, float, float, float]:
    """Calculate (min_lon, min_lat, max_lon, max_lat) for a GeoJSON geometry."""
    geom = shape(geojson_geometry)
    bounds = geom.bounds  # minx, miny, maxx, maxy
    return float(bounds[0]), float(bounds[1]), float(bounds[2]), float(bounds[3])


def calculate_centroid(geojson_geometry: dict[str, Any]) -> tuple[float, float]:
    """Calculate (lon, lat) centroid of a GeoJSON geometry."""
    geom = shape(geojson_geometry)
    centroid = geom.centroid
    return float(centroid.x), float(centroid.y)
