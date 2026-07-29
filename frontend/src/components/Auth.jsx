import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, Shield } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('client@example.com');
  const [password, setPassword] = useState('client123');
  const [name, setName] = useState('Jane Client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Authentication failed');
      } else {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail('admin@saasplatform.com');
    setPassword('admin123');
    setIsRegister(false);
  };

  const handleQuickFillClient = () => {
    setEmail('client@example.com');
    setPassword('client123');
    setIsRegister(false);
  };

  return (
    <div style={{ maxWidth: '440px', margin: '60px auto' }}>
      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 className="page-title" style={{ fontSize: '24px' }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="page-description" style={{ fontSize: '13px' }}>
            {isRegister ? 'Sign up to manage your SaaS subscription' : 'Sign in to access your portal'}
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button type="button" onClick={handleQuickFillClient} className="btn-secondary" style={{ flex: 1, fontSize: '12px', justifyContent: 'center' }}>
            <User size={14} /> Client Demo
          </button>
          <button type="button" onClick={handleQuickFillAdmin} className="btn-secondary" style={{ flex: 1, fontSize: '12px', justifyContent: 'center' }}>
            <Shield size={14} /> Admin Demo
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={loading}>
            {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button type="button" onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
