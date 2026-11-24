"""DuckDB Analytical Service for querying partitioned Parquet datasets."""

import json
import math
from pathlib import Path
from typing import Any

import duckdb


def sanitize_dict(d: dict[str, Any]) -> dict[str, Any]:
    """Replace NaN and Inf values with None for standard JSON compliance."""
    for k, v in list(d.items()):
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            d[k] = None
        elif isinstance(v, dict):
            d[k] = sanitize_dict(v)
    return d


class DatabaseService:
    def __init__(self, data_dir: str | Path = "./data"):
        self.data_dir = Path(data_dir)
        self.processed_dir = self.data_dir / "processed"
        self.catchments_path = self.processed_dir / "catchments.parquet"
        self.events_path = self.processed_dir / "events.parquet"
        self.geojson_path = self.processed_dir / "catchments.geojson"
        self.timeseries_dir = self.processed_dir / "timeseries"

    def get_connection(self) -> duckdb.DuckDBPyConnection:
        conn = duckdb.connect(":memory:")
        return conn

    def get_overview_stats(self) -> dict[str, Any]:
        """Compute aggregated dataset and event metrics."""
        if not self.catchments_path.exists() or not self.events_path.exists():
            return {
                "catchment_count": 0,
                "event_count": 0,
                "dataset_breakdown": {},
                "countries": [],
                "date_range": {"min": "", "max": ""},
                "median_runoff_ratio": 0.0,
                "median_lag_days": 0,
            }

        conn = self.get_connection()
        c_stats = conn.execute(f"""
            SELECT count(*) as c_count,
                   count(distinct country) as country_count,
                   min(start_date) as min_date,
                   max(end_date) as max_date
            FROM read_parquet('{self.catchments_path}')
        """).fetchone()

        e_stats = conn.execute(f"""
            SELECT count(*) as e_count,
                   median(direct_runoff_ratio) as med_rr,
                   median(lag_peak_to_peak_days) as med_lag,
                   median(precip_total_mm) as med_precip,
                   median(peak_discharge_mm_day) as med_peak_q
            FROM read_parquet('{self.events_path}')
            WHERE status = 'accepted'
        """).fetchone()

        # Monthly event activity distribution
        monthly_activity = conn.execute(f"""
            SELECT strftime(cast(precip_start_date as date), '%Y-%m') as ym,
                   count(*) as count
            FROM read_parquet('{self.events_path}')
            GROUP BY ym
            ORDER BY ym
        """).fetchall()

        # Country breakdown
        country_counts = conn.execute(f"""
            SELECT country, count(*) as count
            FROM read_parquet('{self.catchments_path}')
            GROUP BY country
            ORDER BY count DESC
        """).fetchall()

        conn.close()

        return {
            "catchment_count": c_stats[0] if c_stats else 0,
            "country_count": c_stats[1] if c_stats else 0,
            "event_count": e_stats[0] if e_stats else 0,
            "date_range": {
                "min": str(c_stats[2]) if c_stats else "",
                "max": str(c_stats[3]) if c_stats else "",
            },
            "hydrology_summary": {
                "median_runoff_ratio": round(float(e_stats[1]), 4) if e_stats and e_stats[1] else 0.0,
                "median_lag_days": int(round(float(e_stats[2]))) if e_stats and e_stats[2] else 0,
                "median_precip_mm": round(float(e_stats[3]), 2) if e_stats and e_stats[3] else 0.0,
                "median_peak_q_mm_day": round(float(e_stats[4]), 3) if e_stats and e_stats[4] else 0.0,
            },
            "monthly_activity": [{"period": m[0], "count": m[1]} for m in monthly_activity],
            "country_breakdown": [{"country": c[0], "count": c[1]} for c in country_counts],
        }

    def list_catchments(
        self,
        country: str | None = None,
        climate: str | None = None,
        search: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """List catchments with filtering and sorting."""
        if not self.catchments_path.exists():
            return []

        conn = self.get_connection()
        query = f"SELECT * FROM read_parquet('{self.catchments_path}') WHERE 1=1"
        params = []

        if country:
            query += " AND country = ?"
            params.append(country)
        if climate:
            query += " AND climate_zone ILIKE ?"
            params.append(f"%{climate}%")
        if search:
            query += " AND (catchment_id ILIKE ? OR gauge_name ILIKE ? OR country ILIKE ?)"
            s_val = f"%{search}%"
            params.extend([s_val, s_val, s_val])

        query += f" ORDER BY area_km2 DESC LIMIT {limit} OFFSET {offset}"
        df = conn.execute(query, params).df()
        conn.close()

        records = []
        for _, row in df.iterrows():
            rec = sanitize_dict(row.to_dict())
            if "geometry" in rec and isinstance(rec["geometry"], str):
                try:
                    rec["geometry"] = json.loads(rec["geometry"])
                except Exception:
                    pass
            records.append(rec)
        return records

    def get_catchment(self, catchment_id: str) -> dict[str, Any] | None:
        """Retrieve single catchment by ID."""
        if not self.catchments_path.exists():
            return None
        conn = self.get_connection()
        df = conn.execute(
            f"SELECT * FROM read_parquet('{self.catchments_path}') WHERE catchment_id = ?",
            [catchment_id],
        ).df()
        conn.close()

        if len(df) == 0:
            return None
        rec = sanitize_dict(df.iloc[0].to_dict())
        if "geometry" in rec and isinstance(rec["geometry"], str):
            try:
                rec["geometry"] = json.loads(rec["geometry"])
            except Exception:
                pass
        return rec

    def get_catchment_timeseries(
        self,
        catchment_id: str,
        start_date: str | None = None,
        end_date: str | None = None,
        limit: int = 2000,
    ) -> list[dict[str, Any]]:
        """Retrieve daily observation time series for a catchment."""
        ts_file = self.timeseries_dir / f"{catchment_id}.parquet"
        if not ts_file.exists():
            return []

        conn = self.get_connection()
        query = f"SELECT * FROM read_parquet('{ts_file}') WHERE 1=1"
        params = []
        if start_date:
            query += " AND date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND date <= ?"
            params.append(end_date)
        query += f" ORDER BY date ASC LIMIT {limit}"

        df = conn.execute(query, params).df()
        conn.close()
        return [sanitize_dict(r) for r in df.to_dict(orient="records")]

    def list_events(
        self,
        catchment_id: str | None = None,
        country: str | None = None,
        climate: str | None = None,
        min_precip: float | None = None,
        min_runoff_ratio: float | None = None,
        max_runoff_ratio: float | None = None,
        status: str | None = "accepted",
        order_by: str = "precip_total_mm DESC",
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        """Query historical events with pagination."""
        if not self.events_path.exists():
            return [], 0

        conn = self.get_connection()
        base_filter = "WHERE 1=1"
        params = []

        if catchment_id:
            base_filter += " AND catchment_id = ?"
            params.append(catchment_id)
        if country:
            base_filter += " AND country = ?"
            params.append(country)
        if climate:
            base_filter += " AND climate_zone ILIKE ?"
            params.append(f"%{climate}%")
        if min_precip is not None:
            base_filter += " AND precip_total_mm >= ?"
            params.append(min_precip)
        if min_runoff_ratio is not None:
            base_filter += " AND direct_runoff_ratio >= ?"
            params.append(min_runoff_ratio)
        if max_runoff_ratio is not None:
            base_filter += " AND direct_runoff_ratio <= ?"
            params.append(max_runoff_ratio)
        if status:
            base_filter += " AND status = ?"
            params.append(status)

        count_query = f"SELECT count(*) FROM read_parquet('{self.events_path}') {base_filter}"
        total_count = conn.execute(count_query, params).fetchone()[0]

        # Valid order clauses to prevent injection
        allowed_orders = [
            "precip_total_mm DESC", "precip_total_mm ASC",
            "direct_runoff_ratio DESC", "direct_runoff_ratio ASC",
            "peak_discharge_mm_day DESC", "peak_discharge_mm_day ASC",
            "precip_start_date DESC", "precip_start_date ASC",
            "lag_peak_to_peak_days DESC", "lag_peak_to_peak_days ASC",
        ]
        sort_clause = order_by if order_by in allowed_orders else "precip_total_mm DESC"

        # Exclude bulky hydrograph_json from list responses for performance
        data_query = f"""
            SELECT event_id, catchment_id, catchment_name, country, climate_zone, area_km2,
                   dataset, status, precip_start_date, precip_end_date, peak_precip_date,
                   response_start_date, peak_discharge_date, response_end_date,
                   precip_total_mm, precip_max_daily_mm, precip_duration_days, precip_wet_days,
                   antecedent_precip_7d_mm, antecedent_precip_14d_mm, antecedent_precip_30d_mm,
                   peak_discharge_mm_day, antecedent_discharge_mm_day, mean_event_discharge_mm_day,
                   peak_discharge_increase_mm_day, total_runoff_depth_mm, direct_runoff_depth_mm,
                   baseflow_depth_mm, peak_discharge_m3_s, total_discharge_volume_m3, direct_discharge_volume_m3,
                   rising_limb_days, falling_limb_days, response_duration_days, time_to_peak_from_onset_days,
                   lag_peak_to_peak_days, direct_runoff_ratio, total_runoff_ratio,
                   recession_k, recession_tau_days, recession_r2, quality_flags, is_acceptable
            FROM read_parquet('{self.events_path}')
            {base_filter}
            ORDER BY {sort_clause}
            LIMIT {limit} OFFSET {offset}
        """

        df = conn.execute(data_query, params).df()
        conn.close()

        records = []
        for _, row in df.iterrows():
            rec = sanitize_dict(row.to_dict())
            if "quality_flags" in rec and isinstance(rec["quality_flags"], str):
                try:
                    rec["quality_flags"] = json.loads(rec["quality_flags"])
                except Exception:
                    pass
            records.append(rec)

        return records, total_count

    def get_event(self, event_id: str) -> dict[str, Any] | None:
        """Retrieve full event detail including hydrograph series."""
        if not self.events_path.exists():
            return None
        conn = self.get_connection()
        df = conn.execute(
            f"SELECT * FROM read_parquet('{self.events_path}') WHERE event_id = ?",
            [event_id],
        ).df()
        conn.close()

        if len(df) == 0:
            return None
        rec = sanitize_dict(df.iloc[0].to_dict())
        if "quality_flags" in rec and isinstance(rec["quality_flags"], str):
            try:
                rec["quality_flags"] = json.loads(rec["quality_flags"])
            except Exception:
                pass
        if "hydrograph_json" in rec and isinstance(rec["hydrograph_json"], str):
            try:
                rec["hydrograph"] = json.loads(rec["hydrograph_json"])
            except Exception:
                rec["hydrograph"] = []
        return rec


db_service = DatabaseService("./data")
