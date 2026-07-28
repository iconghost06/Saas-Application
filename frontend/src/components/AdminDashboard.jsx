import React, { useState } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard.jsx';
import SubscriptionsList from './SubscriptionsList.jsx';
import AIAgentConsole from './AIAgentConsole.jsx';
import InvoiceViewer from './InvoiceViewer.jsx';
import { Activity, Users, Bot, FileText, Shield } from 'lucide-react';

export default function AdminDashboard({ user }) {
  const [adminTab, setAdminTab] = useState('analytics');

  const tabs = [
    { id: 'analytics', label: 'Executive Analytics', icon: Activity },
    { id: 'subscribers', label: 'Subscriber Directory', icon: Users },
    { id: 'invoices', label: 'All Invoices', icon: FileText },
    { id: 'mcp-ai', label: 'MCP AI Agent Console', icon: Bot },
  ];

  const renderAdminTab = () => {
    switch (adminTab) {
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'subscribers':
        return <SubscriptionsList />;
      case 'invoices':
        return <InvoiceViewer />;
      case 'mcp-ai':
        return <AIAgentConsole />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div>
      {/* Admin Header Banner */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-primary" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <Shield size={12} /> System Admin Mode
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Logged in as {user.email}</span>
          </div>
          <h2 className="page-title">Admin Operations & Platform Control</h2>
        </div>
      </div>

      {/* Admin Sub-navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(18, 24, 38, 0.6)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Admin Tab View */}
      {renderAdminTab()}
    </div>
  );
}
