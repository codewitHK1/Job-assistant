import React from "react";
import { Wifi, Battery, Smartphone, Maximize2, Minimize2, Sparkles } from "lucide-react";

interface AndroidFrameProps {
  children: React.ReactNode;
  isDeviceFrame: boolean;
  onToggleFrame: () => void;
  onOpenCodeInspector: () => void;
  onOpenAIChat: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isDeviceFrame,
  onToggleFrame,
  onOpenCodeInspector,
  onOpenAIChat,
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-0 sm:p-4 text-slate-100 font-sans">
      {/* Top Studio Control Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 px-4 mb-2 bg-slate-900/90 border border-slate-800/80 rounded-xl backdrop-blur-md shadow-lg text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold tracking-wide text-slate-200 uppercase text-[11px]">
              JobPilot AI <span className="text-indigo-400 font-medium lowercase">v1.0 (Phase 1 MVP)</span>
            </span>
          </div>
          <span className="hidden md:inline-block px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
            Kotlin • Jetpack Compose • REST • Gemini 3.8
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAIChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-sm shadow-indigo-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Career Coach</span>
          </button>

          <button
            onClick={onOpenCodeInspector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all font-mono"
            title="Inspect Android Jetpack Compose & Kotlin Code"
          >
            <span>Kotlin / Room Code</span>
          </button>

          <button
            onClick={onToggleFrame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            title={isDeviceFrame ? "Switch to Expanded View" : "Switch to Pixel 8 Pro Device Frame"}
          >
            {isDeviceFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expanded</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pixel 8 Frame</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <div
        className={`w-full transition-all duration-300 flex justify-center ${
          isDeviceFrame ? "max-w-[430px]" : "max-w-4xl"
        }`}
      >
        <div
          className={`w-full overflow-hidden bg-slate-900 border border-slate-800 flex flex-col relative ${
            isDeviceFrame
              ? "rounded-[44px] shadow-2xl shadow-indigo-950/40 ring-1 ring-slate-800/80 aspect-[9/19.5] min-h-[820px] max-h-[890px]"
              : "rounded-2xl shadow-xl min-h-[820px]"
          }`}
        >
          {/* Android Status Bar (Material 3 Style) */}
          <div className="w-full h-8 px-6 pt-2 flex items-center justify-between text-[11px] font-medium text-slate-300 select-none z-30 shrink-0">
            <span>{currentTime}</span>

            {/* Pixel Camera Punch-Hole (Device Frame Only) */}
            {isDeviceFrame && (
              <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800/80 shadow-inner" />
            )}

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-400">5G</span>
              <Wifi className="w-3 h-3 text-slate-300" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px]">98%</span>
                <Battery className="w-3 h-3 text-slate-300" />
              </div>
            </div>
          </div>

          {/* Screen Content Wrapper */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {children}
          </div>

          {/* Android Gesture Navigation Bar Pill */}
          {isDeviceFrame && (
            <div className="w-full h-5 flex items-center justify-center shrink-0 bg-slate-900/90 pb-1">
              <div className="w-32 h-1 rounded-full bg-slate-600/70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
