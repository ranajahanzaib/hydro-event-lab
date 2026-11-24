/**
 * HydroEventLab API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJson<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}/api/v1${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText || res.statusText}`);
  }

  return res.json();
}

export const api = {
  // System
  getHealth: () =>
    fetchJson<{ status: string; temporal_resolution: string }>("/health"),
  getDatasets: () => fetchJson<any>("/datasets"),
  getOverview: () => fetchJson<any>("/overview"),

  // Catchments
  getCatchments: (params?: {
    country?: string;
    climate?: string;
    search?: string;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.country) q.set("country", params.country);
    if (params?.climate) q.set("climate", params.climate);
    if (params?.search) q.set("search", params.search);
    if (params?.limit) q.set("limit", params.limit.toString());
    return fetchJson<{ count: number; catchments: any[] }>(
      `/catchments?${q.toString()}`,
    );
  },
  getCatchment: (id: string) => fetchJson<any>(`/catchments/${id}`),
  getCatchmentGeometry: (id: string) =>
    fetchJson<any>(`/catchments/${id}/geometry`),
  getCatchmentObservations: (id: string, limit = 2000) =>
    fetchJson<{ catchment_id: string; observations: any[] }>(
      `/catchments/${id}/observations?limit=${limit}`,
    ),
  getCatchmentStatistics: (id: string) =>
    fetchJson<any>(`/catchments/${id}/statistics`),
  getCatchmentEvents: (id: string) =>
    fetchJson<any>(`/catchments/${id}/events`),

  // Events
  getEvents: (params?: {
    catchment_id?: string;
    country?: string;
    climate?: string;
    min_precip?: number;
    min_runoff_ratio?: number;
    max_runoff_ratio?: number;
    order_by?: string;
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.catchment_id) q.set("catchment_id", params.catchment_id);
    if (params?.country) q.set("country", params.country);
    if (params?.climate) q.set("climate", params.climate);
    if (params?.min_precip !== undefined)
      q.set("min_precip", params.min_precip.toString());
    if (params?.min_runoff_ratio !== undefined)
      q.set("min_runoff_ratio", params.min_runoff_ratio.toString());
    if (params?.max_runoff_ratio !== undefined)
      q.set("max_runoff_ratio", params.max_runoff_ratio.toString());
    if (params?.order_by) q.set("order_by", params.order_by);
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.offset) q.set("offset", params.offset.toString());
    return fetchJson<{ total: number; count: number; events: any[] }>(
      `/events?${q.toString()}`,
    );
  },
  getEvent: (id: string) => fetchJson<any>(`/events/${id}`),
  getEventHydrograph: (id: string) =>
    fetchJson<any>(`/events/${id}/hydrograph`),
  getEventMetrics: (id: string) => fetchJson<any>(`/events/${id}/metrics`),
  getEventQuality: (id: string) => fetchJson<any>(`/events/${id}/quality`),
  getSimilarEvents: (id: string, mode = "contrasting_response") =>
    fetchJson<any>(`/events/${id}/similar?discovery_mode=${mode}`),
  detectEvents: (payload: any) =>
    fetchJson<any>("/events/detect", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Analysis
  compareEvents: (payload: {
    event_ids: string[];
    alignment_mode?: string;
    normalization_mode?: string;
  }) =>
    fetchJson<any>("/compare", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  searchSimilarity: (payload: any) =>
    fetchJson<any>("/similarity/search", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  queryStatistics: (payload: any) =>
    fetchJson<any>("/statistics/query", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getSeasonality: (catchment_id?: string, hemisphere = "north") => {
    const q = new URLSearchParams();
    if (catchment_id) q.set("catchment_id", catchment_id);
    q.set("hemisphere", hemisphere);
    return fetchJson<any>(`/seasonality?${q.toString()}`);
  },
};
