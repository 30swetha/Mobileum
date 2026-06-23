import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import CustomerServiceTickets from './CustomerServiceTickets';
import OutstandingAMCTable from './OutstandingAMCTable';
import CompetitorsTable from './CompetitorsTable';
import FinancialReports from './FinancialReports';

const CLUSTER_COLORS = {
  'Frontier': '#E74C3C',
  'Emerging': '#F39C12',
  'Growth': '#1ABC9C',
  'Mature': '#4A90D9',
  'Advanced': '#9B59B6',
  'Mature & Saturated': '#9B59B6',
  'High Growth Exposed': '#F39C12',
  'Roaming Hub': '#1ABC9C',
  'Emerging Opportunity': '#2ECC71',
  'Regulatory Transition': '#7F8C8D',
  'Unknown': '#7F8C8D'
};

const trendToScore = (val) => {
  if (!val || val === 'nan') return 3;
  const v = val.toLowerCase();
  if (v.includes('very high') || v.includes('world highest') || v.includes('major') || v.includes('strongly') || v.includes('extreme')) return 5;
  if (v.includes('high') || v.includes('growing') || v.includes('up') || v.includes('increasing') || v.includes('active') || v.includes('strong') || v.includes('positive') || v.includes('significant')) return 4;
  if (v.includes('moderate') || v.includes('stable') || v.includes('flat') || v.includes('neutral') || v.includes('marginal') || v.includes('mixed') || v.includes('seasonal')) return 3;
  if (v.includes('low') || v.includes('declining') || v.includes('down') || v.includes('decreasing') || v.includes('weak') || v.includes('marginal down')) return 2;
  if (v.includes('very low') || v.includes('none') || v.includes('minimal') || v.includes('absent') || v.includes('nil')) return 1;
  return 3;
};

const parsePipelineValue = (valStr) => {
  if (!valStr) return 0;
  const match = valStr.match(/\$?([0-9.]+)\s*M/i);
  if (match) {
    return parseFloat(match[1]);
  }
  const cleanNum = parseFloat(valStr.replace(/[^0-9.]/g, ''));
  return isNaN(cleanNum) ? 0 : cleanNum;
};

