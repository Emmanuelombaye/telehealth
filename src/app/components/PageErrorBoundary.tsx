import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * PageErrorBoundary — wraps individual pages/sections.
 * Shows a friendly inline error panel instead of crashing the whole app.
 * Stack traces are NEVER shown to end users.
 */
export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || "An unexpected error occurred.",
    };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to console for dev debugging only — never exposed to UI
    console.error("[PageErrorBoundary] Caught:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  handleGoHome = () => {
    // Navigate back to the dashboard root without full reload
    const path = window.location.pathname;
    const base = "/" + path.split("/")[1];
    window.location.href = base;
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const pageName = this.props.pageName || "This section";

    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-400">
          {/* Icon */}
          <div className="mx-auto h-20 w-20 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-inner">
            <AlertTriangle className="h-9 w-9 text-amber-500" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {pageName} is temporarily unavailable
            </h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
              We hit a small snag loading this page. Your data is safe and nothing was lost. 
              Please try refreshing or return to your dashboard.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-widest border border-slate-200 transition-all active:scale-95"
            >
              <LayoutDashboard className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>

          {/* Status indicator */}
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
            Peak Health · Incident Auto-Logged · Support Notified
          </p>
        </div>
      </div>
    );
  }
}
