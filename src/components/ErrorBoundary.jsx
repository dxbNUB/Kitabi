import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-kitabi-night flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h2 className="font-display text-2xl text-kitabi-gold mb-4">Something went wrong.</h2>
            <p className="text-kitabi-stone mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-6 py-2 bg-kitabi-gold text-kitabi-night rounded-md font-medium hover:bg-kitabi-gold-deep hover:text-kitabi-paper transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
