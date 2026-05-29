export function exportReport(currentCountry, countryData, metadata) {
  if (!currentCountry || !countryData) {
    alert('Please select a country first to export its report.');
    return;
  }
  const v = countryData;
  const date = new Date().toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'});

  const printWin = window.open('', '_blank');
  printWin.document.write(`<!DOCTYPE html><html><head>
    <title>Mobileum Intelligence Report — ${currentCountry}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:30px;color:#111;line-height:1.5}
      h1{color:#1d4ed8;font-size:20px}h2{color:#2563eb;font-size:14px;margin-top:20px;border-bottom:1px solid #ddd;padding-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
      th{background:#1d4ed8;color:#fff;padding:6px 10px;text-align:left}
      td{padding:6px 10px;border-bottom:1px solid #eee}
      .kpi{display:inline-block;background:#f0f6ff;border:1px solid #ddd;border-radius:6px;padding:8px 12px;margin:4px;min-width:120px}
      .kpi-label{font-size:9px;color:#666;text-transform:uppercase}
      .kpi-value{font-size:18px;font-weight:700;color:#1d4ed8}
      .top-badge{background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:8px 12px;margin-top:10px}
      .footer{margin-top:30px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:10px}
    </style></head><body>
    <h1>🌐 Mobileum Global Telecom Intelligence Report</h1>
    <p style="color:#666;font-size:12px">Generated: ${date} | Confidential</p>
    <h2>${getFlagEmoji(v.iso)} ${currentCountry} — ${v.region}${v.sub_region ? ' / ' + v.sub_region : ''}</h2>
    <div>
      <div class="kpi"><div class="kpi-label">Population</div><div class="kpi-value">${v.population_mln?.toFixed(0)||'—'}M</div></div>
      <div class="kpi"><div class="kpi-label">Mobile Users</div><div class="kpi-value">${v.mobile_users_mln?.toFixed(0)||'—'}M</div></div>
      <div class="kpi"><div class="kpi-label">Penetration</div><div class="kpi-value">${v.mobile_penetration_pct?.toFixed(0)||'—'}%</div></div>
      <div class="kpi"><div class="kpi-label">GDP Growth</div><div class="kpi-value">${v.gdp_growth_pct||'—'}%</div></div>
      <div class="kpi"><div class="kpi-label">5G Avg</div><div class="kpi-value">${v.stats?.avg_5g?.toFixed(0)||'—'}%</div></div>
      <div class="kpi"><div class="kpi-label">Avg Age</div><div class="kpi-value">${v.avg_age||'—'} yrs</div></div>
    </div>
    <h2>Operators (${v.num_operators})</h2>
    <table><tr><th>Operator</th><th>Subs (M)</th><th>Market Share</th><th>5G %</th><th>Revenue Trend</th><th>Profitability</th></tr>
    ${v.operators.map(op => `<tr><td>${op.operator}</td><td>${op.sub_base_mln||'—'}</td><td>${op.market_share_pct||'—'}%</td><td>${op.fiveG_pct||'—'}%</td><td>${op.revenue_growth||'—'}</td><td>${op.profitability||'—'}</td></tr>`).join('')}
    </table>
    <h2>Top Mobileum Recommendations</h2>
    ${v.product_ranking?.slice(0,5).map((p,i) => `
      <div class="top-badge" style="${i===0?'':'background:#f9fafb;border-color:#ddd;'}">
        <strong>#${i+1} ${p.product}</strong> — Score: ${p.score}/100<br>
        <span style="font-size:11px;color:#555">${p.reason}</span>
      </div>`).join('')}
    <h2>Market Cluster</h2>
    <p><strong>${v.cluster_name}</strong><br>${v.cluster_play || ''}</p>
    ${v.anomaly_text ? `<h2>Statistical Anomaly</h2><p style="background:#fffbeb;padding:8px;border-left:3px solid #f59e0b">${v.anomaly_text}</p>` : ''}
    <div class="footer">
      <strong>Data Sources:</strong> ${metadata.data_sources?.join(' | ') || ''}<br>
      Mobileum Global Telecom Intelligence Platform · ${date}
    </div>
    </body></html>`);
  printWin.document.close();
  printWin.print();
}

