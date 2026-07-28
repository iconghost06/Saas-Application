import React, { useEffect, useState } from 'react';
import { Check, CreditCard, Download, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function ClientDashboard({ user }) {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const loadClientData = async () => {
    try {
      // 1. Fetch dynamic pricing plans from backend
      const plansRes = await fetch('/api/checkout/plans');
      const plansData = await plansRes.json();
      setPlans(plansData);

      // 2. Fetch subscriber history for this logged in client
      const subRes = await fetch('/api/subscriptions/list');
      const allSubs = await subRes.json();
      const userSub = allSubs.find((s) => s.user_email === user.email);
      setSubscription(userSub || null);

      // 3. Fetch client invoices
      const invRes = await fetch('/api/subscriptions/invoices');
      const allInvoices = await invRes.json();
      const userInvoices = allInvoices.filter((i) => i.user_email === user.email);
      setInvoices(userInvoices);
    } catch (err) {
      console.error('Failed to load client portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
    // Handle Stripe checkout return redirect verification
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      fetch(`/api/checkout/verify-session?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            alert('🎉 Payment verified by Stripe! Your subscription is active.');
            window.history.replaceState({}, document.title, window.location.pathname);
            loadClientData();
          }
        });
    }
  }, [user]);

  const handleStripeCheckout = async (planId) => {
    try {
      setCheckoutLoading(planId);
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          userEmail: user.email,
          userName: user.name,
          userId: user.id
        })
      });

      const data = await res.json();
      if (data.url) {
        // Redirect directly to official Stripe Payment Checkout Portal!
        window.location.href = data.url;
      } else if (data.success) {
        alert('🎉 Subscription activated successfully!');
        loadClientData();
      } else {
        alert('Checkout error: ' + (data.error || 'Could not initiate Stripe checkout'));
      }
    } catch (err) {
      alert('Checkout error: ' + err.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return <div className="glass-card"><p className="page-description">Loading Client Portal...</p></div>;
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Welcome, {user.name}!</h2>
          <p className="page-description">Manage your active subscription, upgrade plans via Stripe, and download PDF invoices</p>
        </div>
      </div>

      {/* Active Subscription Status Card */}
      <div className="glass-card" style={{ marginBottom: '32px', borderColor: 'var(--border-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
              Current Subscription Status
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px' }}>
              {subscription ? subscription.plan_name : 'No Active Subscription'}
            </h3>
          </div>
          <div>
            <span className={`badge ${subscription && subscription.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
              <ShieldCheck size={14} /> {subscription ? subscription.status.toUpperCase() : 'INACTIVE'}
            </span>
          </div>
        </div>

        {subscription && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#050811', padding: '16px', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Billing Amount</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>${parseFloat(subscription.amount).toFixed(2)} / mo</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Period End / Renewal</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginTop: '4px' }}>
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Subscriber Email</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginTop: '4px' }}>{user.email}</div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Subscription Tiers Grid */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>Available Subscription Plans</h3>
        <div className="pricing-grid">
          {plans.map((plan) => {
            const isCurrentPlan = subscription && subscription.plan_name === plan.name;
            return (
              <div key={plan.id} className={`glass-card pricing-card ${plan.featured ? 'featured' : ''}`}>
                {plan.featured && <div className="popular-ribbon">Most Popular</div>}
                
                <h4 className="plan-name">{plan.name}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{plan.description}</p>
                
                <div className="plan-price-wrapper">
                  <span className="plan-price">${plan.amount}</span>
                  <span className="plan-period">{plan.period}</span>
                </div>

                <ul className="features-list">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="feature-item">
                      <Check size={16} color="#10b981" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleStripeCheckout(plan.id)}
                  className="btn-primary"
                  disabled={checkoutLoading === plan.id || isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Active Plan' : checkoutLoading === plan.id ? 'Redirecting to Stripe...' : `Subscribe via Stripe Portal`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Invoices Vault */}
      <div className="glass-card">
        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>My Invoices & Receipts</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice Ref</th>
                <th>Plan Name</th>
                <th>Amount Paid</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th>PDF Download</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>INV-00{inv.id}</td>
                    <td>{inv.plan_name || 'SaaS Plan'}</td>
                    <td style={{ fontWeight: '700', color: '#10b981' }}>${parseFloat(inv.amount_paid).toFixed(2)}</td>
                    <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td><span className="badge badge-success"><Check size={12} /> PAID</span></td>
                    <td>
                      <a href={`/api/subscriptions/invoices/${inv.id}/download`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <Download size={14} /> Download PDF
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No invoices yet. Select a plan above to start your subscription!
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
