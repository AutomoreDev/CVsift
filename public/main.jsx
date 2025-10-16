import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './css/styles.css';

// Error boundary for production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ color: '#ff6d38', marginBottom: '1rem' }}>Oops!</h1>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Something went wrong. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#ff6d38',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Render the application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);