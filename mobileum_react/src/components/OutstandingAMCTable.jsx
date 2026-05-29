import React from 'react';

export default function OutstandingAMCTable({ amcData, isLoading }) {
  if (isLoading) {
    return (
      <div className="section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading financial metrics...</span>
      </div>
    );
  }

  if (!amcData || amcData.length === 0) return null;

  return (
    <div className="section outstanding-amc-section" style={{ marginTop: '12px' }}>
      <div className="section-title" style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Outstanding AMC Table
      </div>
      <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px' }}>
        <table className="op-table amc-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px', fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Contract ID</th>
              <th style={{ padding: '8px', fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Business Unit</th>
              <th style={{ padding: '8px', fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Operator / Client</th>
              <th style={{ padding: '8px', fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>AMC Value (USD)</th>
              <th style={{ padding: '8px', fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {amcData.map((row) => (
              <tr key={row.contract_id}>
                <td style={{ padding: '10px 8px', fontSize: '11px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-muted)' }}>
                  {row.contract_id}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '11px' }}>
                  <span className="cluster-tag" style={{ background: 'var(--bg-card2)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                    {row.business_unit}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {row.client_name}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '12px', fontWeight: '700', color: 'var(--green)', textAlign: 'right' }}>
                  ${row.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {row.due_date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
