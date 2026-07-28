import React, { useEffect, useState } from 'react';
import { Users, Clock, Play, CheckCircle2 } from 'lucide-react';

export default function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggeringCron, setTriggeringCron] = useState(false);
  const [cronMessage, setCronMessage] = useState('');

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/subscriptions/list');
      const data = await res.json();
      setSubscriptions(data);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleTriggerCron = async () => {
    try {
      setTriggeringCron(true);
      setCronMessage('');
      const res = await fetch('/api/subscriptions/trigger-cron-check', { method: 'POST' });
      const data = await res.json();
      setCronMessage(data.message);
    } catch (err) {
      setCronMessage('Cron trigger failed: ' + err.message);
    } finally {
      setTriggeringCron(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Active Subscribers & Lifecycle Directory</h2>
          <p className="page-description">Manage user subscriptions, expiration periods, and background BullMQ renewal alerts</p>
        </div>
        <button onClick={handleTriggerCron} className="btn-secondary" disabled={triggeringCron}>
          <Play size={14} color="#10b981" />
          {triggeringCron ? 'Scanning Expiring Subscriptions...' : 'Trigger Expiration Cron Job'}
        </button>
      </div>

      {cronMessage && (
        <div className="glass-card" style={{ marginBottom: '24px', borderColor: 'rgba(16, 185, 129, 0.4)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', fontSize: '14px', fontWeight: '600' }}>
            <CheckCircle2 size={18} />
            {cronMessage}
          </div>
        </div>
      )}

      <div className="glass-card">
        {loading ? (
          <p className="page-description">Loading subscription directory...</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Email Address</th>
                  <th>Plan Tier</th>
                  <th>Billing Amount</th>
                  <th>Status</th>
                  <th>Current Period Ends</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length > 0 ? (
                  subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: '600', color: '#fff' }}>{sub.user_name || 'Subscriber'}</td>
                      <td>{sub.user_email}</td>
                      <td>
                        <span className="badge badge-primary">{sub.plan_name}</span>
                      </td>
                      <td style={{ fontWeight: '700' }}>${parseFloat(sub.amount).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${sub.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td>
                        {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No subscriptions found in PostgreSQL. Subscribe via the Pricing Tiers tab to create your first subscriber!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
