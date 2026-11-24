import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WorkspaceState {
  selectedCatchmentId: string | null;
  selectedEventId: string | null;
  comparisonEventIds: string[];
  activeMapMetric:
    | "direct_runoff_ratio"
    | "area_km2"
    | "mean_precipitation_mm_day"
    | "lag_peak_to_peak_days"
    | "aridity_index"
    | "forest_fraction";
  unitMode: "mm_day" | "m3_s";
  isLogScale: boolean;
  savedWorkspaces: Array<{
    id: string;
    title: string;
    created_at: string;
    catchment_id?: string;
    event_ids: string[];
    notes?: string;
  }>;

  setSelectedCatchmentId: (id: string | null) => void;
  setSelectedEventId: (id: string | null) => void;
  addToComparison: (id: string) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
  setActiveMapMetric: (metric: WorkspaceState["activeMapMetric"]) => void;
  toggleUnitMode: () => void;
  toggleLogScale: () => void;
  saveCurrentWorkspace: (title: string, notes?: string) => void;
  deleteSavedWorkspace: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      selectedCatchmentId: "camels_11532500", // Default: Smith River, CA (or null)
      selectedEventId: null,
      comparisonEventIds: [
        "caravan_camels_11532500_20210127",
        "caravan_camels_11532500_20221028",
      ],
      activeMapMetric: "direct_runoff_ratio",
      unitMode: "mm_day",
      isLogScale: false,
      savedWorkspaces: [],

      setSelectedCatchmentId: (id) => set({ selectedCatchmentId: id }),
      setSelectedEventId: (id) => set({ selectedEventId: id }),
      addToComparison: (id) => {
        const current = get().comparisonEventIds;
        if (!current.includes(id) && current.length < 6) {
          set({ comparisonEventIds: [...current, id] });
        }
      },
      removeFromComparison: (id) => {
        set({
          comparisonEventIds: get().comparisonEventIds.filter((x) => x !== id),
        });
      },
      clearComparison: () => set({ comparisonEventIds: [] }),
      setActiveMapMetric: (metric) => set({ activeMapMetric: metric }),
      toggleUnitMode: () =>
        set((state) => ({
          unitMode: state.unitMode === "mm_day" ? "m3_s" : "mm_day",
        })),
      toggleLogScale: () => set((state) => ({ isLogScale: !state.isLogScale })),
      saveCurrentWorkspace: (title, notes) => {
        const newWs = {
          id: `ws_${Date.now()}`,
          title: title || `Session ${new Date().toLocaleDateString()}`,
          created_at: new Date().toISOString(),
          catchment_id: get().selectedCatchmentId || undefined,
          event_ids: get().comparisonEventIds,
          notes,
        };
        set((state) => ({
          savedWorkspaces: [newWs, ...state.savedWorkspaces],
        }));
      },
      deleteSavedWorkspace: (id) => {
        set((state) => ({
          savedWorkspaces: state.savedWorkspaces.filter((w) => w.id !== id),
        }));
      },
    }),
    {
      name: "hydro-workspace-storage",
    },
  ),
);
