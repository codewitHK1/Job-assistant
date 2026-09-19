import React, { useState, useEffect } from "react";
import {
  User,
  TrendingUp,
  Settings,
  Shield,
  CreditCard,
  Database,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnalyticsData } from "../types/jobpilot.ts";
import { apiService } from "../services/api.ts";

interface ProfileScreenProps {
  userName: string;
  userEmail: string;
  targetRole: string;
  onUpdateTargetRole: (newRole: string) => void;
  onOpenCodeInspector: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userName,
  userEmail,
  targetRole,
  onUpdateTargetRole,
  onOpenCodeInspector,
}) => {
  const [activeTab, setActiveTab] = useState<"analytics" | "preferences" | "providers" | "subscription">("analytics");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [providers, setProviders] = useState<Array<{ name: string; displayName: string; isConfigured: boolean }>>([]);
  const [editingRole, setEditingRole] = useState(targetRole);

  useEffect(() => {
    apiService.getAnalytics().then(setAnalytics).catch(console.error);
    apiService.getJobProviders().then(setProviders).catch(console.error);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
      {/* User Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-600/30">
            {(userName || "Candidate").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{userName || "Candidate"}</h2>
            <div className="text-xs text-slate-400">{userEmail || "kumarhk1002@gmail.com"}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                PRO Member
              </span>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Room DB Synced
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCodeInspector}
          className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-mono transition-all"
        >
          Android Code
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "analytics" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "preferences" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Preferences
        </button>
        <button
          onClick={() => setActiveTab("providers")}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "providers" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Job Providers
        </button>
        <button
          onClick={() => setActiveTab("subscription")}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "subscription" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Tiers
        </button>
      </div>

      {/* TAB 1: ANALYTICS (Section 18) */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-3">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Applications</span>
              <div className="text-xl font-bold text-white">{analytics.totalApplications}</div>
              <div className="text-[10px] text-slate-500">Across all providers</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Interview Rate</span>
              <div className="text-xl font-bold text-emerald-400">{analytics.responseRate}%</div>
              <div className="text-[10px] text-slate-500">{analytics.interviews} positive responses</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Average Match Score</span>
              <div className="text-xl font-bold text-indigo-300">{analytics.averageMatchScore}%</div>
              <div className="text-[10px] text-slate-500">Calibrated ATS score</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Offers Generated</span>
              <div className="text-xl font-bold text-amber-300">{analytics.offers}</div>
              <div className="text-[10px] text-slate-500">{analytics.rejections} rejections</div>
            </div>
          </div>

          {/* High-Match Insight Card (Section 18) */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Empirical Success Pattern
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {analytics.highMatchInsight}
            </p>
          </div>

          {/* Funnel Breakdown */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Application Stage Funnel</span>
            <div className="space-y-1.5 pt-1">
              {Object.entries(analytics.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 capitalize">{status.replace("_", " ")}</span>
                  <span className="font-mono font-bold text-slate-200">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREFERENCES (Section 22) */}
      {activeTab === "preferences" && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Target Primary Role</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={editingRole}
                onChange={(e) => setEditingRole(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => onUpdateTargetRole(editingRole)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
              >
                Save
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Target Work Arrangement</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <button className="py-2 bg-indigo-600 text-white rounded-lg font-semibold">Remote</button>
              <button className="py-2 bg-slate-950 text-slate-400 border border-slate-800 rounded-lg">Hybrid</button>
              <button className="py-2 bg-slate-950 text-slate-400 border border-slate-800 rounded-lg">Onsite</button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Minimum Target Salary</label>
            <div className="mt-1 text-sm font-bold text-emerald-400 font-mono">$165,000 / year</div>
          </div>
        </div>
      )}

      {/* TAB 3: JOB PROVIDERS (Section 8 & 23) */}
      {activeTab === "providers" && (
        <div className="space-y-3 text-xs">
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <h3 className="font-bold text-slate-200">Modular Job Sources Architecture</h3>
            <p className="text-slate-400 text-[11px]">
              JobPilot connects to verified official feeds and permits real-time ingestion.
            </p>
          </div>

          <div className="space-y-2">
            {providers.map((p) => (
              <div
                key={p.name}
                className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-slate-200">{p.displayName}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{p.name}_job_provider_v1</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Configured</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIPTION TIERS (Section 24) */}
      {activeTab === "subscription" && (
        <div className="space-y-3 text-xs">
          <div className="bg-slate-900 border border-indigo-500/40 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Pro Plan (Active)</span>
              <span className="text-lg font-bold text-white">$19/mo</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Unlimited ATS matching, Top 20 career role audits, tailored CV generation, and Kanban tracking.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Free Tier</span>
              <div className="text-sm font-bold text-slate-200">$0</div>
              <div className="text-[10px] text-slate-500">1 resume parse • 5 job matches/day</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Executive Tier</span>
              <div className="text-sm font-bold text-slate-200">$49/mo</div>
              <div className="text-[10px] text-slate-500">Bulk workflows • AI Interview Coach</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
