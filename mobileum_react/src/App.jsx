import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import StaticCountrySidebar from './components/StaticCountrySidebar';
import DynamicCenterDashboard from './components/DynamicCenterDashboard';
import ComparisonModal from './components/ComparisonModal';
import { exportReport, getFlagEmoji } from './utils/exportReport';
import TELECOM_DATA from './data/master_telecom.json';

// Mock datasets for tickets, amc, and competitors
const MOCK_TICKETS = {
  "Saudi Arabia": {
    "total_tickets": 1420,
    "trend_12_months": [
      { "month": "Jun", "count": 110 }, { "month": "Jul", "count": 125 },
      { "month": "Aug", "count": 95 }, { "month": "Sep", "count": 115 },
      { "month": "Oct", "count": 130 }, { "month": "Nov", "count": 140 },
      { "month": "Dec", "count": 150 }, { "month": "Jan", "count": 120 },
      { "month": "Feb", "count": 110 }, { "month": "Mar", "count": 105 },
      { "month": "Apr", "count": 118 }, { "month": "May", "count": 102 }
    ],
    "business_units": [
      { "unit": "Risk", "tickets": 340, "color": "#7c3aed" },
      { "unit": "Fraud", "tickets": 420, "color": "#ef4444" },
      { "unit": "Roaming Management", "tickets": 280, "color": "#10b981" },
      { "unit": "Network Security", "tickets": 180, "color": "#3b82f6" },
      { "unit": "Customer Intelligence", "tickets": 200, "color": "#ea580c" }
    ]
  },
  "UAE": {
    "total_tickets": 980,
    "trend_12_months": [
      { "month": "Jun", "count": 80 }, { "month": "Jul", "count": 85 },
      { "month": "Aug", "count": 70 }, { "month": "Sep", "count": 90 },
      { "month": "Oct", "count": 95 }, { "month": "Nov", "count": 110 },
      { "month": "Dec", "count": 105 }, { "month": "Jan", "count": 85 },
      { "month": "Feb", "count": 75 }, { "month": "Mar", "count": 80 },
      { "month": "Apr", "count": 95 }, { "month": "May", "count": 110 }
    ],
    "business_units": [
      { "unit": "Risk", "tickets": 220, "color": "#7c3aed" },
      { "unit": "Fraud", "tickets": 310, "color": "#ef4444" },
      { "unit": "Roaming Management", "tickets": 210, "color": "#10b981" },
      { "unit": "Network Security", "tickets": 110, "color": "#3b82f6" },
      { "unit": "Customer Intelligence", "tickets": 130, "color": "#ea580c" }
    ]
  }
};

const MOCK_AMC = {
  "Saudi Arabia": [
    { "contract_id": "AMC-2026-001", "business_unit": "Risk (RAID 9)", "client_name": "STC Saudi Arabia", "outstanding_amount": 400000.00, "due_date": "2026-08-31" },
    { "contract_id": "AMC-2026-002", "business_unit": "Roaming Management", "client_name": "Mobily", "outstanding_amount": 200000.00, "due_date": "2026-07-15" },
    { "contract_id": "AMC-2026-003", "business_unit": "Network Security", "client_name": "Zain KSA", "outstanding_amount": 150000.00, "due_date": "2026-09-30" }
  ],
  "UAE": [
    { "contract_id": "AMC-2026-004", "business_unit": "Roaming DNA", "client_name": "e& UAE", "outstanding_amount": 400000.00, "due_date": "2026-08-15" },
    { "contract_id": "AMC-2026-005", "business_unit": "Fraud (RAID 9)", "client_name": "du", "outstanding_amount": 200000.00, "due_date": "2026-07-01" },
    { "contract_id": "AMC-2026-006", "business_unit": "Customer Intelligence", "client_name": "e& UAE", "outstanding_amount": 300000.00, "due_date": "2026-10-10" }
  ]
};

