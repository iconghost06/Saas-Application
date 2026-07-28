import React, { useEffect, useState } from 'react';
import { FileText, Download, Check } from 'lucide-react';

export default function InvoiceViewer() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/subscriptions/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Automated Invoices & PDF Document Vault</h2>
          <p className="page-description">Download generated PDF invoices stored in local storage after successful checkout</p>
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <p className="page-description">Loading invoice history...</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice Reference</th>
                  <th>Customer Email</th>
                  <th>Subscription Plan</th>
                  <th>Amount Paid</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                  <th>PDF Document</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>INV-00{inv.id}</td>
                      <td>{inv.user_email}</td>
                      <td>{inv.plan_name || 'Pro Plan'}</td>
                      <td style={{ fontWeight: '700', color: '#10b981' }}>${parseFloat(inv.amount_paid).toFixed(2)}</td>
                      <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-success">
                          <Check size={12} /> PAID
                        </span>
                      </td>
                      <td>
                        <a 
                          href={`/api/subscriptions/invoices/${inv.id}/download`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <Download size={14} /> Download PDF
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No invoices generated yet. Perform a checkout in the Subscription Tiers tab to auto-generate a PDF invoice!
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
