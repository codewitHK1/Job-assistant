import React, { useState } from "react";
import {
  Search,
  Filter,
  Briefcase,
  MapPin,
  DollarSign,
  Layers,
  ArrowUpRight,
  Sparkles,
  Check,
  CheckCircle2,
} from "lucide-react";
import { JobListing } from "../types/jobpilot.ts";

interface JobsScreenProps {
  jobs: JobListing[];
  providers: Array<{ name: string; displayName: string; isConfigured: boolean }>;
  searchQuery: string;
  selectedWorkMode: string;
  selectedProviders: string[];
  minSalary: number;
  isLoading?: boolean;
  onSearchChange: (q: string) => void;
  onWorkModeChange: (mode: string) => void;
  onProvidersChange: (providers: string[]) => void;
  onMinSalaryChange: (sal: number) => void;
  onSelectJob: (job: JobListing) => void;
  onOpenQuickTailor?: () => void;
}

export const JobsScreen: React.FC<JobsScreenProps> = ({
  jobs,
  providers,
  searchQuery,
  selectedWorkMode,
  selectedProviders,
  minSalary,
  isLoading = false,
  onSearchChange,
  onWorkModeChange,
  onProvidersChange,
  onMinSalaryChange,
  onSelectJob,
  onOpenQuickTailor,
}) => {
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const quickFilters = [
    { label: "All Openings", query: "" },
    { label: "Full Stack", query: "Full Stack" },
    { label: "Frontend", query: "Frontend" },
    { label: "Backend", query: "Backend" },
    { label: "React", query: "React" },
    { label: "Python", query: "Python" },
    { label: "DevOps / Cloud", query: "DevOps" },
  ];

  const toggleProvider = (name: string) => {
    if (selectedProviders.includes(name)) {
      if (selectedProviders.length > 1) {
        onProvidersChange(selectedProviders.filter((p) => p !== name));
      }
    } else {
      onProvidersChange([...selectedProviders, name]);
    }
  };

  const handleResetFilters = () => {
    onSearchChange("");
    onWorkModeChange("all");
    onMinSalaryChange(0);
    onProvidersChange(providers.map((p) => p.name));
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
      {/* Search Bar & Filter Toggle */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search title, skills (e.g. React, Kotlin, Full Stack)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`p-2 rounded-xl border transition-all ${
              showFilterDrawer || selectedWorkMode !== "all" || minSalary > 0
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
            title="Filter Job Sources & Criteria"
          >
            <Filter className="w-4 h-4" />
          </button>

          {onOpenQuickTailor && (
            <button
              type="button"
              onClick={onOpenQuickTailor}
              className="p-2 sm:px-3 rounded-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
              title="Paste any external job description to generate tailored resume, cover letter & answers"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Paste JD</span>
            </button>
          )}
        </div>

        {/* Quick Filter Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {quickFilters.map((qf) => {
            const isActive = searchQuery === qf.query;
            return (
              <button
                key={qf.label}
                onClick={() => onSearchChange(qf.query)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {qf.label}
              </button>
            );
          })}
        </div>

        {/* Filter Drawer */}
        {showFilterDrawer && (
          <div className="bg-slate-900/95 border border-slate-800 p-3.5 rounded-xl space-y-3 text-xs">
            {/* Work Mode */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Work Mode</span>
              <div className="flex gap-1.5 mt-1">
                {["all", "remote", "hybrid", "onsite"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onWorkModeChange(mode)}
                    className={`px-2.5 py-1 rounded-lg capitalize text-xs font-medium transition-all ${
                      selectedWorkMode === mode
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Providers Selection (Section 8 Modular Architecture) */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Active Job Providers ({selectedProviders.length})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {providers.map((p) => {
                  const isSelected = selectedProviders.includes(p.name);
                  return (
                    <button
                      key={p.name}
                      onClick={() => toggleProvider(p.name)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                        isSelected
                          ? "bg-indigo-950/80 border-indigo-500/50 text-indigo-300"
                          : "bg-slate-950/60 border-slate-800 text-slate-500"
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                      )}
                      <span>{p.displayName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimum Salary Slider */}
            <div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                <span>Minimum Base Salary</span>
                <span className="text-emerald-400 font-mono">
                  {minSalary > 0 ? `$${(minSalary / 1000).toFixed(0)}k/yr` : "Any salary"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="250000"
                step="10000"
                value={minSalary}
                onChange={(e) => onMinSalaryChange(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong>{jobs.length}</strong> matching verified openings
        </span>
        <span className="text-[10px] text-slate-500">Auto-deduplicated</span>
      </div>

      {/* Job Cards List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5 w-2/3">
                    <div className="h-3 bg-slate-800 rounded w-1/3" />
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                  </div>
                  <div className="w-14 h-6 bg-slate-800 rounded-full" />
                </div>
                <div className="flex gap-2">
                  <div className="h-3 bg-slate-800 rounded w-24" />
                  <div className="h-3 bg-slate-800 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-3">
            <Briefcase className="w-8 h-8 text-indigo-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-200">No openings matched your current filter</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No verified jobs match "${searchQuery}". Reset filters to see all available live tech jobs.`
                  : "Try resetting your filters or active job providers to see available openings."}
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20 inline-flex items-center gap-1.5"
            >
              Reset Filters & View All Live Jobs
            </button>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => onSelectJob(job)}
              className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 p-3.5 rounded-xl cursor-pointer transition-all hover:border-slate-700 flex flex-col space-y-2.5 group"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {job.company}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/80">
                      {job.workMode}
                    </span>
                    {job.sourceProvider === "remotive" && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Remotive API
                      </span>
                    )}
                    {job.sourceProvider === "arbeitnow" && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                        Live Arbeitnow API
                      </span>
                    )}
                    {job.deduplicatedCount && job.deduplicatedCount > 1 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                        Found on {job.foundOnSources.join(" + ")}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white">
                    {job.title}
                  </h3>
                </div>

                <div className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-xs font-bold shrink-0 flex items-center gap-1">
                  <span>{job.calculatedMatchScore || 88}%</span>
                  <span className="text-[9px] font-normal">Match</span>
                </div>
              </div>

              {/* Location & Salary */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{job.location}</span>
                </div>

                {job.salaryRange && (
                  <div className="flex items-center gap-1 text-emerald-400 font-medium">
                    <DollarSign className="w-3 h-3 text-emerald-500" />
                    <span>
                      ${(job.salaryRange.min / 1000).toFixed(0)}k - ${(job.salaryRange.max / 1000).toFixed(0)}k
                    </span>
                  </div>
                )}

                <span className="text-slate-500 text-[10px] ml-auto">{job.datePosted}</span>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/60">
                {job.requiredSkills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 text-[10px]"
                  >
                    {skill}
                  </span>
                ))}
                {job.requiredSkills.length > 4 && (
                  <span className="text-[10px] text-slate-500 self-center">
                    +{job.requiredSkills.length - 4} more
                  </span>
                )}
                <span className="ml-auto text-[10px] text-indigo-400 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  View ATS Match <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
