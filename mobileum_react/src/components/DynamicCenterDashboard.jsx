import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import CustomerServiceTickets from './CustomerServiceTickets';
import OutstandingAMCTable from './OutstandingAMCTable';
import CompetitorsTable from './CompetitorsTable';

const CLUSTER_COLORS = {
  'Ultra-Premium Roaming Hub': '#9B59B6',
  'Mature Mid-Tier': '#4A90D9',
  'High Growth Corridor': '#F39C12',
  'Emerging Mid-Tier': '#1ABC9C',
  'Small Wealthy Market': '#2ECC71',
  'Frontier Market': '#E74C3C',
  'Regulatory Transition': '#7F8C8D',
  'Mature & Saturated': '#9B59B6',
  'High Growth Exposed': '#F39C12',
  'Roaming Hub': '#1ABC9C',
  'Emerging Opportunity': '#2ECC71',
  'Unknown': '#7F8C8D'
};

export default function DynamicCenterDashboard({
  selectedCountry,
  countryData,
  allCountries,
  metadata,
  getFlagEmoji,
  theme,
  ticketData,
  amcData,
  competitorData,
  isDataLoading
}) {
  const [activeTab, setActiveTab] = useState('operators');
  const [selectedOperator, setSelectedOperator] = useState(null);
  const chartRefs = useRef({});

  // Refs for the chart canvases
  const overviewRadarRef = useRef(null);
  const operatorsDoughnutRef = useRef(null);
  const operatorsScatterRef = useRef(null);
  const impactRadarRef = useRef(null);
  const impactWaterfallRef = useRef(null);
  const productsBarRef = useRef(null);
  const statsBubbleRef = useRef(null);

  // Panel ref for scroll reset
  const panelRef = useRef(null);

  // Reset tab on country change
  useEffect(() => {
    setActiveTab('operators');
    setSelectedOperator(null);
  }, [selectedCountry]);

  // Reset operator selection on tab change
  useEffect(() => {
    setSelectedOperator(null);
  }, [activeTab]);

  // Reset scroll position of the panel when active tab or country changes
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [activeTab, selectedCountry]);

  // Handle Chart rendering when activeTab or selectedCountry changes
  useEffect(() => {
    if (!selectedCountry || !countryData) return;

    // Destroy existing charts
    Object.keys(chartRefs.current).forEach(key => {
      if (chartRefs.current[key]) {
        chartRefs.current[key].destroy();
        chartRefs.current[key] = null;
      }
    });

    const isDark = document.documentElement.classList.contains('dark-theme');
    const labelColor = isDark ? '#8ba3c7' : '#475569';
    const gridColor = isDark ? '#1e3054' : '#cbd5e1';
    const tooltipBg = isDark ? 'rgba(13,22,40,0.95)' : 'rgba(255,255,255,0.95)';
    const tooltipBorder = isDark ? '#1e3054' : '#cbd5e1';
    const tooltipText = isDark ? '#8ba3c7' : '#475569';
    const tooltipTitle = isDark ? '#f0f4ff' : '#0f172a';

    const axisStyle = () => ({
      grid: { color: gridColor },
      ticks: { color: labelColor, font: { size: 9 } },
      border: { color: gridColor }
    });

    const tooltipStyle = () => ({
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      titleColor: tooltipTitle,
      bodyColor: tooltipText,
      cornerRadius: 6,
      padding: 8,
      titleFont: { size: 11, family: 'Inter' },
      bodyFont: { size: 10, family: 'Inter' }
    });

    // ─── OVERVIEW TAB CHARTS ───
    if (activeTab === 'overview') {
      const canvas = overviewRadarRef.current;
      if (canvas && countryData.radar) {
        const ctx = canvas.getContext('2d');
        const r = countryData.radar;
        chartRefs.current['overview_radar'] = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Roaming Opp.', 'Fraud Risk', '5G Upsell', 'ARPU Pressure', 'Sub Growth', 'Regulatory'],
            datasets: [{
              label: selectedCountry,
              data: [r.roaming_opportunity, r.fraud_risk, r.fiveG_upsell, r.arpu_pressure, r.subscriber_growth, r.regulatory_risk],
              backgroundColor: 'rgba(59,130,246,0.2)',
              borderColor: '#3b82f6',
              borderWidth: 2,
              pointBackgroundColor: '#3b82f6',
              pointRadius: 3,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: labelColor, font: { size: 9 }, boxWidth: 8 } },
              tooltip: tooltipStyle()
            },
            scales: {
              r: {
                min: 0,
                max: 5,
                grid: { color: gridColor },
                ticks: { display: false, stepSize: 1 },
                pointLabels: { color: labelColor, font: { size: 9 } },
                angleLines: { color: gridColor }
              }
            }
          }
        });
      }
    }

    // ─── OPERATORS TAB CHARTS ───
    if (activeTab === 'operators') {
      const ops = (countryData.operators || []).filter(o => o.market_share_pct);
      const doughnutCanvas = operatorsDoughnutRef.current;
      if (doughnutCanvas && ops.length) {
        const ctx = doughnutCanvas.getContext('2d');
        chartRefs.current['operators_doughnut'] = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ops.map(o => o.operator),
            datasets: [{
              data: ops.map(o => parseFloat(o.market_share_pct) || 0),
              backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
              borderColor: isDark ? '#0d1628' : '#ffffff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: labelColor, font: { size: 9 }, boxWidth: 8 } },
              tooltip: tooltipStyle()
            }
          }
        });
      }

      const sOps = (countryData.operators || []).filter(o => o.revenue_growth_score && o.sub_base_mln);
      const scatterCanvas = operatorsScatterRef.current;
      if (scatterCanvas && sOps.length) {
        const ctx = scatterCanvas.getContext('2d');
        chartRefs.current['operators_scatter'] = new Chart(ctx, {
          type: 'bubble',
          data: {
            datasets: sOps.map((o, i) => ({
              label: o.operator,
              data: [{
                x: parseFloat(o.market_share_pct) || 0,
                y: o.revenue_growth_score,
                r: Math.max(5, Math.min(20, (o.sub_base_mln || 1) / 30))
              }],
              backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5] + '99',
              borderColor: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5],
            }))
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: tooltipStyle()
            },
            scales: {
              x: {
                title: { display: true, text: 'Market Share %', color: labelColor, font: { size: 9 } },
                ...axisStyle()
              },
              y: {
                title: { display: true, text: 'Rev Growth Score', color: labelColor, font: { size: 9 } },
                min: 0,
                max: 6,
                ...axisStyle()
              }
            }
          }
        });
      }
    }

    // ─── IMPACT TAB CHARTS ───
    if (activeTab === 'impact') {
      const radarCanvas = impactRadarRef.current;
      if (radarCanvas && countryData.radar) {
        const ctx = radarCanvas.getContext('2d');
        const r = countryData.radar;
        const regAvg = countryData.regional_averages;

        chartRefs.current['impact_radar'] = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Roaming Opp.', 'Fraud Risk', '5G Upsell', 'ARPU Pressure', 'Sub Growth', 'Reg. Risk'],
            datasets: [
              {
                label: selectedCountry,
                data: [r.roaming_opportunity, r.fraud_risk, r.fiveG_upsell, r.arpu_pressure, r.subscriber_growth, r.regulatory_risk],
                backgroundColor: 'rgba(59,130,246,0.2)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 3,
              },
              {
                label: 'Regional Avg',
                data: [3, 2.6, (regAvg?.avg_5g || 31) / 20, 3, 2, 2.5],
                backgroundColor: 'rgba(16,185,129,0.1)',
                borderColor: '#10b98177',
                borderWidth: 1.5,
                pointBackgroundColor: '#10b981',
                pointRadius: 2,
                borderDash: [4, 3],
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: tooltipStyle()
            },
            scales: {
              r: {
                min: 0,
                max: 5,
                grid: { color: gridColor },
                ticks: { display: false },
                pointLabels: { color: labelColor, font: { size: 9 } },
                angleLines: { color: gridColor }
              }
            }
          }
        });
      }

      const wf = countryData.waterfall;
      const wfCanvas = impactWaterfallRef.current;
      if (wfCanvas && wf) {
        const ctx = wfCanvas.getContext('2d');
        const labels = ['Baseline', 'OTT Loss', 'ARPU Comp.', 'Churn Drag', 'Roaming Up', '5G Upside', 'Net'];
        const rawVals = [wf.base, wf.ott_substitution, wf.arpu_compression, wf.churn_pressure, wf.roaming_upside, wf.fiveG_upside, wf.net];
        const colors = rawVals.map((v, i) => {
          if (i === 0 || i === labels.length - 1) return '#3b82f6';
          return v >= 0 ? '#10b981' : '#ef4444';
        });

        chartRefs.current['impact_waterfall'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              data: rawVals.map(v => Math.abs(v)),
              backgroundColor: colors,
              borderRadius: 4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...tooltipStyle(),
                callbacks: {
                  label: (context) => {
                    const val = rawVals[context.dataIndex];
                    return ` ${val >= 0 ? '+' : ''}${val}%`;
                  }
                }
              }
            },
            scales: {
              x: axisStyle(),
              y: {
                ...axisStyle(),
                title: { display: true, text: 'Revenue Index', color: labelColor, font: { size: 9 } }
              }
            }
          }
        });
      }
    }

    // ─── PRODUCTS TAB CHARTS ───
    if (activeTab === 'products') {
      const products = countryData.product_ranking || [];
      const barCanvas = productsBarRef.current;
      if (barCanvas && products.length) {
        const ctx = barCanvas.getContext('2d');
        chartRefs.current['products_bar'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: products.map(p => (p.product || '').replace('–', '-').substring(0, 22)),
            datasets: [{
              data: products.map(p => p.score),
              backgroundColor: products.map(p =>
                p.score > 75 ? '#10b98166' : p.score > 50 ? '#f59e0b66' : '#3b82f666'),
              borderColor: products.map(p =>
                p.score > 75 ? '#10b981' : p.score > 50 ? '#f59e0b' : '#3b82f6'),
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: tooltipStyle()
            },
            scales: {
              x: { ...axisStyle(), min: 0, max: 100, title: { display: true, text: 'Fit Score', color: labelColor, font: { size: 9 } } },
              y: {
                ...axisStyle(),
                ticks: { color: labelColor, font: { size: 9 } }
              }
            }
          }
        });
      }
    }

    // ─── STATISTICS TAB CHARTS ───
    if (activeTab === 'stats') {
      const regionPeers = Object.entries(allCountries)
        .filter(([_, cv]) => cv.region === countryData.region)
        .slice(0, 20);
      const bubbleCanvas = statsBubbleRef.current;
      if (bubbleCanvas && regionPeers.length) {
        const ctx = bubbleCanvas.getContext('2d');
        chartRefs.current['stats_bubble'] = new Chart(ctx, {
          type: 'bubble',
          data: {
            datasets: regionPeers.map(([cn, cv]) => ({
              label: cn,
              data: [{
                x: cv.mobile_penetration_pct || 0,
                y: cv.gdp_growth_pct || 0,
                r: Math.max(4, Math.min(18, (cv.population_mln || 1) / 50))
              }],
              backgroundColor: cn === selectedCountry
                ? '#f59e0bcc'
                : (CLUSTER_COLORS[cv.cluster_name] || '#3b82f6') + '55',
              borderColor: cn === selectedCountry ? '#f59e0b' : 'transparent',
              borderWidth: cn === selectedCountry ? 2 : 0,
            }))
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...tooltipStyle(),
                callbacks: {
                  label: (context) => {
                    const d = context.raw;
                    return ` ${context.dataset.label}: Pen=${d.x}% GDP=${d.y}%`;
                  }
                }
              }
            },
            scales: {
              x: { ...axisStyle(), title: { display: true, text: 'Mobile Penetration %', color: labelColor, font: { size: 9 } } },
              y: { ...axisStyle(), title: { display: true, text: 'GDP Growth %', color: labelColor, font: { size: 9 } } }
            }
          }
        });
      }
    }

    return () => {
      Object.keys(chartRefs.current).forEach(key => {
        if (chartRefs.current[key]) {
          chartRefs.current[key].destroy();
          chartRefs.current[key] = null;
        }
      });
    };
  }, [selectedCountry, countryData, activeTab, theme]);

  if (!selectedCountry || !countryData) return null;

  const clr = CLUSTER_COLORS[countryData.cluster_name] || '#4A90D9';

  const hmColor = (score) => {
    const s = Math.max(0, Math.min(100, score || 0));
    if (s < 20) return '#ef4444';
    if (s < 40) return '#f59e0b';
    if (s < 60) return '#3b82f6';
    if (s < 80) return '#10b981';
    return '#06d6a0';
  };

  const trendToScore = (val) => {
    if (!val || val === 'nan') return 3;
    const v = val.toLowerCase();
    if (v.includes('very high') || v.includes('major') || v.includes('strongly')) return 5;
    if (v.includes('high') || v.includes('growing') || v.includes('up') || v.includes('increasing')) return 4;
    if (v.includes('moderate') || v.includes('stable') || v.includes('flat') || v.includes('marginal')) return 3;
    if (v.includes('low') || v.includes('declining') || v.includes('down') || v.includes('decreasing')) return 2;
    if (v.includes('very low') || v.includes('none') || v.includes('minimal')) return 1;
    return 3;
  };

  return (
    <div className="dynamic-center-panel">
      {/* Centered Panel Header */}
      <div id="panel-header" style={{ padding: '0 0 12px 0', borderBottom: '1px solid var(--border)', background: 'transparent', flexShrink: 0, animation: 'none', opacity: 1, transform: 'none' }}>
        <div id="panel-title" style={{ fontSize: '24px', fontWeight: '800' }}>
          {getFlagEmoji(countryData.iso)} {selectedCountry} Operator Details
        </div>
        <div id="panel-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Active intelligence, operator benchmarks, support service levels, and competitor analytics.
        </div>
      </div>

      {/* Tabs list matching SidePanel but centered and responsive */}
      <div id="panel-tabs" style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', zIndex: 10, flexShrink: 0, animation: 'none', opacity: 1, transform: 'none' }}>
        {[
          { key: 'operators', label: 'Operator Details' },
          { key: 'overview', label: 'Market Overview' },
          { key: 'impact', label: 'Impact Analysis' },
          { key: 'products', label: 'Product Fit' },
          { key: 'support_finance', label: 'Support & AMC' },
          { key: 'competitors', label: 'Competitors' },
          { key: 'stats', label: 'Stats Profile' },
          { key: 'narrative', label: 'Narrative Report' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            style={{ fontSize: '12px', padding: '12px 16px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Container for Tab Contents */}
      <div className="dynamic-center-content" ref={panelRef}>

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
          <div style={{ padding: '0 0 12px 0' }}>
            <span
              className="cluster-tag"
              style={{
                background: `${clr}22`,
                color: clr,
                border: `1px solid ${clr}44`,
                padding: '4px 10px',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '11px'
              }}
            >
              ◈ {countryData.cluster_name}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
              {metadata.cluster_definitions?.[countryData.cluster_name] || ''}
            </span>
          </div>

          {countryData.anomaly_text && (
            <div className="anomaly-box" style={{ padding: '12px', borderRadius: '10px' }}>
              <div className="anomaly-icon" style={{ fontSize: '16px' }}>⚠</div>
              <div style={{ fontSize: '12px', lineHeight: '1.5' }}>{countryData.anomaly_text}</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '10px' }}>
            {countryData.top_product && (
              <div className="section" style={{ marginBottom: '0' }}>
                <div className="section-title">Primary Strategic Recommendation</div>
                <div className="product-card top" style={{ padding: '16px', borderRadius: '12px' }}>
                  <div className="product-top-badge" style={{ padding: '3px 10px', fontSize: '10px' }}>★ #1 RECOMMENDED FIT</div>
                  <div className="product-name" style={{ fontSize: '16px', marginTop: '6px' }}>{countryData.top_product.product}</div>
                  <div className="score-bar-wrap">
                    <div className="score-bar-bg">
                      <div
                        className="score-bar-fill"
                        style={{
                          width: `${countryData.top_product.score}%`,
                          background: countryData.top_product.score > 75 ? '#10b981' : countryData.top_product.score > 50 ? '#f59e0b' : '#3b82f6'
                        }}
                      ></div>
                    </div>
                    <div className="score-num">{countryData.top_product.score}/100</div>
                  </div>
                  <div className="product-reason" style={{ fontSize: '11px', marginTop: '8px' }}>{countryData.top_product.reason}</div>
                </div>
              </div>
            )}

            <div className="chart-wrap" style={{ margin: '0' }}>
              <div className="chart-title">Impact Dimensions Overview</div>
              <div className="chart-canvas-wrap" style={{ height: '200px' }}>
                <canvas ref={overviewRadarRef} id="overview_radar"></canvas>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: OPERATORS ── */}
      {activeTab === 'operators' && (
        <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
          
          {/* Heatmap displayed first */}
          <div className="section">
            <div className="section-title">Operator Performance Heatmap (Click any row for details)</div>
            <div className="heatmap-wrap" style={{ border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-card)', padding: '6px' }}>
              <table className="heatmap-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Operator</th>
                    <th>Subs (M)</th>
                    <th>5G %</th>
                    <th>Sub Growth</th>
                    <th>ARPU</th>
                    <th>Revenue</th>
                    <th>Profitability</th>
                    <th>Outbound</th>
                    <th>Inbound</th>
                  </tr>
                </thead>
                <tbody>
                  {(countryData.operators || []).map((op, idx) => {
                    const cells = [
                      { val: op.sub_base_mln, fmt: v => v ? v + 'M' : '—', score: null },
                      { val: op.fiveG_pct, fmt: v => v !== null ? v + '%' : '—', score: op.fiveG_pct },
                      { val: op.subscriber_growth_pct, fmt: v => v !== null ? v + '%' : '—', score: (op.subscriber_growth_pct || 0) + 5 },
                      { val: op.arpu_growth_score, fmt: () => op.arpu_growth || '—', score: op.arpu_growth_score * 20 },
                      { val: op.revenue_growth_score, fmt: () => op.revenue_growth || '—', score: op.revenue_growth_score * 20 },
                      { val: op.profitability_score, fmt: () => op.profitability || '—', score: op.profitability_score * 20 },
                      { val: op.outbound_roaming_score, fmt: () => op.outbound_roaming || '—', score: op.outbound_roaming_score * 20 },
                      { val: op.inbound_roaming_score, fmt: () => op.inbound_roaming || '—', score: op.inbound_roaming_score * 20 },
                    ];

                    const isSelected = selectedOperator === op.operator;

                    return (
                      <tr 
                        key={idx} 
                        style={{ cursor: 'pointer', background: isSelected ? 'rgba(37, 99, 235, 0.15)' : '' }}
                        onClick={() => setSelectedOperator(op.operator)}
                      >
                        <td className="hm-op-name" style={{ borderLeft: isSelected ? '4px solid var(--blue)' : '' }}>
                          <div className="op-name" style={{ fontSize: '11px' }}>{op.operator}</div>
                          <div className="op-sub">{op.prepaid_postpaid || ''}</div>
                        </td>
                        {cells.map((cell, cidx) => {
                          const sc = cell.score;
                          const bg = sc === null ? '' : hmColor(sc);
                          const textClr = sc !== null && sc < 35 ? '#fff' : sc > 65 ? '#0f172a' : 'inherit';
                          return (
                            <td
                              key={cidx}
                              style={{
                                background: bg,
                                color: textClr,
                                fontWeight: sc !== null ? '600' : 'normal',
                                padding: '8px'
                              }}
                            >
                              {cell.fmt(cell.val)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Click Details Panel for selectedOperator */}
          {selectedOperator && (() => {
            const filteredAMC = amcData.filter(row => {
              const client = row.client_name.toLowerCase();
              const op = selectedOperator.toLowerCase();
              return client.includes(op) || op.includes(client);
            });

            const getCustomVersus = (compName, opName) => {
              switch (compName.toLowerCase()) {
                case 'syniverse':
                  return `At ${opName}, Syniverse has legacy clearing connectivity, but Mobileum's modern AI Steering of Roaming (SoR) and Roaming DNA offer advanced QoE analytics and real-time steering.`;
                case 'tomia':
                  return `Tomia focuses on basic settlement margins. Mobileum offers integrated signaling firewall security and eSIM testing, protecting ${opName} from bypass losses.`;
                case 'subex':
                  return `Subex has legacy assurance deployments. Mobileum's RAID 9 SaaS-ready platform provides faster detection of bypass and SIM-box fraud for ${opName}.`;
                case 'bics':
                  return `BICS is a routing partner but competes on active testing. Mobileum Universal Active Roaming Testing provides superior QoS assurance for ${opName}.`;
                default:
                  return `Mobileum offers superior SaaS-ready analytics and real-time active intelligence compared to traditional vendor solutions.`;
              }
            };

            return (
              <div className="operator-click-details-panel" style={{
                background: 'var(--bg-card)',
                border: '2px solid var(--blue)',
                borderRadius: '12px',
                padding: '16px',
                margin: '20px 0',
                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.1)',
                animation: 'fadeIn 0.25s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <span style={{ color: 'var(--blue)' }}>💼</span> {selectedOperator} — Financial Contracts (AMC) & Competitors
                  </h4>
                  <button 
                    onClick={() => setSelectedOperator(null)}
                    style={{
                      background: 'var(--bg-card2)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                  >
                    ✕ Close details
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
                  {/* Column 1: AMC Contracts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Outstanding AMC Contracts
                    </div>
                    {filteredAMC.length > 0 ? (
                      <div style={{ overflowX: 'auto', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px' }}>
                        <table className="op-table" style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Contract ID</th>
                              <th>Business Unit</th>
                              <th style={{ textAlign: 'right' }}>Value</th>
                              <th>Due Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAMC.map(row => (
                              <tr key={row.contract_id}>
                                <td style={{ fontFamily: 'monospace', fontWeight: '700' }}>{row.contract_id}</td>
                                <td>
                                  <span style={{ background: 'var(--bg-card3)', color: 'var(--text-primary)', padding: '1px 4px', borderRadius: '3px', fontSize: '9px' }}>
                                    {row.business_unit}
                                  </span>
                                </td>
                                <td style={{ fontWeight: '700', color: 'var(--green)', textAlign: 'right' }}>
                                  ${row.outstanding_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </td>
                                <td style={{ color: 'var(--text-muted)' }}>{row.due_date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                        No outstanding AMC contracts found for {selectedOperator} in this market.
                      </div>
                    )}
                  </div>

                  {/* Column 2: Competitor Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Active Competitors & Mobileum Edge
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      {competitorData.map(comp => (
                        <div key={comp.name} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', fontSize: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{comp.name}</strong>
                            <span style={{
                              fontSize: '8px',
                              fontWeight: '700',
                              background: comp.category.toLowerCase().includes('direct') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                              color: comp.category.toLowerCase().includes('direct') ? 'var(--red)' : 'var(--blue-light)',
                              padding: '1px 6px',
                              borderRadius: '10px'
                            }}>
                              {comp.category}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                            <strong>Key offering:</strong> {comp.key_offerings}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px', borderTop: '1px dashed var(--border)', paddingTop: '2px' }}>
                            <strong>Mobileum Edge:</strong> {getCustomVersus(comp.name, selectedOperator)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Charts displayed below Heatmap */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="chart-wrap">
              <div className="chart-title">Market Share Distribution</div>
              <div style={{ height: '180px' }}>
                <canvas ref={operatorsDoughnutRef} id="operators_doughnut"></canvas>
              </div>
            </div>
            <div className="chart-wrap">
              <div className="chart-title">Revenue Index vs Share Bubble Chart</div>
              <div style={{ height: '180px' }}>
                <canvas ref={operatorsScatterRef} id="operators_scatter"></canvas>
              </div>
            </div>
          </div>

          {/* Individual profiles displayed at the bottom */}
          <div className="section" style={{ marginTop: '20px' }}>
            <div className="section-title">Individual Operator Profiles (Click card for details)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
              {(countryData.operators || []).map((op, idx) => {
                const capexText = op.capex_investment !== 'nan' ? op.capex_investment : '—';
                const isSelected = selectedOperator === op.operator;
                return (
                  <div 
                    className="product-card" 
                    key={idx} 
                    style={{ 
                      margin: '0', 
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--blue)' : 'var(--border)',
                      borderWidth: isSelected ? '2px' : '1px',
                      background: isSelected ? 'rgba(37, 99, 235, 0.05)' : ''
                    }}
                    onClick={() => setSelectedOperator(op.operator)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="product-name" style={{ fontSize: '14px' }}>{op.operator}</div>
                        <div className="product-cat">
                          {op.sub_base_mln ? op.sub_base_mln + 'M subs · ' : ''}
                          {op.market_share_pct || '?'}% share
                        </div>
                      </div>
                      <div
                        className="score-circle"
                        style={{
                          borderColor: hmColor(op.profitability_score * 20),
                          color: hmColor(op.profitability_score * 20),
                          fontSize: '9px',
                          width: '40px',
                          height: '40px',
                          flexDirection: 'column',
                          gap: '1px'
                        }}
                      >
                        <div>{op.profitability_score}/5</div>
                        <div style={{ fontSize: '7px' }}>HLTH</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                      <div>📶 5G: <strong style={{ color: 'var(--text-primary)' }}>{op.fiveG_pct !== null ? op.fiveG_pct + '%' : '—'}</strong></div>
                      <div>📈 ARPU: <strong style={{ color: 'var(--text-primary)' }}>{op.arpu_growth || '—'}</strong></div>
                      <div>🔄 Sub Growth: <strong style={{ color: 'var(--text-primary)' }}>{op.subscriber_growth_pct !== null ? op.subscriber_growth_pct + '%' : '—'}</strong></div>
                      <div>💰 Capex: <strong style={{ color: 'var(--text-primary)' }}>{capexText.length > 25 ? capexText.substring(0, 22) + '…' : capexText}</strong></div>
                      <div>🌍 Outbound: <strong style={{ color: 'var(--text-primary)' }}>{(op.outbound_roaming || '—').substring(0, 15)}</strong></div>
                      <div>✈️ Top Routes: <strong style={{ color: 'var(--text-primary)' }}>{(op.top_roaming_countries || '—').substring(0, 20)}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: IMPACT ── */}
      {activeTab === 'impact' && (
        <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="chart-wrap">
              <div className="chart-title">Impact Radar — Country vs Regional Average</div>
              <div className="chart-canvas-wrap" style={{ height: '240px' }}>
                <canvas ref={impactRadarRef} id="impact_radar"></canvas>
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)' }}>
                  <div style={{ width: '12px', height: '3px', background: '#3b82f6', borderRadius: '2px' }}></div>{' '}
                  {selectedCountry}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)' }}>
                  <div style={{ width: '12px', height: '3px', background: '#10b981', borderRadius: '2px', opacity: '.6' }}></div>{' '}
                  Regional Avg
                </div>
              </div>
            </div>

            <div className="chart-wrap">
              <div className="chart-title">Revenue Opportunity Waterfall — Mobileum Impact</div>
              <div className="chart-canvas-wrap" style={{ height: '240px' }}>
                <canvas ref={impactWaterfallRef} id="impact_waterfall"></canvas>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
            <div className="section">
              <div className="section-title">Seasonal Roaming Calendar</div>
              <div className="cal-grid" style={{ gap: '4px' }}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                  const intensity = countryData.seasonal_roaming?.[i + 1] || 1;
                  const colors = ['var(--bg-card3)', 'var(--bg-card3)', '#1e4080', '#1a5276', '#1abc9c'];
                  const textColors = ['var(--text-secondary)', 'var(--text-secondary)', '#7fb3d3', '#fff', '#fff'];
                  return (
                    <div
                      key={m}
                      className="cal-month"
                      style={{
                        background: colors[intensity - 1] || colors[0],
                        color: textColors[intensity - 1] || textColors[0],
                        fontWeight: intensity >= 3 ? '600' : 'normal',
                        padding: '8px 2px'
                      }}
                      title={`${m}: ${['No data', 'Minimal', 'Low', 'Moderate', 'High', 'Peak'][intensity] || 'Normal'} roaming`}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                {['No data', 'Minimal', 'Moderate', 'High', 'Peak'].map((l, i) => {
                  const c = ['var(--bg-card3)', 'var(--bg-card3)', '#1e4080', '#1a5276', '#1abc9c'][i];
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)' }} key={l}>
                      <div style={{ width: '8px', height: '8px', background: c, borderRadius: '2px' }}></div>
                      {l}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="section">
              <div className="section-title">Impact Analysis Dimensions</div>
              {(() => {
                const dims = [
                  { label: 'Outbound Roaming Impact', key: 'ia_outbound_impact' },
                  { label: 'Inbound Roaming Impact', key: 'ia_inbound_impact' },
                  { label: 'ARPU Impact', key: 'ia_arpu_impact' },
                  { label: 'App/OTT Substitution', key: 'ia_apps' },
                  { label: 'Revenue Growth Outlook', key: 'ia_rev_growth' },
                  { label: 'Profitability Outlook', key: 'ia_profitability' }
                ];

                const op0 = (countryData.operators && countryData.operators[0]) || {};
                return dims.map(d => {
                  const val = op0[d.key] || '—';
                  const score = trendToScore(val);
                  const barClr = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#10b981'][score - 1] || '#3b82f6';
                  if (val === '—' || val === 'nan' || val === '') return null;
                  return (
                    <div key={d.key} style={{ marginBottom: '8px' }}>
                      <div className="percentile-row" style={{ marginBottom: '2px' }}>
                        <div className="perc-label" style={{ fontSize: '10px' }}>{d.label}</div>
                        <div className="perc-bar" style={{ height: '4px' }}>
                          <div className="perc-fill" style={{ width: `${(score / 5) * 100}%`, background: barClr }}></div>
                        </div>
                        <div className="perc-value" style={{ color: barClr, fontSize: '10px' }}>{score}/5</div>
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '128px' }}>
                        {val.substring(0, 120)}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: PRODUCTS (MOBILEUM FIT) ── */}
      {activeTab === 'products' && (
        <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            <div className="chart-wrap">
              <div className="chart-title">Product Fit Score — All Mobileum Solutions</div>
              <div className="chart-canvas-wrap" style={{ height: '260px' }}>
                <canvas ref={productsBarRef} id="products_bar"></canvas>
              </div>
            </div>

            <div className="section">
              <div className="section-title">Priority Recommendations</div>
              {(countryData.product_ranking || []).slice(0, 3).map((p, i) => {
                const isTop = i === 0;
                const barClr = p.score > 75 ? '#10b981' : p.score > 50 ? '#f59e0b' : '#3b82f6';
                return (
                  <div className={`product-card ${isTop ? 'top' : ''}`} key={p.product} style={{ padding: '10px 12px' }}>
                    {isTop ? (
                      <div className="product-top-badge">★ #1 BEST FIT</div>
                    ) : (
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        #{i + 1} RECOMMENDED
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="product-name" style={{ fontSize: '12px' }}>{p.product}</div>
                      <div className="score-circle" style={{ borderColor: barClr, color: barClr, width: '28px', height: '28px', fontSize: '9px' }}>
                        {p.score}
                      </div>
                    </div>
                    <div className="product-reason" style={{ fontSize: '10px', marginTop: '4px' }}>{p.reason}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section" style={{ marginTop: '20px' }}>
            <div className="section-title">Full Product Ranking Table</div>
            <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px' }}>
              <table className="op-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Product</th>
                    <th style={{ width: '100px' }}>Score</th>
                    <th>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {(countryData.product_ranking || []).map((p, i) => {
                    const barClr = p.score > 75 ? 'var(--green)' : p.score > 50 ? 'var(--yellow)' : 'var(--blue)';
                    return (
                      <tr key={p.product}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{i + 1}</td>
                        <td className="op-name" style={{ fontSize: '11px' }}>{p.product}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div className="score-bar-bg" style={{ width: '50px', height: '4px' }}>
                              <div className="score-bar-fill" style={{ width: `${p.score}%`, background: barClr, height: '100%' }}></div>
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: '600', color: barClr }}>
                              {p.score}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {p.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SUPPORT & AMC (NEW) ── */}
      {activeTab === 'support_finance' && (
        <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
          <CustomerServiceTickets ticketData={ticketData} isLoading={isDataLoading} />
          <OutstandingAMCTable amcData={amcData} isLoading={isDataLoading} />
        </div>
      )}

      {/* ── TAB: COMPETITORS (NEW) ── */}
      {activeTab === 'competitors' && (
        <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
          <CompetitorsTable competitorData={competitorData} />
        </div>
      )}

      {/* ── TAB: STATS PROFILE ── */}
      {activeTab === 'stats' && (
        <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            <div className="chart-wrap">
              <div className="chart-title">Position vs Region Peers Bubble Chart</div>
              <div style={{ height: '220px' }}>
                <canvas ref={statsBubbleRef} id="stats_bubble"></canvas>
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                X: Mobile Penetration · Y: GDP Growth · Size: Population · Color: Cluster
              </div>
            </div>

            <div className="section">
              <div className="section-title">Global Percentile Rankings</div>
              {(() => {
                const p = countryData.percentiles || {};
                const ga = metadata.global_averages || {};
                const ra = countryData.regional_averages || {};

                const percMetrics = [
                  { label: 'Mobile Penetration', key: 'mobile_penetration', val: countryData.mobile_penetration_pct, unit: '%', src: 'ITU 2024' },
                  { label: 'GDP Growth', key: 'gdp_growth', val: countryData.gdp_growth_pct, unit: '%', src: 'World Bank 2024' },
                  { label: 'Internet Users', key: 'internet_users', val: countryData.internet_users_pct, unit: '%', src: 'ITU 2024' },
                  { label: 'GDP per Capita', key: 'gdp_per_capita', val: countryData.gdp_per_capita_usd, unit: 'USD', src: 'World Bank 2024' },
                  { label: '5G Penetration (avg)', key: 'avg_5g', val: countryData.stats?.avg_5g, unit: '%', src: 'GSMA 2024' }
                ];

                return percMetrics.map(m => {
                  const perc = p[m.key];
                  if (perc === null || perc === undefined) return null;
                  const barClr = perc > 75 ? '#10b981' : perc > 50 ? '#3b82f6' : perc > 25 ? '#f59e0b' : '#ef4444';
                  return (
                    <div style={{ marginBottom: '10px' }} key={m.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{m.label}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: '600' }}>
                          {typeof m.val === 'number' ? m.val.toFixed(0) + (m.unit === 'USD' ? ' USD' : '%') : '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="perc-bar" style={{ flex: 1, height: '4px' }}>
                          <div className="perc-fill" style={{ width: `${perc}%`, background: barClr, height: '100%' }}></div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: barClr, width: '35px', textAlign: 'right' }}>
                          {perc}th
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            {(() => {
              const peers = Object.entries(allCountries)
                .filter(([k, cv]) => cv.cluster_name === countryData.cluster_name && k !== selectedCountry)
                .slice(0, 4);

              if (peers.length > 0) {
                return (
                  <div className="section">
                    <div className="section-title">Cluster Peers — {countryData.cluster_name}</div>
                    <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px' }}>
                      <table className="op-table" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Country</th>
                            <th>Pen%</th>
                            <th>5G%</th>
                            <th>GDP Gr%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {peers.map(([pName, pv]) => (
                            <tr key={pName}>
                              <td className="op-name" style={{ fontSize: '11px' }}>{getFlagEmoji(pv.iso)} {pName}</td>
                              <td>{pv.mobile_penetration_pct?.toFixed(0) || '—'}%</td>
                              <td>{pv.stats?.avg_5g?.toFixed(0) || '—'}%</td>
                              <td>{pv.gdp_growth_pct?.toFixed(1) || '—'}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }
            })()}

            <div className="section">
              <div className="section-title">Fraud Risk Decomposition</div>
              {(() => {
                const op0 = (countryData.operators && countryData.operators[0]) || {};
                const fraudDims = [
                  { label: 'OTT/App Substitution', score: op0.ott_score || 3 },
                  { label: 'Outbound Roaming', score: op0.outbound_roaming_score || 3 },
                  { label: 'Inbound Attack Surface', score: op0.inbound_roaming_score || 3 },
                  { label: 'Regulatory Gap', score: op0.regulatory_risk || 3 }
                ];

                const totalFraud = fraudDims.reduce((a, d) => a + d.score, 0);
                const maxFraud = fraudDims.length * 5;
                const fraudPct = Math.round((totalFraud / maxFraud) * 100);
                const color = fraudPct > 70 ? 'var(--red)' : fraudPct > 50 ? 'var(--yellow)' : 'var(--green)';

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '26px', fontWeight: '800', color }}>
                        {fraudPct}%
                      </div>
                      <div style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Index
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {fraudDims.map(d => {
                        const w = (d.score / 5) * 100;
                        const c = d.score >= 4 ? 'var(--red)' : d.score >= 3 ? 'var(--yellow)' : 'var(--green)';
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }} key={d.label}>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', width: '120px', flexShrink: 0 }}>
                              {d.label}
                            </span>
                            <div className="perc-bar" style={{ flex: 1, height: '3px' }}>
                              <div className="perc-fill" style={{ width: `${w}%`, background: c, height: '100%' }}></div>
                            </div>
                            <span style={{ fontSize: '9px', fontWeight: '600', color: c, width: '15px', textAlign: 'right' }}>
                              {d.score}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: NARRATIVE REPORT ── */}
      {activeTab === 'narrative' && (
        <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
          {(() => {
            const op0 = (countryData.operators && countryData.operators[0]) || {};
            const isYoung = countryData.avg_age < 30;
            const isAging = countryData.avg_age > 42;
            const isHighGDP = countryData.gdp_per_capita_usd > 20000;
            const is5GLeader = (countryData.stats?.avg_5g || 0) > 60;
            const is5GLagging = (countryData.stats?.avg_5g || 0) < 15;
            const isRoamingHub = countryData.cluster_name.includes('Roaming Hub');
            const isFrontier = countryData.cluster_name === 'Frontier Market';
            const highFraud = countryData.stats?.fraud_score > 3.5;
            const operatorsStr = (countryData.operators || []).map(o => o.operator).join(', ');
            const topOp = (countryData.operators || []).reduce((a, b) => (a.sub_base_mln || 0) > (b.sub_base_mln || 0) ? a : b, { operator: '—' });
            const fiveGAvg = countryData.stats?.avg_5g?.toFixed(0) || '—';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="narrative-block" style={{ margin: '0' }}>
                  <h4>Market Overview</h4>
                  <p>
                    <strong>{selectedCountry}</strong> is a{' '}
                    {isHighGDP ? 'high-income' : countryData.gdp_per_capita_usd > 5000 ? 'upper-middle income' : 'emerging market'}{' '}
                    country in the <strong>{countryData.region}</strong> region. With a population of{' '}
                    <strong>{countryData.population_mln ? countryData.population_mln.toFixed(0) + 'M' : '—'}</strong> and{' '}
                    {countryData.mobile_users_mln ? countryData.mobile_users_mln.toFixed(0) + 'M' : '—'} active mobile subscribers (
                    <strong>{countryData.mobile_penetration_pct ? countryData.mobile_penetration_pct.toFixed(0) + '%' : '—'} penetration</strong>
                    ), the market is served by <strong>{countryData.num_operators} operator{countryData.num_operators > 1 ? 's' : ''}</strong> (
                    {operatorsStr}). The dominant player is <strong>{topOp.operator}</strong>{' '}
                    {topOp.sub_base_mln ? `with ${topOp.sub_base_mln}M subscribers` : ''}.
                  </p>
                </div>

                <div className="narrative-block" style={{ margin: '0' }}>
                  <h4>Demographic & Digital Behavior</h4>
                  <p>
                    The average age of <strong>{countryData.avg_age ? countryData.avg_age + ' years' : '—'}</strong>{' '}
                    {isYoung
                      ? 'indicates a highly digital-native, mobile-first population with strong OTT and app usage. This demographic is the primary driver of data demand and creates elevated bypass fraud risk via WhatsApp voice and video calls.'
                      : isAging
                      ? 'reflects an aging population where mobile usage tends toward voice and traditional services. Churn risk is lower but ARPU uplift through data migration is the key opportunity.'
                      : 'places this market in the middle-age bracket — a blend of digital-native and traditional mobile users.'}{' '}
                    Internet penetration of <strong>{countryData.internet_users_pct ? countryData.internet_users_pct + '%' : '—'}</strong>{' '}
                    {countryData.internet_users_pct > 90
                      ? 'confirms a fully digitised market where advanced SaaS and eSIM solutions are viable immediately.'
                      : countryData.internet_users_pct > 60
                      ? 'shows a maturing digital market with room for smart device and 5G upsell.'
                      : 'highlights a digital gap — managed services and infrastructure solutions are likely more relevant than SaaS.'}
                  </p>
                </div>

                <div className="narrative-block" style={{ margin: '0' }}>
                  <h4>5G & Technology Landscape</h4>
                  <p>
                    Average 5G penetration across operators is <strong>{fiveGAvg}%</strong>.{' '}
                    {is5GLeader
                      ? `This is a 5G-advanced market where the eSIM, Steering of Roaming, and Roaming DNA products operate at full capability.`
                      : is5GLagging
                      ? `5G deployment is in early stages. This creates a strong opportunity for Mobileum's 5G Active Testing and Managed Services.`
                      : `5G deployment is progressing, presenting solid upsell opportunities.`}
                  </p>
                </div>

                <div className="narrative-block" style={{ margin: '0' }}>
                  <h4>Mobileum Strategic Opportunity</h4>
                  <p>
                    {highFraud && 'Fraud exposure is elevated. RAID 9 with AI-adaptive rules is recommended. '}
                    {isRoamingHub && 'Roaming hub dynamics make Steering of Roaming and Roaming DNA primary value drivers. '}
                    The recommended business model is:{' '}
                    <strong>
                      {op0.ia_recommended_biz_model && op0.ia_recommended_biz_model !== 'nan'
                        ? op0.ia_recommended_biz_model
                        : 'Evaluate based on operator financials'}
                    </strong>
                    .
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      </div>
    </div>
  );
}
