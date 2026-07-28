import React, { useState } from 'react';
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';

export default function RevenueCharts({ planBreakdown, mrr = 316 }) {
  const [activeRange, setActiveRange] = useState('6M');

  // Simulated 6-Month MRR Historical Trend Data
  const mrrTrendData = [
    { month: 'Mar', mrr: 120, subscribers: 2 },
    { month: 'Apr', mrr: 180, subscribers: 3 },
    { month: 'May', mrr: 220, subscribers: 3 },
    { month: 'Jun', mrr: 270, subscribers: 4 },
    { month: 'Jul', mrr: mrr, subscribers: 4 },
  ];

  const maxMrr = Math.max(...mrrTrendData.map((d) => d.mrr)) * 1.25 || 500;

  // Chart coordinates calculation for MRR Line Chart
  const chartHeight = 180;
  const chartWidth = 500;
  const points = mrrTrendData.map((d, index) => {
    const x = (index / (mrrTrendData.length - 1)) * chartWidth;
    const y = chartHeight - (d.mrr / maxMrr) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, point, i) => {
    return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  // Plan Breakdown Data for Pie / Donut Chart
  const plans = planBreakdown && planBreakdown.length > 0 ? planBreakdown : [
    { planName: 'Basic Plan', count: 1, revenue: 19 },
    { planName: 'Pro Plan', count: 2, revenue: 98 },
    { planName: 'Elite Plan', count: 1, revenue: 199 }
  ];

  const totalCount = plans.reduce((acc, p) => acc + p.count, 0) || 1;
  const colors = ['#06b6d4', '#6366f1', '#a855f7', '#10b981'];

  // SVG Donut Chart Calculation
  let cumulativeAngle = 0;
  const donutSegments = plans.map((p, idx) => {
    const percentage = p.count / totalCount;
    const angle = percentage * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    // Convert angles to SVG arc coordinates (Radius 80, Center 100, 100)
    const r = 70;
    const cx = 100;
    const cy = 100;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (cumulativeAngle - 90) * (Math.PI / 180);

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      ...p,
      color: colors[idx % colors.length],
      percentage: Math.round(percentage * 100),
      path
    };
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '32px' }}>
      
      {/* 📈 Graph 1: MRR Growth Trajectory (Line Chart) */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#6366f1" />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>MRR Growth Trajectory</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Historical monthly recurring revenue curve</p>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '8px' }}>
            {['3M', '6M', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`nav-tab-btn ${activeRange === range ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} style={{ width: '100%', height: '220px', overflow: 'visible' }}>
            <defs>
              <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1="0"
                y1={chartHeight * ratio}
                x2={chartWidth}
                y2={chartHeight * ratio}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="4 4"
              />
            ))}

            <path d={areaD} fill="url(#mrrGradient)" />
            <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />

            {points.map((pt, idx) => (
              <g key={idx}>
                <circle cx={pt.x} cy={pt.y} r="5" fill="#a855f7" stroke="#fff" strokeWidth="2" />
                <text x={pt.x} y={pt.y - 12} fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">
                  ${pt.mrr}
                </text>
                <text x={pt.x} y={chartHeight + 20} fill="#94a3b8" fontSize="11" fontWeight="600" textAnchor="middle">
                  {pt.month}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* 🥧 Graph 2: Active Subscribers & Tier Distribution Donut / Pie Chart */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChartIcon size={18} color="#06b6d4" />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Active Subscriber Tier Distribution</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Proportional breakdown across plan tiers</p>
          </div>
          <span className="badge badge-primary">{totalCount} Active</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '20px', alignItems: 'center', minHeight: '200px' }}>
          
          {/* Donut / Pie SVG */}
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {donutSegments.map((seg, idx) => (
                <path
                  key={idx}
                  d={seg.path}
                  fill={seg.color}
                  stroke="var(--bg-dark)"
                  strokeWidth="3"
                  style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                />
              ))}
              {/* Inner Hole for Donut Effect */}
              <circle cx="100" cy="100" r="45" fill="var(--bg-card)" />
            </svg>

            {/* Center Donut Label */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{totalCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active</div>
            </div>
          </div>

          {/* Pie Chart Legend & Breakdown Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {donutSegments.map((seg, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: seg.color }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{seg.planName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{seg.count} subscriber{seg.count > 1 ? 's' : ''} ({seg.percentage}%)</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#10b981' }}>
                  ${seg.revenue.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
}