export function getFlagEmoji(iso) {
  if (!iso || iso === 'UNK') return '🌐';
  const flags = {
    'SAU':'🇸🇦','ARE':'🇦🇪','QAT':'🇶🇦','KWT':'🇰🇼','BHR':'🇧🇭','OMN':'🇴🇲',
    'JOR':'🇯🇴','LBN':'🇱🇧','SYR':'🇸🇾','IRQ':'🇮🇶','IRN':'🇮🇷','YEM':'🇾🇪',
    'PSE':'🇵🇸','EGY':'🇪🇬','LBY':'🇱🇾','TUN':'🇹🇳','DZA':'🇩🇿','MAR':'🇲🇦',
    'SDN':'🇸🇩','TUR':'🇹🇷','PAK':'🇵🇰','AFG':'🇦🇫','KAZ':'🇰🇿','UZB':'🇺🇿',
    'TKM':'🇹🇲','KGZ':'🇰🇬','TJK':'🇹🇯','ARM':'🇦🇲','AZE':'🇦🇿','GEO':'🇬🇪',
    'DEU':'🇩🇪','FRA':'🇫🇷','GBR':'🇬🇧','ITA':'🇮🇹','ESP':'🇪🇸','NLD':'🇳🇱',
    'BEL':'🇧🇪','CHE':'🇨🇭','AUT':'🇦🇹','SWE':'🇸🇪','NOR':'🇳🇴','DNK':'🇩🇰',
    'FIN':'🇫🇮','POL':'🇵🇱','CZE':'🇨🇿','HUN':'🇭🇺','ROU':'🇷🇴','BGR':'🇧🇬',
    'GRC':'🇬🇷','PRT':'🇵🇹','IRL':'🇮🇪','HRV':'🇭🇷','SRB':'🇷🇸','SVK':'🇸🇰',
    'UKR':'🇺🇦','RUS':'🇷🇺','BLR':'🇧🇾','LTU':'🇱🇹','LVA':'🇱🇻','EST':'🇪🇪',
    'SVN':'🇸🇮','BIH':'🇧🇦','MKD':'🇲🇰','ALB':'🇦🇱','MNE':'🇲🇪','MDA':'🇲🇩',
    'LUX':'🇱🇺','MLT':'🇲🇹','CYP':'🇨🇾','ISL':'🇮🇸','ISR':'🇮🇱',
    'CHN':'🇨🇳','JPN':'🇯🇵','KOR':'🇰🇷','PRK':'🇰🇵','IND':'🇮🇳','IDN':'🇮🇩',
    'AUS':'🇦🇺','NZL':'🇳🇿','SGP':'🇸🇬','MYS':'🇲🇾','THA':'🇹🇭','PHL':'🇵🇭',
    'VNM':'🇻🇳','BGD':'🇧🇩','LKA':'🇱🇰','MMR':'🇲🇲','KHM':'🇰🇭','LAO':'🇱🇦',
    'NPL':'🇳🇵','MNG':'🇲🇳','TWN':'🇹🇼','HKG':'🇭🇰','MAC':'🇲🇴','PNG':'🇵🇬',
    'FJI':'🇫🇯','BRN':'🇧🇳','MDV':'🇲🇻','BTN':'🇧🇹','TLS':'🇹🇱','SLB':'🇸🇧',
    'VUT':'🇻🇺','WSM':'🇼🇸','TON':'🇹🇴','KIR':'🇰🇮','FSM':'🇫🇲','PLW':'🇵🇼',
    'MHL':'🇲🇭','NRU':'🇳🇷','TUV':'🇹🇻',
    'BRA':'🇧🇷','MEX':'🇲🇽','ARG':'🇦🇷','COL':'🇨🇴','CHL':'🇨🇱','PER':'🇵🇪',
    'VEN':'🇻🇪','ECU':'🇪🇨','BOL':'🇧🇴','PRY':'🇵🇾','URY':'🇺🇾','GUY':'🇬🇾',
    'SUR':'🇸🇷','CRI':'🇨🇷','PAN':'🇵🇦','GTM':'🇬🇹','HND':'HN','SLV':'🇸🇻',
    'NIC':'🇳🇮','BLZ':'🇧🇿','CUB':'🇨🇺','DOM':'🇩🇴','JAM':'🇯🇲','TTO':'🇹🇹',
    'PRI':'🇵🇷','XKX':'🇽🇰',
  };
  return flags[iso] || '🌐';
}
