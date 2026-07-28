import React, { useEffect, useState } from 'react';
import { Users, DollarSign, TrendingUp, RefreshCw, Zap, Server, ShieldCheck, AlertTriangle } from 'lucide-react';
import RevenueCharts from './RevenueCharts.jsx';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (forceRefresh = false) => {
    try {
      setError('');
      if (forceRefresh) setRefreshing(true);
      const url = forceRefresh ? '/api/analytics/summary?refresh=true' : '/api/analytics/summary';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load analytics`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message || 'Cannot connect to backend server on port 3000');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="glass-card">
        <p className="page-description">Loading executive analytics & revenue charts...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Title & Cache Controls */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Executive Revenue & Subscription Analytics</h2>
          <p className="page-description">Real-time performance metrics powered by Redis caching & PostgreSQL</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {data?.isCached ? (
            <span className="badge badge-success">
              <span className="pulse-dot"></span> Redis Cache HIT
            </span>
          ) : (
            <span className="badge badge-primary">
              <Server size={14} /> PostgreSQL Query
            </span>
          )}

          <button 
            onClick={() => fetchAnalytics(true)} 
            className="btn-secondary" 
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing Cache...' : 'Refresh Redis Cache'}
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card" style={{ marginBottom: '24px', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', fontWeight: '600' }}>
            <AlertTriangle size={20} />
            Backend Connection Notice: {error}. Please ensure `node src/server.js` and Docker containers are running.
          </div>
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="dashboard-grid">
        <div className="glass-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Active Subscribers</span>
            <div className="stat-icon"><Users size={20} /></div>
          </div>
          <div className="stat-value">{data?.activeSubscribers || 0}</div>
          <div className="stat-footer">
            <ShieldCheck size={14} color="#10b981" /> Active paid accounts
          </div>
        </div>

        <div className="glass-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Monthly Recurring Revenue (MRR)</span>
            <div className="stat-icon"><DollarSign size={20} /></div>
          </div>
          <div className="stat-value">${(data?.mrr || 0).toLocaleString()}</div>
          <div className="stat-footer">
            <TrendingUp size={14} color="#6366f1" /> Monthly recurring baseline
          </div>
        </div>

        <div className="glass-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Annual Run Rate (ARR)</span>
            <div className="stat-icon"><Zap size={20} /></div>
          </div>
          <div className="stat-value">${(data?.arr || 0).toLocaleString()}</div>
          <div className="stat-footer">
            12-Month Projected ARR
          </div>
        </div>

        <div className="glass-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Revenue</span>
            <div className="stat-icon"><DollarSign size={20} /></div>
          </div>
          <div className="stat-value">${(data?.totalRevenue || 0).toLocaleString()}</div>
          <div className="stat-footer">
            All-time collected invoices
          </div>
        </div>
      </div>

      {/* 📈 Executive Revenue Charts */}
      <RevenueCharts planBreakdown={data?.planBreakdown} mrr={data?.mrr} />

      {/* Subscription Tier Distribution */}
      <div className="glass-card">
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Subscription Distribution & Plan Breakdown</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Active Subscribers</th>
                <th>Monthly Revenue Contribution</th>
              </tr>
            </thead>
            <tbody>
              {data?.planBreakdown && data.planBreakdown.length > 0 ? (
                data.planBreakdown.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{item.planName}</td>
                    <td>{item.count} subscribers</td>
                    <td style={{ fontWeight: '700', color: '#10b981' }}>${item.revenue.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No active subscription data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
