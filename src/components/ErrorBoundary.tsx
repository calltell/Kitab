import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }




  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      localStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-['Vazirmatn',sans-serif]" dir="rtl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold mb-2">خطایی در اجرای نرم‌افزار رخ داده است</h2>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            لطفاً روی دکمه زیر کلیک فرمایید تا برنامه بازنشانی و مجدداً راه‌اندازی شود.
          </p>
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs text-rose-300 font-mono mb-6 max-w-lg overflow-x-auto text-left dir-ltr">
            {this.state.error?.toString() || 'Unknown runtime error'}
          </div>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>بازنشانی و شروع مجدد برنامه</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
