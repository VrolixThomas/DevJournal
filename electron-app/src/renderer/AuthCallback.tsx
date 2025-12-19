import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './components/Login.css';

function AuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const processAuth = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          setStatus('success');
        } catch (error) {
          console.error('Auth error:', error);
          setStatus('error');
        }
      }
    };

    processAuth();
  }, []);

  const isElectron = () => {
    return window.navigator.userAgent.toLowerCase().includes('electron');
  };

  if (status === 'processing') {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '1rem', color: '#888' }}>Processing authentication...</p>
      </div>
    );
  }

  if (status === 'success') {
    if (isElectron()) {
      return (
        <div className="loading-container">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
          <h2 style={{ color: '#4ade80' }}>Successfully authenticated!</h2>
          <p style={{ color: '#888', marginTop: '0.5rem' }}>Redirecting to dashboard...</p>
        </div>
      );
    } else {
      return (
        <div className="loading-container">
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#61dafb' }}>⚠️</div>
          <h2 style={{ color: '#f0f0f0' }}>Almost there!</h2>
          <p style={{ color: '#888', margin: '1rem 0', maxWidth: '400px', textAlign: 'center' }}>
            You're authenticated, but you opened this in your browser.
            Return to the DevJournal app - it will automatically detect your login!
          </p>
          <button
            onClick={() => window.close()}
            style={{
              padding: '0.75rem 2rem',
              background: '#61dafb',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '1rem',
            }}
          >
            Close this tab
          </button>
        </div>
      );
    }
  }

  return (
    <div className="loading-container">
      <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f87171' }}>✗</div>
      <h2 style={{ color: '#f87171' }}>Authentication failed</h2>
      <p style={{ color: '#888', marginTop: '0.5rem' }}>Please try again</p>
    </div>
  );
}

export default AuthCallback;
