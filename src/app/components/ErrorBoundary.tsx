/// <reference types="vite/client" />
import { useRouteError, isRouteErrorResponse } from "react-router";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

const isDev = typeof import.meta !== "undefined" && (import.meta as any).env?.DEV === true;

export function ErrorBoundary() {
  const error = useRouteError();

  // Log to console for developers — never show raw errors in production UI
  if (isDev) {
    console.error("[ErrorBoundary] Caught:", error);
  }

  let is404 = false;
  if (isRouteErrorResponse(error) && error.status === 404) {
    is404 = true;
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center p-6 font-sans">
      <div className="max-w-lg w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">

        {/* Icon */}
        <div className="mx-auto h-24 w-24 rounded-[2rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center">
          <AlertTriangle className="h-11 w-11 text-amber-500" />
        </div>

        {/* Copy */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {is404 ? "Page Not Found" : "Something went wrong"}
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
            {is404
              ? "The page you're looking for doesn't exist or has been moved."
              : "We encountered an unexpected issue. Your data is safe and nothing was lost. Please try again or return home."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-black uppercase tracking-widest border border-slate-200 transition-all active:scale-95 shadow-sm"
          >
            <Home className="h-4 w-4" />
            Return Home
          </button>
        </div>

        {/* Dev-only technical info */}
        {isDev && error instanceof Error && (
          <div className="mt-6 text-left bg-slate-900 rounded-2xl p-5 border border-slate-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              [DEV MODE] Error Details
            </p>
            <p className="text-xs text-red-400 font-mono break-all">{error.message}</p>
            {error.stack && (
              <pre className="text-[9px] text-slate-500 font-mono mt-3 overflow-auto max-h-32 leading-tight">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
          Peak Health Infrastructure · HIPAA Compliant
        </p>
      </div>
    </div>
  );
}