const MOCK_COMPETITORS = [
  { "name": "Syniverse", "category": "Direct Competitor", "key_offerings": "Data/Financial Clearing, IPX Transport connectivity, and basic Roaming Steering.", "versus_mobileum": "Mobileum dominates in advanced analytics (Active Testing, Roaming DNA), whereas Syniverse is infrastructure-heavy." },
  { "name": "Tomia", "category": "Direct Competitor", "key_offerings": "Clearing and Settlement, Roaming Steering, and Interconnect Optimization.", "versus_mobileum": "Mobileum features advanced signaling firewall security and eSIM, while Tomia focuses on wholesale margins." },
  { "name": "Subex", "category": "Direct Competitor", "key_offerings": "Business & Revenue Assurance, IoT security, and telecom Fraud Management.", "versus_mobileum": "Mobileum RAID 9 platform is highly modern with SaaS capabilities, whereas Subex has legacy deployments." },
  { "name": "BICS", "category": "Partner / Niche", "key_offerings": "International voice/SMS carrier routing, roaming hubs, and network quality testing.", "versus_mobileum": "Mobileum is a software vendor partner; we compete only on roaming active testing lines." }
];

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

export default function App() {
  const { countries: rawCountries, metadata: rawMetadata } = TELECOM_DATA;

  // Map MECA to MENA dynamically
  const countries = {};
  Object.entries(rawCountries).forEach(([name, c]) => {
    countries[name] = {
      ...c,
      region: c.region === 'MECA' ? 'MENA' : c.region
    };
  });
  const metadata = {
    ...rawMetadata,
    regions: rawMetadata.regions.map(r => r === 'MECA' ? 'MENA' : r)
  };

  const [theme, setTheme] = useState('light');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [currentLens, setCurrentLens] = useState('cluster');
  const [activeRegion, setActiveRegion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const [ticketData, setTicketData] = useState(null);
  const [amcData, setAmcData] = useState([]);
  const [competitorData, setCompetitorData] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    if (!selectedCountry) return;

    setIsDataLoading(true);
    const timer = setTimeout(() => {
      const tickets = MOCK_TICKETS[selectedCountry] || {
        "total_tickets": 620,
        "trend_12_months": [
          { "month": "Jun", "count": 45 }, { "month": "Jul", "count": 52 },
          { "month": "Aug", "count": 38 }, { "month": "Sep", "count": 47 },
          { "month": "Oct", "count": 55 }, { "month": "Nov", "count": 62 },
          { "month": "Dec", "count": 58 }, { "month": "Jan", "count": 49 },
          { "month": "Feb", "count": 41 }, { "month": "Mar", "count": 53 },
          { "month": "Apr", "count": 60 }, { "month": "May", "count": 50 }
        ],
        "business_units": [
          { "unit": "Risk", "tickets": 150, "color": "#7c3aed" },
          { "unit": "Fraud", "tickets": 180, "color": "#ef4444" },
          { "unit": "Roaming Management", "tickets": 110, "color": "#10b981" },
          { "unit": "Network Security", "tickets": 90, "color": "#3b82f6" },
          { "unit": "Customer Intelligence", "tickets": 90, "color": "#ea580c" }
        ]
      };

      const ops = countries[selectedCountry]?.operators || [];
      const amcs = MOCK_AMC[selectedCountry] || ops.map((op, idx) => {
        const buList = ["Risk (RAID 9)", "Roaming Management", "Network Security", "Fraud Management", "Revenue Assurance"];
        const bu = buList[idx % buList.length];
        const chars = ['X', 'Y', 'Z', 'W', 'V'];
        const char = chars[idx % chars.length];
        return {
          "contract_id": `AMC-2026-${char}${Math.floor(Math.random() * 90) + 10}`,
          "business_unit": bu,
          "client_name": op.operator,
          "outstanding_amount": (350000.00 - idx * 70000) * (Math.random() * 0.4 + 0.8),
          "due_date": `2026-07-${10 + idx * 5}`
        };
      });

      setTicketData(tickets);
      setAmcData(amcs);
      setCompetitorData(MOCK_COMPETITORS);
      setIsDataLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedCountry]);

  // Sync theme state with DOM element class for CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }, [theme]);

  // Handle search typing
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const queryLower = q.toLowerCase().trim();
    const matches = Object.keys(countries)
      .filter(c => c.toLowerCase().includes(queryLower))
      .slice(0, 10);
    setSearchResults(matches);
  };

  const handleSelectSearchItem = (name) => {
    setSelectedCountry(name);
    setSearchQuery(name);
    setSearchResults([]);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const openCompareModal = () => {
    if (selectedCountry && compareList.length < 3 && !compareList.includes(selectedCountry)) {
      setCompareList(prev => [...prev, selectedCountry]);
    }
    setIsCompareOpen(true);
  };

  const removeCompare = (name) => {
    setCompareList(prev => prev.filter(c => c !== name));
  };

  return (
    <>
      {/* TOP BAR */}
      <div id="topbar">
        <div className="logo">
          <div className="logo-dot"></div>
          MOBILEUM
          <span className="subtitle">GLOBAL TELECOM INTELLIGENCE PLATFORM</span>
        </div>
        <div className="spacer"></div>
        <div className="stats-bar">
          <div className="stat-pill">Countries <span>{metadata.total_countries}</span></div>
          <div className="stat-pill">Operators <span>{metadata.total_operators}</span></div>
          <div className="stat-pill">Regions <span>{metadata.regions?.length || 5}</span></div>
        </div>

        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            id="search-box"
            placeholder="🔍  Search country..."
            value={searchQuery}
            onChange={handleSearchChange}
            autoComplete="off"
          />
          {searchResults.length > 0 && (
            <div id="search-results">
              {searchResults.map(c => (
                <div
                  key={c}
                  className="search-item"
                  onClick={() => handleSelectSearchItem(c)}
                >
                  {getFlagEmoji(countries[c].iso)} {c}{' '}
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                    {countries[c].region}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div id="filterbar">
        <span className="lens-label">MAP LENS:</span>
        {[
          { key: 'cluster', label: 'Market Cluster' },
          { key: 'fraud', label: 'Fraud Risk' },
          { key: 'fiveG', label: '5G Readiness' },
          { key: 'roaming', label: 'Roaming Intensity' },
          { key: 'arpu', label: 'ARPU Pressure' }
        ].map(lens => (
          <button
            key={lens.key}
            className={`filter-btn ${currentLens === lens.key ? 'active' : ''}`}
            onClick={() => setCurrentLens(lens.key)}
          >
            {lens.label}
          </button>
        ))}

        <div className="filter-sep"></div>

        <span className="lens-label">REGION:</span>
        {['all', 'MENA', 'Europe', 'APAC', 'LATAM'].map(region => (
          <button
            key={region}
            className={`filter-btn ${activeRegion === region ? 'active' : ''}`}
            onClick={() => setActiveRegion(region)}
          >
            {region === 'all' ? 'All' : region}
          </button>
        ))}

        <div className="filter-sep"></div>

        <button className="filter-btn" onClick={openCompareModal}>
          ⊕ Compare Countries
        </button>
      </div>

      {/* MAIN APP CONTAINER */}
      <div id="app">
        {!selectedCountry ? (
          <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
            {activeRegion !== 'all' && (
              <div className="region-sidebar" style={{
                width: '320px',
                background: 'var(--bg-card)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    🌍 {activeRegion} Countries
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {Object.values(countries).filter(c => c.region === activeRegion).length} markets available
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(countries)
                    .filter(([_, c]) => c.region === activeRegion)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([name, c]) => {
                      const clr = CLUSTER_COLORS[c.cluster_name] || '#3b82f6';
                      return (
                        <div
                          key={name}
                          className="region-country-card"
                          onClick={() => setSelectedCountry(name)}
                          style={{
                            background: 'var(--bg-card2)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--blue)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {getFlagEmoji(c.iso)} {name}
                            </span>
                            <span style={{
                              fontSize: '9px',
                              background: `${clr}15`,
                              color: clr,
                              border: `1px solid ${clr}33`,
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontWeight: '600'
                            }}>
                              {c.num_operators} Ops
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                            <span>{c.sub_region || '—'}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{c.cluster_name}</span>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}

            <div id="map-container" style={{ flex: 1, position: 'relative' }}>
              <MapComponent
                countries={countries}
                currentLens={currentLens}
                activeRegion={activeRegion}
                onSelectCountry={setSelectedCountry}
                theme={theme}
              />
              <div id="map-hover-box">Click any country to open detailed analysis</div>

              {/* Map Legend */}
              <div id="legend">
                <h4 id="legend-title">
                  {
                    {
                      cluster: 'Market Cluster',
                      fraud: 'Fraud Risk',
                      fiveG: '5G Readiness',
                      roaming: 'Roaming Intensity',
                      arpu: 'ARPU Pressure'
                    }[currentLens]
                  }
                </h4>
                <div id="legend-items">
                  {currentLens === 'cluster' ? (
                    Object.entries({
                      'Mature & Saturated': '#9B59B6',
                      'High Growth Corridor': '#F39C12',
                      'Emerging Mid-Tier': '#1ABC9C',
                      'Small Wealthy Market': '#2ECC71',
                      'Frontier Market': '#E74C3C',
                      'Regulatory Transition': '#7F8C8D',
                    }).map(([name, color]) => (
                      <div className="legend-row" key={name}>
                        <div className="legend-dot" style={{ background: color }}></div>
                        {name}
                      </div>
                    ))
                  ) : currentLens === 'fraud' ? (
                    [
                      { label: 'Very Low', color: '#1ABC9C' },
                      { label: 'Low', color: '#F39C12' },
                      { label: 'Medium', color: '#E67E22' },
                      { label: 'High', color: '#E74C3C' },
                      { label: 'Critical', color: '#C0392B' }
                    ].map(item => (
                      <div className="legend-row" key={item.label}>
                        <div className="legend-dot" style={{ background: item.color }}></div>
                        {item.label}
                      </div>
                    ))
                  ) : currentLens === 'fiveG' ? (
                    [
                      { label: '<20%', color: '#1e3054' },
                      { label: '20-40%', color: '#1A5276' },
                      { label: '40-60%', color: '#2471A3' },
                      { label: '60-80%', color: '#2980B9' },
                      { label: '>80%', color: '#1ABC9C' }
                    ].map(item => (
                      <div className="legend-row" key={item.label}>
                        <div className="legend-dot" style={{ background: item.color }}></div>
                        {item.label}
                      </div>
                    ))
                  ) : currentLens === 'roaming' ? (
                    [
                      { label: 'Minimal', color: '#1e3054' },
                      { label: 'Low', color: '#1A5276' },
                      { label: 'Moderate', color: '#2471A3' },
                      { label: 'High', color: '#2980B9' },
                      { label: 'Very High', color: '#1ABC9C' }
                    ].map(item => (
                      <div className="legend-row" key={item.label}>
                        <div className="legend-dot" style={{ background: item.color }}></div>
                        {item.label}
                      </div>
                    ))
                  ) : (
                    [
                      { label: 'Growing', color: '#27AE60' },
                      { label: 'Stable', color: '#F39C12' },
                      { label: 'Pressure', color: '#E67E22' },
                      { label: 'Critical', color: '#E74C3C' }
                    ].map(item => (
                      <div className="legend-row" key={item.label}>
                        <div className="legend-dot" style={{ background: item.color }}></div>
                        {item.label}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard-selected-layout" style={{ display: 'flex', width: '100%', height: '100%', gap: '20px', padding: '16px', overflow: 'hidden' }}>
            <StaticCountrySidebar
              selectedCountry={selectedCountry}
              countryData={countries[selectedCountry]}
              onClose={() => setSelectedCountry(null)}
              getFlagEmoji={getFlagEmoji}
            />
            <DynamicCenterDashboard
              selectedCountry={selectedCountry}
              countryData={countries[selectedCountry]}
              allCountries={countries}
              metadata={metadata}
              getFlagEmoji={getFlagEmoji}
              theme={theme}
              ticketData={ticketData}
              amcData={amcData}
              competitorData={competitorData}
              isDataLoading={isDataLoading}
            />
          </div>
        )}
      </div>

      {/* COMPARISON SLIDE-UP PILLS BAR */}
      {compareList.length > 0 && (
        <div id="compare-bar" className="visible">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
            COMPARING:
          </span>
          <div id="compare-pills" style={{ display: 'flex', gap: '8px' }}>
            {compareList.map(c => (
              <div className="compare-pill" key={c}>
                {getFlagEmoji(countries[c]?.iso)} {c}{' '}
                <span className="compare-remove" onClick={() => removeCompare(c)}>✕</span>
              </div>
            ))}
          </div>
          <button id="compare-go" onClick={() => setIsCompareOpen(true)}>
            Compare Now →
          </button>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
            onClick={() => setCompareList([])}
          >
            ✕
          </button>
        </div>
      )}

      {/* EXPORT FLOATING REPORT BUTTON */}
      {selectedCountry && (
        <button
          id="export-btn"
          onClick={() => exportReport(selectedCountry, countries[selectedCountry], metadata)}
        >
          ↓ Export Report
        </button>
      )}

      {/* SIDE-BY-SIDE COMPARISON MODAL */}
      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        compareList={compareList}
        setCompareList={setCompareList}
        countries={countries}
        getFlagEmoji={getFlagEmoji}
      />
    </>
  );
}
