import React, { useState } from 'react';

export default function StaticCountrySidebar({
  selectedCountry,
  countryData,
  onClose,
  getFlagEmoji,
  selectedOperator,
  onSelectOperator,
  activeTab,
  setActiveTab
}) {
  const [isDemographicsOpen, setIsDemographicsOpen] = useState(false);

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

  const numOps = countryData.num_operators || (countryData.operators ? countryData.operators.length : 0);

  return (
    <div className="static-context-sidebar">
      {/* Back Button(s) at the Top */}
      <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          className="filter-btn"
          onClick={() => {
            if (selectedOperator) {
              onSelectOperator(null);
            } else {
              onClose();
            }
          }}
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
          {selectedOperator ? `← Back to ${selectedCountry}` : '← Back to Map'}
        </button>

        {selectedOperator && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline',
              textAlign: 'center',
              width: '100%',
              padding: '2px 0',
              transition: 'color 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--blue-light)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back to Map
          </button>
        )}
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

      {/* Static Country Context List */}
      <div className="sidebar-metrics" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Country Context
        </div>

        {/* 1. OPERATORS BLOCK (Always Visible) */}
        <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Operators ({numOps})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {countryData.operators ? [...countryData.operators]
              .sort((a, b) => a.operator.localeCompare(b.operator))
              .map(o => {
                const isSelected = selectedOperator === o.operator;
                return (
                  <button
                    key={o.operator}
                    onClick={() => {
                      onSelectOperator(isSelected ? null : o.operator);
                    }}
                    style={{
                      background: isSelected ? 'var(--blue)' : 'var(--bg-card)',
                      color: isSelected ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-card3)';
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-card)';
                    }}
                  >
                    {o.operator}
                  </button>
                );
              }) : '—'}
          </div>
        </div>

        {/* Single Line GDP Growth Context */}
        <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>GDP Growth (Annual)</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{fmt(countryData.gdp_growth_pct, '%', 1)}</span>
        </div>

        {/* 2. COUNTRY DEMOGRAPHICS BLOCK (Collapsible, Collapsed by Default) */}
        <div style={{ marginTop: '2px' }}>
          <button
            onClick={() => setIsDemographicsOpen(!isDemographicsOpen)}
            style={{
              width: '100%',
              background: 'var(--bg-card2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-card2)'}
          >
            <span>Country Demographics</span>
            <span style={{ fontSize: '10px', transform: isDemographicsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--text-muted)' }}>
              ▼
            </span>
          </button>

          {isDemographicsOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Age</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {fmt(countryData.avg_age, ' yrs', 1)}
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
                <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Internet Penetration</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {fmt(countryData.internet_users_pct, '%')}
                </div>
              </div>

              <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mobile Penetration</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {fmt(countryData.mobile_penetration_pct, '%')}
                </div>
              </div>

              <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mobile Subscribers</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {fmt(countryData.mobile_users_mln, 'M', 1)}
                </div>
              </div>

              <div className="sidebar-metric-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Population</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {fmt(countryData.population_mln, 'M', 1)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INTELLIGENCE VIEWS (Placed BELOW Country Demographics) */}
        {setActiveTab && (
          <div style={{ marginTop: '6px', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Intelligence Views
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                { key: 'operators', label: 'Operator Details' },
                { key: 'overview', label: 'Market Overview' },
                { key: 'account', label: 'Account Section' },
                { key: 'stats', label: 'Stats Profile' },
                { key: 'narrative', label: 'Narrative Report' }
              ].map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: isActive ? '1px solid var(--blue)' : '1px solid var(--border)',
                      background: isActive ? 'var(--blue)' : 'var(--bg-card)',
                      color: isActive ? '#ffffff' : 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.25)' : 'none'
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-card3)';
                        e.currentTarget.style.borderColor = 'var(--blue-light)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-card)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }
                    }}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

