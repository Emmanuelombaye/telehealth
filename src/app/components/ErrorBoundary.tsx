import { useRouteError, isRouteErrorResponse } from "react-router";
import { Button } from "./ui/shared.tsx";
import { AlertCircle, RefreshCw, Home, ShieldAlert } from "lucide-react";

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("[ErrorBoundary] Caught error:", error);

  let errorMessage = "An unexpected error occurred.";
  let errorStack = "";

  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack || "";
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  const isReact130 = errorMessage.includes("Minified React error #130") || errorMessage.includes("element type is invalid");

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto ring-1 ring-red-500/20">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">System Exception</h1>
          <p className="text-slate-400 text-lg font-medium">
            The application encountered a critical rendering failure.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl mb-6">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-200">
                {isReact130 ? "React Error #130: Invalid Component" : "Error Details"}
              </p>
              <p className="text-xs text-red-300/70 font-mono leading-relaxed break-all">
                {errorMessage}
              </p>
            </div>
          </div>

          {errorStack && (
            <div className="space-y-2 mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Stack Trace</p>
              <div className="bg-slate-950/50 rounded-xl p-4 overflow-auto max-h-40 border border-slate-800/50">
                <pre className="text-[10px] text-slate-400 font-mono leading-tight">
                  {errorStack}
                </pre>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="h-14 flex-1 rounded-2xl bg-white text-slate-950 hover:bg-slate-200 font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </Button>
            <Button 
              variant="outline"
              className="h-14 flex-1 rounded-2xl border-slate-700 text-slate-300 hover:bg-slate-800 font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
              onClick={() => window.location.href = "/"}
            >
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
            Peak Health Infrastructure · HIPAA Compliant Error Reporting
          </p>
        </div>
      </div>
    </div>
  );
}
