import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { OrderProvider } from './hooks/useOrder';
import { AuthProvider } from './hooks/useAuth';
import App from './App';
import './index.css';

// LANYARD-403: Styled global error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '2rem',
          background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
          color: '#fff', fontFamily: 'system-ui, sans-serif', textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem',
            padding: '2.5rem 3rem', maxWidth: '540px', width: '100%',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Something went wrong</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              An unexpected error occurred. Please reload the page.
            </p>
            {import.meta.env.DEV && (
              <pre style={{
                textAlign: 'left', background: 'rgba(0,0,0,0.4)',
                borderRadius: '0.75rem', padding: '1rem', fontSize: '0.75rem',
                overflowX: 'auto', color: '#f87171', marginBottom: '1.5rem',
              }}>
                {this.state.error?.toString()}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#5d5fef', border: 'none', borderRadius: '0.75rem',
                color: '#fff', padding: '0.75rem 1.75rem', fontSize: '0.9rem',
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        {/* LANYARD-401: AuthProvider wraps all consumers of useAuth */}
        <AuthProvider>
          <OrderProvider>
            <App />
          </OrderProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);