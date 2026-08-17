import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { Button } from './Button';
import './ui.css';

interface State {
  error: Error | null;
}

/** Catches render-time errors anywhere below it (a malformed on-chain
 * value, a bad prop, etc.) so one broken card can't blank the whole app.
 * This is distinct from the try/catch error handling in the async
 * services/feature code -- React requires a class component for this. */
export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in StreamPay UI:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <p>Something went wrong rendering this view.</p>
          <Button variant="secondary" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
