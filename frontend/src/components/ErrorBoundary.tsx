import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center p-6 bg-[#07111e]">
          <div className="max-w-md w-full rounded-2xl p-6 border border-red-500/30 bg-[#0c1322] shadow-2xl text-center space-y-4 animate-slide-up">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {this.props.fallbackTitle || "View Encountered an Issue"}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-1">
                {this.state.error?.message || "An unexpected error occurred in this view module."}
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-mono text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw size={14} />
                RETRY VIEW
              </button>
              {this.props.onReset && (
                <button
                  onClick={this.props.onReset}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard size={14} />
                  OVERVIEW
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
