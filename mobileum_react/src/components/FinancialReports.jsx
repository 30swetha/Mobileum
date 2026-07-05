import React from 'react';
import FIN from '../data/operator_financials.json';

/*
 * FinancialReports
 * ----------------
 * Real, sourced, GROUP-LEVEL financials where the operator belongs to a
 * disclosed parent group (see src/data/operator_financials.json). Operators
 * with no public group-level disclosure show an honest "Not disclosed" state
 * instead of invented numbers.
 *
 * The quarterly split lower down is clearly labelled ILLUSTRATIVE sample data
 * — operators do not publish per-quarter standalone splits, so it is shown as
 * a demo of how reported data would slot in, not as real figures.
 */

// Resolve an operator name -> group financials. Exact map first, then the same
// parent-prefix heuristic used to build the dataset, so unmapped members of a
// known group still resolve.
function resolveGroup(operator) {
  if (!operator) return null;
  const op = String(operator).trim();
  const grpKey = FIN.operator_to_group[op];
  if (grpKey && FIN.groups[grpKey]) return FIN.groups[grpKey];

  const low = op.toLowerCase();
  const prefixes = [
    ['mtn', 'MTN Group'], ['airtel', 'Bharti Airtel'], ['orange', 'Orange Group'],
    ['vodafone', 'Vodafone Group'], ['vodacom', 'Vodafone Group'], ['claro', 'America Movil'],
    ['movistar', 'Telefonica'], ['tigo', 'Millicom'], ['zain', 'Zain Group'],
    ['ooredoo', 'Ooredoo Group'], ['beeline', 'VEON'], ['axiata', 'Axiata'],
    ['china mobile', 'China Mobile'], ['china telecom', 'China Telecom'],
    ['china unicom', 'China Unicom'], ['jio', 'Reliance Jio'], ['safaricom', 'Safaricom'],
    ['stc', 'stc Group'], ['saudi telecom', 'stc Group'],
    ['etisalat', 'e& (Etisalat)'], ['e&', 'e& (Etisalat)'],
    ['telkomsel', 'Telkom Indonesia'], ['turkcell', 'Turkcell'],
    ['singtel', 'Singtel'], ['optus', 'Singtel'],
    ['telenor', 'Telenor'], ['grameenphone', 'Telenor'],
    ['docomo', 'NTT Docomo'], ['verizon', 'Verizon'], ['at&t', 'AT&T'], ['t-mobile', 'T-Mobile US'],
  ];
  for (const [k, v] of prefixes) {
    if (low.includes(k) && FIN.groups[v]) return FIN.groups[v];
  }
  return null;
}

const card = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px',
  padding: '24px', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)',
};
const badge = (bg, color, border) => ({
  fontSize: '11px', fontWeight: 600, color, background: bg, padding: '4px 10px',
  borderRadius: '20px', border: `1px solid ${border}`,
});

function StatCard({ label, value, sub, subColor }) {
  return (
    <div style={{ background: 'var(--bg-card2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: subColor || 'var(--text-muted)', marginTop: '6px', fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

export default function FinancialReports({ operator, country, operators, operatorSelected }) {
  // 1) If an operator is selected (or the passed name resolves directly), use it.
  let g = resolveGroup(operator);
  let shownVia = null; // set when we fell back to a country's top operator

  // 2) Country view (no operator selected): pick the country's LARGEST operator
  //    that has disclosed group financials, and show that.
  if (!g && Array.isArray(operators) && operators.length) {
    const candidates = operators
      .map(o => ({ name: o.operator, sub: o.sub_base_mln || 0, grp: resolveGroup(o.operator) }))
      .filter(o => o.grp)
      .sort((a, b) => b.sub - a.sub);
    if (candidates.length) {
      g = candidates[0].grp;
      shownVia = candidates[0].name;
    }
  }

  const verified = g && g.verified === 'search-2026-06';
  const title = operatorSelected ? operator : (country || operator);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>

      {/* ---- Real group-level financials, or honest empty state ---- */}
      <div className="financial-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--blue)' }}>
            {title} — Financial Snapshot
          </div>
          {g ? (
            <div style={badge('var(--bg-card2)', verified ? 'var(--green)' : 'var(--text-muted)', 'var(--border)')}>
              {verified ? '● ' : ''}Group-level · {g.fy}{verified ? ' · verified' : ''}
            </div>
          ) : (
            <div style={badge('var(--bg-card2)', 'var(--text-muted)', 'var(--border)')}>
              Not publicly disclosed
            </div>
          )}
        </div>

        {shownVia && g && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '14px' }}>
            Showing largest disclosed operator in {country}: <b>{shownVia}</b>. Click an operator for its own figures.
          </div>
        )}

        {g ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <StatCard label="Group Revenue" value={g.revenue_usd_bn != null ? `$${g.revenue_usd_bn}B` : '—'} sub={g.fy} />
              <StatCard label="EBITDA Margin" value={g.ebitda_margin_pct != null ? `${g.ebitda_margin_pct}%` : 'n/d'} />
              <StatCard label="Subscribers" value={g.subscribers_mln != null ? `${g.subscribers_mln}M` : '—'} />
              <StatCard label="ARPU" value={g.arpu || '—'} sub="representative" />
            </div>
            <div style={{ background: 'rgba(59,130,246,0.05)', padding: '14px 16px', borderRadius: '8px', borderLeft: '4px solid var(--blue)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {g.note && <div style={{ marginBottom: '6px' }}>{g.note}</div>}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Parent group: <b>{g.group}</b> · figures are <b>group-level consolidated</b>, not a standalone
                  per-operator split. Source: {g.source}
                  {verified ? ' (confirmed against company release).' : ' (verify against latest filing).'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              No public group-level financials for this operator
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
              This operator does not publish standalone consolidated financials (private, sub-national,
              or non-disclosing). Real figures are shown only for listed / state operator groups —
              invented numbers are intentionally not displayed.
            </div>
          </div>
        )}
      </div>

      {/* ---- Illustrative quarterly trend (clearly marked sample data) ---- */}
      <div className="financial-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Quarterly Trend
          </div>
          <div style={badge('rgba(245,158,11,0.1)', 'var(--yellow)', 'rgba(245,158,11,0.3)')}>
            ⚠ Illustrative sample — not reported figures
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
          Operators do not publish per-quarter standalone splits. The shape below is synthetic demo
          data showing how reported quarterly data would render — it is not a real financial figure.
        </div>
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card2)' }}>
                {['Quarter', 'Index (sample)', 'QoQ', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { q: 'Q1 2025', idx: '23', growth: '+2.1%', status: 'sample' },
                { q: 'Q2 2025', idx: '24', growth: '+3.4%', status: 'sample' },
                { q: 'Q3 2025', idx: '26', growth: '+4.2%', status: 'sample' },
                { q: 'Q4 2025', idx: '27', growth: '+2.7%', status: 'sample' },
              ].map((m, i, arr) => (
                <tr key={i} style={{ borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{m.q}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{m.idx}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{m.growth}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: 'var(--yellow)' }}>
                      {m.status}
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
