import React from "react";
import { Home, Briefcase, FileCheck, FileText, User } from "lucide-react";

export type NavTab = "home" | "jobs" | "applications" | "resume" | "profile";

interface AndroidNavBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  applicationsBadgeCount?: number;
}

export const AndroidNavBar: React.FC<AndroidNavBarProps> = ({
  activeTab,
  onSelectTab,
  applicationsBadgeCount = 4,
}) => {
  const tabs = [
    { id: "home" as NavTab, label: "Home", icon: Home },
    { id: "jobs" as NavTab, label: "Jobs", icon: Briefcase },
    { id: "applications" as NavTab, label: "Applications", icon: FileCheck, badge: applicationsBadgeCount },
    { id: "resume" as NavTab, label: "Resume", icon: FileText },
    { id: "profile" as NavTab, label: "Profile", icon: User },
  ];

  return (
    <nav className="w-full h-16 bg-slate-900/95 border-t border-slate-800/80 px-2 flex items-center justify-around shrink-0 backdrop-blur-sm z-20">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-all relative group"
          >
            {/* Active Pill Indicator (Material 3 standard) */}
            <div
              className={`w-14 h-8 rounded-full flex items-center justify-center transition-all ${
                isActive
                  ? "bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/40"
                  : "text-slate-400 group-hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-105" : ""}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center border border-slate-900">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
            </div>

            <span
              className={`text-[11px] font-medium mt-0.5 tracking-tight transition-colors ${
                isActive ? "text-indigo-400 font-semibold" : "text-slate-400"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
