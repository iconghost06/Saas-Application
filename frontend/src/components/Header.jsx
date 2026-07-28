import React from 'react';
import { Zap, LogOut, Shield, User } from 'lucide-react';

export default function Header({ user, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand Logo */}
        <div className="brand-wrapper">
          <div className="brand-icon-box">
            <Zap size={22} color="#fff" />
          </div>
          <div>
            <h1 className="brand-title">SaaS Pulse</h1>
            <p className="brand-subtitle">AI Subscription & Analytics Platform</p>
          </div>
        </div>

        {/* User Account Bar */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                  {user.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                  {user.role === 'admin' ? 'Admin Portal' : 'Client Portal'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</span>
              </div>
            </div>

            <button onClick={onLogout} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '12px' }}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
