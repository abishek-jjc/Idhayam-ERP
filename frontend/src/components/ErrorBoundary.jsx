import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ERP v3 UI Exception Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center max-w-xl mx-auto my-12 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 font-black text-xl">
            !
          </div>
          <h3 className="text-lg font-bold text-rose-200">System Component Error</h3>
          <p className="text-xs text-rose-300/80 mt-2 font-mono break-all">
            {this.state.error?.toString() || 'An unexpected rendering error occurred in this section.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
          >
            Retry Component
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
