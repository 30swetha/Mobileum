import React, { useState, useEffect } from 'react';
import { OPERATOR_TRACKER_DATA, calculateTrend } from '../data/operator_performance_tracker';

export default function OperatorPerformanceTracker({ selectedOperatorId = 'bharti-airtel', showSwitcher = false }) {
  const [activeOperatorId, setActiveOperatorId] = useState(selectedOperatorId);

  // Sync when prop changes
  useEffect(() => {
    if (selectedOperatorId) {
      // Find matching operator by id or partial name
      const found = OPERATOR_TRACKER_DATA.find(op => 
        op.operator_id === selectedOperatorId || 
        op.operator_name.toLowerCase().includes(String(selectedOperatorId).toLowerCase())
      );
      if (found) {
        setActiveOperatorId(found.operator_id);
      }
    }
  }, [selectedOperatorId]);

  // Find active operator object
  const operatorData = OPERATOR_TRACKER_DATA.find(op => op.operator_id === activeOperatorId) || OPERATOR_TRACKER_DATA[0];

  // CSV Export Functionality for Financial Section
  const downloadTrackerCSV = () => {
    let csvRows = [];
    const timestamp = new Date().toISOString().split('T')[0];

    csvRows.push([`Operator Performance Tracker Report: ${operatorData.operator_name}`]);
    csvRows.push([`Country/Region: ${operatorData.country}`]);
    csvRows.push([`Source Filing: ${operatorData.report_title}`]);
    csvRows.push([`Generated Date: ${timestamp}`]);
    csvRows.push([]);
    csvRows.push(['Metric Name', 'Description', 'FY 2022', 'FY 2023', 'FY 2024', '3-Yr YoY Trend', 'YoY 2022->2023 %', 'YoY 2023->2024 %']);

    operatorData.metrics.forEach(m => {
      const trend = calculateTrend(m.v2022, m.v2023, m.v2024);
      const yoy1Val = ((m.v2023 - m.v2022) / m.v2022 * 100).toFixed(1);
      const yoy2Val = ((m.v2024 - m.v2023) / m.v2023 * 100).toFixed(1);
      const yoy1Str = yoy1Val >= 0 ? `+${yoy1Val}%` : `${yoy1Val}%`;
      const yoy2Str = yoy2Val >= 0 ? `+${yoy2Val}%` : `${yoy2Val}%`;

      csvRows.push([
        `"${m.metric_name}"`,
        `"${m.description}"`,
        `"${m.display_2022}"`,
        `"${m.display_2023}"`,
        `"${m.display_2024}"`,
        `"${trend.label}"`,
        `"${yoy1Str}"`,
        `"${yoy2Str}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `${operatorData.operator_name.replace(/\s+/g, '_')}_Performance_Tracker_${timestamp}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
      
      {/* Operator Selector Header & Download Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Logo Badge */}
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: operatorData.logo_color,
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            {operatorData.logo_letter}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {operatorData.operator_name}
              </h3>
              <span style={{ fontSize: '10px', fontWeight: '700', background: 'rgba(37,99,235,0.1)', color: 'var(--blue)', padding: '2px 8px', borderRadius: '12px' }}>
                {operatorData.country}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Source: <strong>{operatorData.report_title}</strong> (FY 2022 – FY 2024)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Only render switcher tabs if explicit showSwitcher prop is true */}
          {showSwitcher && (
            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-card3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {OPERATOR_TRACKER_DATA.map(op => (
                <button
                  key={op.operator_id}
                  onClick={() => setActiveOperatorId(op.operator_id)}
                  style={{
                    background: activeOperatorId === op.operator_id ? 'var(--blue)' : 'transparent',
                    color: activeOperatorId === op.operator_id ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {op.operator_name}
                </button>
              ))}
            </div>
          )}

          {/* Download CSV Button for this operator only */}
          <button
            onClick={downloadTrackerCSV}
            style={{
              background: 'var(--blue)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
            }}
          >
            <span>📥 Download {operatorData.operator_name} CSV</span>
          </button>
        </div>
      </div>

      {/* 3-Year Metric Performance Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {operatorData.metrics.map(metric => {
          // Calculate YoY Trend (Growing, Declining, Mixed)
          const trend = calculateTrend(metric.v2022, metric.v2023, metric.v2024);
          
          // Calculate YoY % changes for detail badges
          const yoy1 = ((metric.v2023 - metric.v2022) / metric.v2022 * 100).toFixed(1);
          const yoy2 = ((metric.v2024 - metric.v2023) / metric.v2023 * 100).toFixed(1);

          return (
            <div
              key={metric.metric_key}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${trend.borderColor}`,
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div>
                {/* Metric Header & Trend Arrow Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {metric.metric_name}
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {metric.description}
                    </div>
                  </div>

                  {/* Trend Badge (Growing / Declining / Mixed with Arrows) */}
                  <div
                    style={{
                      background: trend.bgColor,
                      color: trend.color,
                      border: `1px solid ${trend.borderColor}`,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{trend.symbol}</span>
                    <span>{trend.label}</span>
                  </div>
                </div>

                {/* 3-Year Historical Values Row (2022, 2023, 2024) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'var(--bg-card2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>2022</div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {metric.display_2022}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>2023</div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {metric.display_2023}
                    </div>
                    <div style={{ fontSize: '8.5px', fontWeight: '700', color: yoy1 >= 0 ? 'var(--green)' : 'var(--red)', marginTop: '1px' }}>
                      {yoy1 >= 0 ? `+${yoy1}%` : `${yoy1}%`}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>2024</div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {metric.display_2024}
                    </div>
                    <div style={{ fontSize: '8.5px', fontWeight: '700', color: yoy2 >= 0 ? 'var(--green)' : 'var(--red)', marginTop: '1px' }}>
                      {yoy2 >= 0 ? `+${yoy2}%` : `${yoy2}%`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div style={{ paddingTop: '12px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
          📊 Data extracted directly from <strong>{operatorData.operator_name} Investor Disclosures</strong>
        </div>
        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>
          Rule Engine: <span style={{ color: 'var(--green)' }}>↗ Growing (2 yrs up)</span> · <span style={{ color: 'var(--red)' }}>↘ Declining (2 yrs down)</span> · <span style={{ color: '#d97706' }}>🔀 Mixed (varies)</span>
        </div>
      </div>

    </div>
  );
}
