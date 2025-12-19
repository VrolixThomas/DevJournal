import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Environment-aware redirect URL
      // Development: localhost (fast testing with hot reload)
      // Production: custom URL scheme (industry standard deep linking)
      const redirectUrl = import.meta.env.DEV
        ? 'http://localhost:54321/auth/callback'
        : 'devjournal://auth/callback';

      console.log('🔧 Environment Detection:');
      console.log('  - DEV mode:', import.meta.env.DEV);
      console.log('  - MODE:', import.meta.env.MODE);
      console.log('  - Redirect URL:', redirectUrl);

      // Generate the magic link
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setMessage({
        type: 'info',
        text: 'Check your email! Click the magic link - the app will automatically log you in.',
      });
      setEmail('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">DevJournal</h1>
        <p className="login-subtitle">Your development journal companion</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Sending magic link...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
            {message.type === 'info' && (
              <div className="polling-indicator">
                <div className="spinner-small"></div>
                <span>Waiting for you to click the link...</span>
              </div>
            )}
          </div>
        )}

        <p className="login-info">
          We'll send you a magic link via email. Click it and return here - the app will automatically detect your login!
        </p>
      </div>
    </div>
  );
}

export default Login;
