import React, { useState } from 'react';
import { Check, Zap, Shield, Sparkles } from 'lucide-react';

export default function PricingTiers({ onCheckoutSuccess }) {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [userEmail, setUserEmail] = useState('john.doe@example.com');
  const [userName, setUserName] = useState('John Doe');

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '$19',
      period: '/month',
      description: 'Essential analytics and subscription tracking for growing startups.',
      features: [
        'Up to 100 subscribers tracked',
        'Standard revenue analytics',
        'Automated PDF Invoices',
        'Basic Email Notifications'
      ],
      featured: false
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '$49',
      period: '/month',
      description: 'Advanced analytics, AI forecasts, and priority BullMQ queues.',
      features: [
        'Unlimited subscribers tracked',
        'Redis-backed Instant Analytics',
        'AI Agent MCP Integration',
        'Automated 3-Day Renewal Warnings',
        'Priority Support'
      ],
      featured: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: '$199',
      period: '/month',
      description: 'Dedicated infrastructure, custom MCP tools, and high-frequency sync.',
      features: [
        'Dedicated PostgreSQL & Redis',
        'Custom MCP AI Agent Workflows',
        'SLA 99.9% Uptime Guarantee',
        'Custom Billing & Multi-Currency',
        'Dedicated Account Manager'
      ],
      featured: false
    }
  ];

  const handleCheckout = async (planId) => {
    try {
      setLoadingPlan(planId);
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          userEmail,
          userName
        })
      });
      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe Test Checkout
        window.location.href = data.url;
      } else if (data.success) {
        alert(`🎉 ${data.message}\nInvoice generated: ${data.invoice.pdfPath}`);
        if (onCheckoutSuccess) onCheckoutSuccess();
      }
    } catch (err) {
      alert('Checkout error: ' + err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Choose Your Subscription Tier</h2>
          <p className="page-description">Instant test mode checkout with automated PDF invoicing & email notifications</p>
        </div>
      </div>

      {/* Demo Customer Input Controls */}
      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-secondary)' }}>
          Demo Customer Checkout Profile
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Subscriber Name</label>
            <input 
              type="text" 
              value={userName} 
              onChange={e => setUserName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#050811',
                border: '1px solid var(--border-color)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Email Address (for invoice & notifications)</label>
            <input 
              type="email" 
              value={userEmail} 
              onChange={e => setUserEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#050811',
                border: '1px solid var(--border-color)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="pricing-grid">
        {plans.map(plan => (
          <div key={plan.id} className={`glass-card pricing-card ${plan.featured ? 'featured' : ''}`}>
            {plan.featured && <div className="popular-ribbon">Most Popular</div>}
            
            <h3 className="plan-name">{plan.name}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{plan.description}</p>
            
            <div className="plan-price-wrapper">
              <span className="plan-price">{plan.price}</span>
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
              onClick={() => handleCheckout(plan.id)}
              className="btn-primary"
              disabled={loadingPlan === plan.id}
            >
              {loadingPlan === plan.id ? 'Processing Checkout...' : `Subscribe to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
