import React from 'react';

export default function StaticCountrySidebar({
  selectedCountry,
  countryData,
  onClose,
  getFlagEmoji
}) {
  if (!selectedCountry || !countryData) return null;

  // Formatting helpers matching SidePanel
  const fmt = (val, unit, decimals = 0) => {
    if (val === null || val === undefined) return '—';
    const n = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(n)) return '—';
    return n.toFixed(decimals) + unit;
  };

  const fmtNum = (val) => {
    if (!val) return '—';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
    return val.toFixed(0);
  };

  return (
    <div className="static-context-sidebar">
      {/* Back to Map Button at the Top */}
      <div style={{ marginBottom: '10px' }}>
        <button
          className="filter-btn"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            background: 'var(--blue)',
            color: 'white',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center',
            fontSize: '12px',
            display: 'block',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--blue-light)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--blue)'}
        >
          ← Back to Global Map
        </button>
      </div>

      {/* Sidebar Header */}
      <div className="sidebar-header" style={{ position: 'relative', marginTop: '5px' }}>
        <div className="sidebar-title" style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getFlagEmoji(countryData.iso)} {selectedCountry}
        </div>
        <div className="sidebar-subtitle" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {countryData.region} {countryData.sub_region ? ' · ' + countryData.sub_region : ''}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

      {/* Static Country Metrics List */}
      <div className="sidebar-metrics" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Country Context
        </div>

        <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Operators ({countryData.num_operators})</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--blue)', marginTop: '2px', wordBreak: 'break-word' }}>
            {countryData.operators?.map(o => o.operator).join(', ') || '—'}
          </div>
        </div>

        <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Population</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
            {fmt(countryData.population_mln, 'M', 1)}
          </div>
        </div>

        <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mobile Subscribers</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
            {fmt(countryData.mobile_users_mln, 'M', 1)}
          </div>
        </div>

        <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mobile Penetration</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
            {fmt(countryData.mobile_penetration_pct, '%')}
          </div>
        </div>

        <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GDP Growth (Annual)</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
            {fmt(countryData.gdp_growth_pct, '%', 1)}
          </div>
        </div>

        <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GDP per Capita (USD)</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
            ${fmtNum(countryData.gdp_per_capita_usd)}
          </div>
        </div>

        <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Age</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
            {fmt(countryData.avg_age, ' yrs', 1)}
          </div>
        </div>

        <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Internet Penetration</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
            {fmt(countryData.internet_users_pct, '%')}
          </div>
        </div>
      </div>
    </div>
  );
}
