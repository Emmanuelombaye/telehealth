import { Activity, LoaderCircle } from "lucide-react";

/** Matches live Peak Health OS first-paint loader on telehealth-ruby.vercel.app */
export function OsClinicalSyncLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-6">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
          <LoaderCircle className="h-8 w-8 text-primary animate-spin" aria-hidden />
        </div>
        <div className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-slate-800 tracking-tight">
          Syncing Clinical State...
        </p>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <Activity className="h-3 w-3 text-primary/40 animate-pulse" aria-hidden />
          Secure Connection
        </div>
      </div>
    </div>
  );
}
