import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Help Ideias ErrorBoundary] Erro capturado na aplicação:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // If navigation state is stuck, clear current hash/search params
    if (window.location.search || window.location.hash) {
      window.location.href = window.location.pathname;
    }
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Erro inesperado na interface';

      return (
        <div className="min-h-screen bg-[#0a1224] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#fab518] selection:text-[#142142]">
          <div className="w-full max-w-lg bg-[#142142] border border-[#1d2e56] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in duration-200">
            {/* Logo / Warning Badge */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-[#fab518] flex items-center justify-center border border-amber-500/30 shadow-lg">
                <AlertTriangle size={32} className="stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#fab518] flex items-center justify-center gap-1">
                  <ShieldAlert size={12} />
                  <span>Proteção de Execução & Estabilidade</span>
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  Ops! Algo inesperado aconteceu
                </h1>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              O sistema isolou uma falha temporária de interface para proteger suas informações. Seus dados permanecem seguros no banco de dados e no servidor.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
              >
                <RefreshCw size={15} className="stroke-[2.5]" />
                <span>Recarregar Sistema</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Home size={15} />
                <span>Ir para o Início</span>
              </button>
            </div>

            {/* Collapsible Error Technical Trace for Diagnostics */}
            <div className="pt-2 border-t border-slate-700/60 text-left">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-slate-200 py-1 transition-colors cursor-pointer"
              >
                <span>Diagnóstico técnico do erro</span>
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-slate-700 text-[10px] font-mono text-slate-300 space-y-2 overflow-x-auto max-h-48">
                  <div className="text-rose-400 font-bold">{errorMessage}</div>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="text-[9px] text-slate-400 whitespace-pre-wrap leading-tight">
                      {this.state.errorInfo.componentStack.trim()}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
