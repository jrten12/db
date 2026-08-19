import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Something went wrong' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Dealbreak render error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.href = '/game';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 bg-[hsl(220,14%,6%)] text-center">
        <div className="max-w-sm space-y-4">
          <div className="text-emerald-400 font-display text-2xl tracking-wide">Dealbreak</div>
          <h1 className="text-white text-lg font-semibold">Hit a snag</h1>
          <p className="text-white/55 text-sm leading-relaxed">
            The board glitched mid-deal. Your last save should still be on this device — reload and continue.
          </p>
          {this.state.message ? (
            <p className="text-white/25 text-[11px] font-mono break-all">{this.state.message}</p>
          ) : null}
          <button
            type="button"
            onClick={this.handleReload}
            className="w-full px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors"
          >
            Reload Game
          </button>
        </div>
      </div>
    );
  }
}
