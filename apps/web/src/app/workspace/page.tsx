"use client";

import { useWorkspaceStore } from "@/lib/store";
import { Download, FolderHeart, GitCompare, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

export default function WorkspacePage() {
  const {
    savedWorkspaces,
    saveCurrentWorkspace,
    deleteSavedWorkspace,
    comparisonEventIds,
    selectedCatchmentId,
  } = useWorkspaceStore();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [importJson, setImportJson] = useState("");
  const [showImport, setShowImport] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    saveCurrentWorkspace(title, notes);
    setTitle("");
    setNotes("");
  };

  const handleExportAll = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(savedWorkspaces, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `hydro_workspaces_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-hydro-border">
        <div>
          <div className="text-xs font-mono text-hydro-streamflow uppercase tracking-wider">
            Research Persistence
          </div>
          <h1 className="text-2xl font-bold text-hydro-text">
            Saved Research Workspaces
          </h1>
          <p className="text-xs text-hydro-muted mt-0.5">
            Preserve and organize your selected catchments, comparative event
            sets, and analytical notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedWorkspaces.length > 0 && (
            <button
              onClick={handleExportAll}
              className="px-3 py-1.5 rounded bg-hydro-surface hover:bg-hydro-elevated border border-hydro-border text-xs text-hydro-text flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export Workspaces
            </button>
          )}
        </div>
      </div>

      {/* Save Current Session Form */}
      <form
        onSubmit={handleSave}
        className="p-4 rounded-lg bg-hydro-surface border border-hydro-border space-y-3"
      >
        <div className="text-xs font-bold uppercase tracking-wider text-hydro-text flex items-center gap-2">
          <FolderHeart className="w-4 h-4 text-hydro-streamflow" />
          Save Active Research Session
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-hydro-muted">Session Name:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Atmospheric River vs Karst Flash Comparison"
              className="w-full px-3 py-1.5 rounded bg-hydro-elevated border border-hydro-border text-hydro-text outline-none text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-hydro-muted">Analytical Notes:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key hypotheses or event observations..."
              className="w-full px-3 py-1.5 rounded bg-hydro-elevated border border-hydro-border text-hydro-text outline-none text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-hydro-muted font-mono">
            Active: {comparisonEventIds.length} events in comparison workspace
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-hydro-streamflow hover:bg-[#389ed6] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            Save Current Session
          </button>
        </div>
      </form>

      {/* Saved Sessions List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-hydro-text">
          Saved Sessions ({savedWorkspaces.length})
        </h2>

        {savedWorkspaces.length === 0 ? (
          <div className="p-12 text-center rounded-lg bg-hydro-surface border border-hydro-border text-hydro-muted text-xs">
            No saved research workspaces yet. Save your active comparison
            session above!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {savedWorkspaces.map((ws) => (
              <div
                key={ws.id}
                className="p-4 rounded-lg bg-hydro-surface border border-hydro-border flex items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="font-bold text-hydro-text text-sm">
                    {ws.title}
                  </div>
                  <div className="text-[11px] font-mono text-hydro-muted">
                    Saved: {new Date(ws.created_at).toLocaleString()} &bull;{" "}
                    {ws.event_ids.length} events
                  </div>
                  {ws.notes && (
                    <p className="text-xs text-hydro-text/80 italic mt-1">
                      {ws.notes}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ws.event_ids.map((eid) => (
                      <Link
                        key={eid}
                        href={`/events/${eid}`}
                        className="px-2 py-0.5 rounded bg-hydro-elevated text-hydro-streamflow font-mono text-[10px] hover:underline"
                      >
                        {eid}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/compare"
                    className="px-3 py-1.5 rounded bg-hydro-elevated hover:bg-hydro-border text-hydro-text flex items-center gap-1 transition-colors"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    Open Compare
                  </Link>
                  <button
                    onClick={() => deleteSavedWorkspace(ws.id)}
                    className="p-1.5 rounded hover:bg-hydro-elevated text-hydro-muted hover:text-hydro-flag transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
