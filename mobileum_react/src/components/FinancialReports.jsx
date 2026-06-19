import React from 'react';

export default function FinancialReports({ operator }) {
  // Generate some realistic-looking mock data based on operator name
  const generateMockData = () => {
    // Deterministic mock generation based on string length
    const opLength = operator ? operator.length : 5;
    const revBase = 100 + (opLength * 10);
    
    return {
      annual: {
        revenue: `$${revBase.toFixed(1)}M`,
        yoyGrowth: `+${(2 + opLength * 0.5).toFixed(1)}%`,
        ebitda: `$${(revBase * 0.35).toFixed(1)}M`,
        churnRate: `${(1 + opLength * 0.1).toFixed(1)}%`,
        arpu: `$${(12 + opLength * 0.8).toFixed(2)}`,
        highlights: [
          `Exceeded international roaming targets by ${(opLength * 1.5).toFixed(1)}%`,
          'Successful phase 1 deployment of 5G Standalone core architecture',
          `Reduced overall subscriber churn by 0.5% through targeted ML-driven retention`
        ]
      },
      quarterly: [
        { q: 'Q1 2025', revenue: `$${(revBase * 0.23).toFixed(1)}M`, growth: '+2.1%', netAdds: `${120 + opLength * 5}k`, status: 'completed' },
        { q: 'Q2 2025', revenue: `$${(revBase * 0.24).toFixed(1)}M`, growth: '+3.4%', netAdds: `${150 + opLength * 6}k`, status: 'completed' },
        { q: 'Q3 2025', revenue: `$${(revBase * 0.26).toFixed(1)}M`, growth: '+4.2%', netAdds: `${180 + opLength * 8}k`, status: 'completed' },
        { q: 'Q4 2025', revenue: `$${(revBase * 0.27).toFixed(1)}M`, growth: '+2.7%', netAdds: `${140 + opLength * 4}k`, status: 'projected' }
      ]
    };
  };

  const data = generateMockData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
      
      {/* Annual Report Card */}
      <div className="section" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 {operator} Annual Performance Report
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-card2)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            FY 2025 (Projected)
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Revenue', value: data.annual.revenue, trend: `↗ ${data.annual.yoyGrowth} YoY`, trendColor: 'var(--green)' },
            { label: 'EBITDA', value: data.annual.ebitda, trend: 'Stable', trendColor: 'var(--text-muted)' },
            { label: 'Blended ARPU', value: data.annual.arpu, trend: '↗ +1.2%', trendColor: 'var(--green)' },
            { label: 'Churn Rate', value: data.annual.churnRate, trend: '↘ -0.5%', trendColor: 'var(--green)' }
          ].map((stat, idx) => (
            <div key={idx} style={{ background: 'var(--bg-card2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', transition: 'transform 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{stat.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: stat.trendColor, marginTop: '6px', fontWeight: '600' }}>{stat.trend}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--blue)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Strategic Highlights</div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.7' }}>
            {data.annual.highlights.map((h, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{h}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quarterly Breakdown Card */}
      <div className="section" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📈 Quarterly Financial Breakdown
          </div>
        </div>
        
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card2)' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Quarter</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Revenue</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>QoQ Growth</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Net Adds</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.quarterly.map((metrics, i) => (
                <tr key={i} style={{ borderBottom: i === data.quarterly.length - 1 ? 'none' : '1px solid var(--border)', background: metrics.status === 'projected' ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{metrics.q}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{metrics.revenue}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--green)', fontWeight: '600' }}>↗ {metrics.growth}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{metrics.netAdds}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: '700', 
                      textTransform: 'uppercase', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      background: metrics.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: metrics.status === 'completed' ? 'var(--green)' : 'var(--yellow)'
                    }}>
                      {metrics.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