const getProductValue = (index, totalValStr, numProducts) => {
  const totalVal = parsePipelineValue(totalValStr);
  if (totalVal <= 0) return '$0.0M';
  if (numProducts <= 1) return `$${totalVal.toFixed(1)}M`;
  
  const sumWeights = (numProducts * (numProducts + 1)) / 2;
  const productWeight = (numProducts - index) / sumWeights;
  const productVal = totalVal * productWeight;
  return `$${productVal.toFixed(1)}M`;
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
  accountData,
  isDataLoading,
  activeTab,
  setActiveTab,
  selectedOperator,
  setSelectedOperator,
  setSelectedCountry,
  activeRegion,
  onCloseOverview
}) {
  const chartRefs = useRef({});
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [productStates, setProductStates] = useState({});

  const getProductState = (productName) => {
    const key = `${selectedCountry || 'global'}_${selectedOperator || 'none'}_${productName}`;
    const state = productStates[key];
    if (state) return state;

    const usedProducts = accountData?.productSection?.mobileumProducts || [];
    const isUsed = usedProducts.includes(productName);
    
    return {
      used: isUsed,
      channel: 'Licensed'
    };
  };

  const setProductStateValue = (productName, field, value) => {
    const key = `${selectedCountry || 'global'}_${selectedOperator || 'none'}_${productName}`;
    setProductStates(prev => {
      const currentState = prev[key] || getProductState(productName);
      return {
        ...prev,
        [key]: {
          ...currentState,
          [field]: value
        }
      };
    });
  };

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

  // Reset sub-tab and scroll position of the panel when active tab, country, or operator changes
  useEffect(() => {
    setActiveSubTab('profile');
  }, [selectedCountry, selectedOperator]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [activeTab, selectedCountry]);

  // Handle Chart rendering when activeTab, selectedCountry, or selectedOperator changes
  useEffect(() => {
    if (!countryData) return;

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

    const opData = selectedOperator ? (countryData.operators || []).find(o => o.operator === selectedOperator) : null;

    const getOpRadar = (op) => {
      const outbound = trendToScore(op.outbound_roaming);
      const inbound = trendToScore(op.inbound_roaming);
      const ott = trendToScore(op.ott_intl_calls);
      const arpu = trendToScore(op.arpu_growth);
      const fiveG = op.fiveG_pct || 0;
      const subGrowth = op.subscriber_growth_pct || 0;
      
      return {
        roaming_opportunity: (outbound + inbound) / 2,
        fraud_risk: ott,
        fiveG_upsell: Math.min(fiveG / 20, 5),
        arpu_pressure: 5 - arpu + 1,
        subscriber_growth: Math.min(subGrowth / 3 + 1, 5),
        regulatory_risk: trendToScore(op.regulation_impact || op.regulations || 'moderate')
      };
    };

    const r = opData ? getOpRadar(opData) : countryData.radar;

    // ─── OVERVIEW TAB CHARTS ───
    if (activeTab === 'overview') {
      const canvas = overviewRadarRef.current;
      if (canvas && r) {
        const ctx = canvas.getContext('2d');
        chartRefs.current['overview_radar'] = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Roaming Opp.', 'Fraud Risk', '5G Upsell', 'ARPU Pressure', 'Sub Growth', 'Regulatory'],
            datasets: [{
              label: selectedOperator || selectedCountry || countryData.country || 'Overview',
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
              backgroundColor: ops.map((o, idx) => {
                if (selectedOperator) {
                  return o.operator === selectedOperator 
                    ? ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 6]
                    : 'rgba(200, 200, 200, 0.15)';
                }
                return ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 6];
              }),
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
            datasets: sOps.map((o, i) => {
              const isSel = selectedOperator ? o.operator === selectedOperator : true;
              const baseColor = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5];
              return {
                label: o.operator,
                data: [{
                  x: parseFloat(o.market_share_pct) || 0,
                  y: o.revenue_growth_score,
                  r: Math.max(5, Math.min(20, (o.sub_base_mln || 1) / 30))
                }],
                backgroundColor: isSel ? baseColor + 'CC' : 'rgba(200, 200, 200, 0.15)',
                borderColor: isSel ? baseColor : 'rgba(200, 200, 200, 0.3)',
              };
            })
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
    if (activeTab === 'account' && activeSubTab === 'impact') {
      const radarCanvas = impactRadarRef.current;
      if (radarCanvas && r) {
        const ctx = radarCanvas.getContext('2d');
        const regAvg = countryData.regional_averages;

        chartRefs.current['impact_radar'] = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Roaming Opp.', 'Fraud Risk', '5G Upsell', 'ARPU Pressure', 'Sub Growth', 'Regulatory Risk'],
            datasets: [
              {
                label: selectedOperator || selectedCountry || countryData.country || 'Overview',
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

      const getOpWaterfall = (op) => {
        const outbound = trendToScore(op.outbound_roaming);
        const inbound = trendToScore(op.inbound_roaming);
        const roamIntensity = (outbound + inbound) / 2;
        const ott = op.ott_score || trendToScore(op.ott_intl_calls);
        const arpu = op.arpu_growth_score || trendToScore(op.arpu_growth);
        const profit = op.profitability_score || trendToScore(op.profitability);
        const fiveG = op.fiveG_pct || 0;
        
        const base = 100;
        const ott_impact = -(ott - 2) * 2.0;
        const arpu_impact = -(3 - arpu) * 1.5;
        const churn_impact = -(3 - profit) * 1.2;
        const roaming_upside = roamIntensity * 1.8;
        const fiveG_upside = (fiveG / 100) * 8.0;
        const net = base + ott_impact + arpu_impact + churn_impact + roaming_upside + fiveG_upside;
        
        return {
          base,
          ott_substitution: Math.round(ott_impact * 10) / 10,
          arpu_compression: Math.round(arpu_impact * 10) / 10,
          churn_pressure: Math.round(churn_impact * 10) / 10,
          roaming_upside: Math.round(roaming_upside * 10) / 10,
          fiveG_upside: Math.round(fiveG_upside * 10) / 10,
          net: Math.round(net * 10) / 10
        };
      };

      const wf = opData ? getOpWaterfall(opData) : countryData.waterfall;
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
    if (activeTab === 'account' && activeSubTab === 'products') {
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
        .filter(([_, cv]) => countryData.region === 'Global' || cv.region === countryData.region)
        .slice(0, 40);
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
  }, [selectedCountry, countryData, activeTab, activeSubTab, theme]);

  if (!countryData) return null;

  const clr = CLUSTER_COLORS[countryData.cluster_name] || '#4A90D9';

  const hmColor = (score) => {
    const s = Math.max(0, Math.min(100, score || 0));
    if (s < 20) return '#ef4444';
    if (s < 40) return 'rgba(245, 158, 11, 0.15)';
    if (s < 60) return 'rgba(59, 130, 246, 0.15)';
    if (s < 80) return 'rgba(16, 185, 129, 0.15)';
    return 'rgba(16, 185, 129, 0.25)';
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
        {/* Breadcrumb / Back Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          {selectedCountry ? (
            <button 
              onClick={() => {
                if (selectedOperator) {
                  if (setSelectedOperator) setSelectedOperator(null);
                } else {
                  if (setSelectedCountry) setSelectedCountry(null);
                }
              }}
              style={{
                background: 'var(--bg-card2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-card3)'; e.currentTarget.style.borderColor = 'var(--blue)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-card2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {selectedOperator ? `← Back to ${selectedCountry}` : '← Back to Global Map'}
            </button>
          ) : (
            <button 
              onClick={() => {
                if (onCloseOverview) onCloseOverview();
              }}
              style={{
                background: 'var(--bg-card2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-card2)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              ✖ Close Overview
            </button>
          )}

          {selectedCountry && (
            <>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/</span>
              {selectedOperator ? (
                <span 
                  onClick={() => {
                    if (setSelectedOperator) setSelectedOperator(null);
                  }}
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: '600', 
                    color: 'var(--blue)', 
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  title={`Back to ${selectedCountry} details`}
                >
                  {selectedCountry}
                </span>
              ) : (
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedCountry}</span>
              )}
            </>
          )}
          {selectedOperator && (
            <>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedOperator}</span>
            </>
          )}
        </div>

        <div id="panel-title" style={{ fontSize: '24px', fontWeight: '800' }}>
          {selectedCountry 
            ? <>{getFlagEmoji(countryData.iso)} {selectedCountry} Operator Details</>
            : <>🌍 {activeRegion === 'all' ? 'Global Overview' : `${activeRegion} Regional Overview`}</>
          }
        </div>
        <div id="panel-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {selectedCountry 
            ? 'Active intelligence, operator benchmarks, support service levels, and competitor analytics.'
            : 'Aggregated regional telecom statistics, operator distributions, and market benchmarks.'
          }
        </div>
      </div>

      {/* Tabs list matching SidePanel but centered and responsive */}
      <div id="panel-tabs" style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', zIndex: 10, flexShrink: 0, animation: 'none', opacity: 1, transform: 'none' }}>
        {[
          { key: 'operators', label: 'Operator Details' },
          { key: 'overview', label: 'Market Overview' },
          { key: 'account', label: 'Account Section' },
          { key: 'stats', label: 'Stats Profile' },
          { key: 'narrative', label: 'Narrative Report' }
        ].map((tab) => (
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
                        onClick={() => {
                          setSelectedOperator(op.operator);
                          setActiveTab('account');
                        }}
                      >
                        <td className="hm-op-name" style={{ borderLeft: isSelected ? '4px solid var(--blue)' : '' }}>
                          <div className="op-name" style={{ fontSize: '11px' }}>{op.operator}</div>
                          <div className="op-sub">
                            {op.prepaid_postpaid || ''}
                            {(!selectedCountry && op.countryName) ? ` • ${op.countryName}` : ''}
                          </div>
                        </td>
                        {cells.map((cell, cidx) => {
                          const sc = cell.score;
                          const bg = sc === null ? '' : hmColor(sc);
                          const textClr = sc !== null && sc < 20 ? '#fff' : 'var(--text-primary)';
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
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                margin: '20px 0',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                animation: 'fadeIn 0.25s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    {selectedOperator} — Financial Contracts (AMC) & Competitors
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
                                <td style={{ fontWeight: '700', color: 'var(--text-primary)', textAlign: 'right' }}>
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
                    onClick={() => {
                      setSelectedOperator(op.operator);
                      setActiveTab('account');
                    }}
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
                      <div>5G: <strong style={{ color: 'var(--text-primary)' }}>{op.fiveG_pct !== null ? op.fiveG_pct + '%' : '—'}</strong></div>
                      <div>ARPU: <strong style={{ color: 'var(--text-primary)' }}>{op.arpu_growth || '—'}</strong></div>
                      <div>Sub Growth: <strong style={{ color: 'var(--text-primary)' }}>{op.subscriber_growth_pct !== null ? op.subscriber_growth_pct + '%' : '—'}</strong></div>
                      <div>Capex: <strong style={{ color: 'var(--text-primary)' }}>{capexText.length > 25 ? capexText.substring(0, 22) + '…' : capexText}</strong></div>
                      <div>Outbound: <strong style={{ color: 'var(--text-primary)' }}>{(op.outbound_roaming || '—').substring(0, 15)}</strong></div>
                      <div>Top Routes: <strong style={{ color: 'var(--text-primary)' }}>{(op.top_roaming_countries || '—').substring(0, 20)}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: IMPACT ── */}
      {activeTab === 'account' && (
        <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
          {accountData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {selectedOperator && (
                <div style={{ 
                  background: 'rgba(37, 99, 235, 0.08)', 
                  border: '1px solid var(--blue)', 
                  borderRadius: '10px', 
                  padding: '12px 16px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  animation: 'fadeIn 0.25s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>💼</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        Operator Specific View: <span style={{ color: 'var(--blue)' }}>{selectedOperator}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Showing custom financial performance, renewals, and product fits for this operator.
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedOperator(null)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* Nested Sub-navigation Bar */}
              <div id="sub-panel-tabs" style={{ 
                display: 'flex', 
                gap: '8px', 
                borderBottom: '1px solid var(--border)', 
                padding: '4px 0 10px 0', 
                position: 'sticky',
                top: 0,
                background: 'var(--bg-card)',
                zIndex: 10,
                flexShrink: 0
              }}>
                {[
                  { key: 'profile', label: 'Account Profile' },
                  { key: 'impact', label: 'Impact Analysis' },
                  { key: 'products', label: 'Product Fit' },
                  { key: 'support', label: 'Support & AMC' },
                  { key: 'competitors', label: 'Competitors' },
                  { key: 'plan2026', label: 'Plan for 2026' }
                ].map(subTab => (
                  <button
                    key={subTab.key}
                    className={`tab-btn ${activeSubTab === subTab.key ? 'active' : ''}`}
                    onClick={() => setActiveSubTab(subTab.key)}
                    style={{ 
                      fontSize: '11px', 
                      padding: '8px 12px',
                      background: activeSubTab === subTab.key ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: activeSubTab === subTab.key ? 'var(--blue-light)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>

              {activeSubTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.25s ease-out' }}>
                  
                  {/* Sticky Index Navigation Bar */}
                  <div style={{
                    position: 'sticky',
                    top: '40px',
                    background: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border)',
                    padding: '10px 0',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    zIndex: 9,
                    marginTop: '-12px',
                    marginBottom: '8px',
                    overflowX: 'auto'
                  }} className="hide-scrollbar">
                    <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
                      Jump To:
                    </span>
                    {[
                      { id: 'product-section', label: 'Product Section', color: 'var(--blue)' },
                      { id: 'financial-section', label: 'Financial Section', color: 'var(--teal)' },
                      { id: 'renewal-section', label: 'Renewal Section', color: 'var(--purple)' },
                      { id: 'health-section', label: 'Health of Solution', color: 'var(--red)' }
                    ].map(sec => (
                      <button
                        key={sec.id}
                        onClick={() => {
                          const el = document.getElementById(sec.id);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        style={{
                          background: 'var(--bg-card2)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = sec.color;
                          e.currentTarget.style.color = sec.color;
                          e.currentTarget.style.background = 'var(--bg-card3)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.background = 'var(--bg-card2)';
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sec.color }}></span>
                        {sec.label}
                      </button>
                    ))}
                  </div>

              {/* Product Section */}
              <div id="product-section" className="section" style={{ scrollMarginTop: '90px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', margin: '0 0 4px 0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--blue)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Product Section
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* LEFT COLUMN */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 1. Mobileum products */}
                    <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Mobileum Products
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(accountData.productSection?.mobileumProducts || []).map(item => (
                          <span key={item} style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--blue)', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '600' }}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 3. Product gaps */}
                    <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Product Gaps
                      </div>
                      <ul style={{ margin: '0', paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '11px', lineHeight: '1.6' }}>
                        {(accountData.productSection?.productGaps || []).map(item => <li key={item}>{item}</li>)}
                      </ul>
                    </div>

                    {/* 4. Managed services possibility */}
                    <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Managed Services Possibility
                      </div>
                      <ul style={{ margin: '0', paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '11px', lineHeight: '1.6' }}>
                        {(accountData.productSection?.managedServicesPossibility || []).map(item => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 2. Competition products */}
                    <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Competition Products
                      </div>
                      <ul style={{ margin: '0', paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '11px', lineHeight: '1.6' }}>
                        {(accountData.productSection?.competitionProducts || []).map(item => <li key={item}>{item}</li>)}
                      </ul>
                    </div>

                    {/* 6. Competition which can be replaced */}
                    <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Competitors to Replace
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(accountData.productSection?.replaceableCompetitors || []).map(item => (
                          <span key={item} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '999px', padding: '2px 8px', fontSize: '10px', fontWeight: '600' }}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Final Strategies */}
                    <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Final Strategies
                      </div>
                      <ul style={{ margin: '0', paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '11px', lineHeight: '1.6' }}>
                        {(accountData.productSection?.finalStrategies || []).map(item => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 5. Plan for 2026 */}
                {accountData.plan2026 && (
                  <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Plan for 2026 (Quick View)
                      </span>
                      <button 
                        onClick={() => setActiveSubTab('plan2026')}
                        style={{ background: 'var(--blue)', border: 'none', color: '#fff', borderRadius: '4px', padding: '3px 8px', fontSize: '9px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        View full plan →
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                      <strong>Pipeline Value:</strong> {accountData.plan2026.valueOfOpportunities}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <strong>Focus:</strong> {(accountData.plan2026.productsFocusedOn || []).join(', ')}
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Section */}
              <div id="financial-section" className="section" style={{ scrollMarginTop: '90px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', margin: '0 0 4px 0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--teal)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Financial Section
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="product-card" style={{ padding: '12px', margin: 0, cursor: 'default' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>1. Profit / Revenue Potential</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--green)', marginTop: '4px' }}>
                      {accountData.financialSection?.profit || '—'}
                    </div>
                  </div>
                  
                  <div className="product-card" style={{ padding: '12px', margin: 0, cursor: 'default' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>2. Capex Investment</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--blue)', marginTop: '4px' }}>
                      {accountData.financialSection?.capexInvestment || '—'}
                    </div>
                  </div>
                  
                  <div className="product-card" style={{ padding: '12px', margin: 0, cursor: 'default', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>3. Strategic Notes & Outlook (xxxx)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>
                      {accountData.financialSection?.note || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Renewal Section */}
              <div id="renewal-section" className="section" style={{ scrollMarginTop: '90px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', margin: '0 0 4px 0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--purple)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Renewal Section
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      1. AMC Renewal List
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(accountData.renewalSection?.amcRenewal || []).map((item, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</span>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--green)' }}>{item.value}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Status:</span>
                            <span style={{ 
                              fontSize: '9px', 
                              fontWeight: '700', 
                              background: item.status.toLowerCase().includes('due') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                              color: item.status.toLowerCase().includes('due') ? 'var(--yellow)' : 'var(--green)',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!accountData.renewalSection?.amcRenewal || accountData.renewalSection.amcRenewal.length === 0) && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No AMC renewals listed.</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      2. Managed Services Renewal
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(accountData.renewalSection?.managedServicesRenewal || []).map((item, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</span>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--green)' }}>{item.value}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Status:</span>
                            <span style={{ 
                              fontSize: '9px', 
                              fontWeight: '700', 
                              background: item.status.toLowerCase().includes('ready') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.15)', 
                              color: item.status.toLowerCase().includes('ready') ? 'var(--green)' : 'var(--blue)',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!accountData.renewalSection?.managedServicesRenewal || accountData.renewalSection.managedServicesRenewal.length === 0) && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No managed services renewals listed.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Health of Solution Section */}
              <div id="health-section" className="section" style={{ scrollMarginTop: '90px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', margin: '0 0 4px 0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--red)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Health of Solution Section
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      1. Installed Product-wise Support Tickets
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(accountData.healthSection?.installedProductWiseSupportTicket || []).map((item, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.product}</span>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--red)' }}>{item.tickets} Tickets</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Trend:</span>
                            <span style={{ 
                              fontSize: '9px', 
                              fontWeight: '700', 
                              color: item.trend.toLowerCase().includes('improving') ? 'var(--green)' : item.trend.toLowerCase().includes('stable') ? 'var(--blue)' : 'var(--yellow)' 
                            }}>
                              {item.trend}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      2. Usage of Installed Products
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(accountData.healthSection?.usageOfInstalledProducts || []).map((item, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.product}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                            {item.usage}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
              {activeSubTab === 'impact' && (
                <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
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
              {activeSubTab === 'products' && (
                <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
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
              {activeSubTab === 'support' && (
                <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                    <CustomerServiceTickets ticketData={ticketData} isLoading={isDataLoading} />
                    <OutstandingAMCTable amcData={amcData} isLoading={isDataLoading} />
                  </div>
                )}
              {activeSubTab === 'competitors' && (
                <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                    <CompetitorsTable competitorData={competitorData} />
                  </div>
                )}
              {activeSubTab === 'plan2026' && (
                <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                    {accountData?.plan2026 ? (
                      <div className="section" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--blue)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Mobileum 2026 Strategic Plan
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {/* Recommended Products Table */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                              Recommended Products & Revenue Distribution
                            </div>
                            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                  <tr style={{ background: 'var(--bg-card2)', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)', width: '160px' }}>MOBILEUM PRODUCT USED</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)' }}>PRODUCT NAME</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)', width: '120px' }}>VALUE</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)', width: '180px' }}>TYPE OF CHANNEL</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(accountData.plan2026.productsFocusedOn || []).map((product, idx) => {
                                    const state = getProductState(product);
                                    const val = getProductValue(idx, accountData.plan2026.valueOfOpportunities, (accountData.plan2026.productsFocusedOn || []).length);
                                    return (
                                      <tr key={product} style={{ borderBottom: idx === (accountData.plan2026.productsFocusedOn || []).length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '10px 12px' }}>
                                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                                            <input
                                              type="checkbox"
                                              checked={state.used}
                                              onChange={(e) => setProductStateValue(product, 'used', e.target.checked)}
                                              style={{
                                                width: '15px',
                                                height: '15px',
                                                accentColor: 'var(--blue)',
                                                cursor: 'pointer'
                                              }}
                                            />
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Used</span>
                                          </label>
                                        </td>
                                        <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                          {product}
                                        </td>
                                        <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--green)' }}>
                                          {val}
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                          <select
                                            value={state.channel}
                                            onChange={(e) => setProductStateValue(product, 'channel', e.target.value)}
                                            style={{
                                              background: 'var(--bg-card2)',
                                              border: '1px solid var(--border)',
                                              borderRadius: '6px',
                                              color: 'var(--text-primary)',
                                              padding: '4px 8px',
                                              fontSize: '11px',
                                              outline: 'none',
                                              cursor: 'pointer',
                                              width: '100%'
                                            }}
                                          >
                                            <option value="Licensed">Licensed</option>
                                            <option value="Mobileum Service">Mobileum Service</option>
                                          </select>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
          
                          {/* 2. Total Opportunities Value */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                              Total Value of Opportunities
                            </div>
                            <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', display: 'inline-block' }}>
                              <strong style={{ fontSize: '15px', color: 'var(--green)' }}>{accountData.plan2026.valueOfOpportunities}</strong>
                            </div>
                          </div>
          
                          {/* 3. PoC or demo given */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                              PoC or Demo Delivered
                            </div>
                            <div className="product-card" style={{ padding: '12px 16px', margin: 0, cursor: 'default', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', borderRadius: '8px', background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                              {accountData.plan2026.pocOrDemoGiven}
                            </div>
                          </div>
          
                          {/* 4. Consulting trials given */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                              Consulting Trials Given & Next Steps
                            </div>
                            <div className="product-card" style={{ padding: '12px 16px', margin: 0, cursor: 'default', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', borderRadius: '8px', background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                              {accountData.plan2026.consultingTrialsGiven}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="section"><div className="section-title">2026 plan</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No 2026 plan details are available for this account yet.</div></div>
                    )}
                    
                    {/* Render Financial Reports below the Strategic Plan */}
                    <FinancialReports
                      operator={selectedOperator || selectedCountry || 'Global Market'}
                      country={selectedCountry}
                      operators={countryData?.operators}
                      operatorSelected={!!selectedOperator}
                    />
                  </div>
                )}
            </div>
          ) : (
            <div className="section"><div className="section-title">Account insights</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No account insight is available for this market yet.</div></div>
          )}
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
