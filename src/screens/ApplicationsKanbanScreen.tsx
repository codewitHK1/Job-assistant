import React, { useState } from "react";
import {
  FileCheck,
  Plus,
  ExternalLink,
  Calendar,
  Sparkles,
  MoreVertical,
  CheckCircle2,
  Clock,
  Briefcase,
  Trash2,
  Edit2,
  AlertCircle,
} from "lucide-react";
import { ApplicationRecord } from "../types/jobpilot.ts";

interface ApplicationsKanbanScreenProps {
  applications: ApplicationRecord[];
  onUpdateStatus: (id: string, newStatus: ApplicationRecord["status"]) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDeleteApplication: (id: string) => void;
  onNavigateToJobs: () => void;
}

const COLUMNS: Array<{ id: ApplicationRecord["status"]; title: string; color: string }> = [
  { id: "saved", title: "Saved", color: "border-slate-700 text-slate-300" },
  { id: "preparing", title: "Preparing", color: "border-indigo-700 text-indigo-300" },
  { id: "ready_to_apply", title: "Ready to Apply", color: "border-sky-700 text-sky-300" },
  { id: "application_opened", title: "Opened", color: "border-amber-700 text-amber-300" },
  { id: "submitted", title: "Submitted", color: "border-emerald-700 text-emerald-300" },
  { id: "interview", title: "Interview", color: "border-purple-700 text-purple-300" },
  { id: "offer", title: "Offer", color: "border-green-500 text-green-300" },
  { id: "rejected", title: "Archived", color: "border-rose-800 text-rose-300" },
];

export const ApplicationsKanbanScreen: React.FC<ApplicationsKanbanScreenProps> = ({
  applications,
  onUpdateStatus,
  onUpdateNotes,
  onDeleteApplication,
  onNavigateToJobs,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");

  const filteredApps =
    activeFilter === "all"
      ? applications
      : applications.filter((app) => app.status === activeFilter);

  const startEditNotes = (app: ApplicationRecord) => {
    setEditingNotesId(app.id);
    setNotesInput(app.notes || "");
  };

  const saveNotes = (id: string) => {
    onUpdateNotes(id, notesInput);
    setEditingNotesId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-400" />
            Application Tracker
          </h1>
          <p className="text-[11px] text-slate-400">
            {applications.length} tracked applications across career lifecycle
          </p>
        </div>

        <button
          onClick={onNavigateToJobs}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Find Jobs</span>
        </button>
      </div>

      {/* Status Filter Scrollable Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            activeFilter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          All ({applications.length})
        </button>

        {COLUMNS.map((col) => {
          const count = applications.filter((a) => a.status === col.id).length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveFilter(col.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                activeFilter === col.id
                  ? "bg-slate-700 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span>{col.title}</span>
              <span className="text-[10px] opacity-75 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Cards Stream */}
      <div className="space-y-3">
        {filteredApps.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
            <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No applications in this category</h4>
            <p className="text-xs text-slate-500">
              Select verified jobs from the Jobs discovery tab and launch the tailored application assistant.
            </p>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-3 hover:border-slate-700 transition-all"
            >
              {/* Card Top Row */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{app.company}</span>
                    <span className="text-[10px] text-slate-400">
                      {app.workMode} • {app.location}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{app.title}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold">
                    {app.matchScore}%
                  </span>
                  <button
                    onClick={() => onDeleteApplication(app.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove from tracking"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status Selector Pill Dropdown */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Status:</span>
                <select
                  value={app.status}
                  onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationRecord["status"])}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
                >
                  {COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>

                {app.dateApplied && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Applied: {app.dateApplied}
                  </span>
                )}
              </div>

              {/* Next Action & Notes */}
              {editingNotesId === app.id ? (
                <div className="space-y-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <textarea
                    rows={2}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Add interview notes, recruiter contacts, or follow-up dates..."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingNotesId(null)}
                      className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveNotes(app.id)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded text-[11px] font-semibold"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => startEditNotes(app)}
                  className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl text-xs space-y-1 cursor-pointer hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
                    <span>Notes & Next Action:</span>
                    <span className="text-indigo-400 flex items-center gap-0.5">
                      <Edit2 className="w-2.5 h-2.5" /> Edit
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {app.notes || "Click to add interview notes or recruiter contacts..."}
                  </p>
                  {app.nextAction && (
                    <div className="text-[10px] text-amber-300 font-medium flex items-center gap-1 pt-1">
                      <Clock className="w-3 h-3" />
                      Next: {app.nextAction}
                    </div>
                  )}
                </div>
              )}

              {/* Direct Link to Job */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="text-[10px] text-slate-500">
                  Source: {app.foundOnSources.join(", ")}
                </span>
                <a
                  href={app.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <span>Official Posting</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
