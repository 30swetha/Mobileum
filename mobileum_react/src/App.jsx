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

const MOCK_ACCOUNT_INSIGHTS = {
  "Saudi Arabia": {
    productSection: {
      mobileumProducts: ['RAID 9 Fraud Management', 'Roaming DNA', 'Steering of Roaming', '5G Active Testing'],
      competitionProducts: ['Syniverse clearing & transport', 'Tomia roaming steering', 'Subex assurance'],
      productGaps: ['Managed security operations for smaller operators', 'Faster deployment accelerators for legacy stacks'],
      managedServicesPossibility: ['24x7 operations support', 'Fraud analytics tuning', 'Roaming performance managed service'],
      replaceableCompetitors: ['Syniverse', 'Subex'],
      finalStrategies: [
        'Displace Syniverse clearing footprint at STC and Mobily via Roaming DNA integration',
        'Pitch RAID 9 Fraud Management to Zain KSA to replace legacy Subex assurance stack',
        'Deploy Roaming DNA active steering trials to capture high-value outbound business routes'
      ]
    },
    financialSection: {
      profit: '$3.8M annualized revenue potential',
      capexInvestment: '$1.2M in platform enablement and deployment support',
      note: 'High-value upsell path through managed services and roaming assurance.'
    },
    renewalSection: {
      amcRenewal: [
        { name: 'Risk / RAID 9', value: '$420K', status: 'Renewal due in Q3' },
        { name: 'Roaming Management', value: '$210K', status: 'In discussion' }
      ],
      managedServicesRenewal: [
        { name: 'Fraud operations support', value: '$180K', status: 'Renewal ready' },
        { name: 'Roaming analytics service', value: '$160K', status: 'Pilot under review' }
      ]
    },
    healthSection: {
      installedProductWiseSupportTicket: [
        { product: 'RAID 9', tickets: 18, trend: 'Stable' },
        { product: 'Roaming DNA', tickets: 11, trend: 'Improving' },
        { product: '5G Active Testing', tickets: 7, trend: 'Low' }
      ],
      usageOfInstalledProducts: [
        { product: 'RAID 9', usage: '92% of fraud rules active' },
        { product: 'Roaming DNA', usage: '78% of roaming steering workflows used' },
        { product: 'Active Testing', usage: '65% of network test cases in production' }
      ]
    },
    plan2026: {
      productsFocusedOn: ['Steering of Roaming', 'Roaming DNA', 'Managed Fraud Operations'],
      valueOfOpportunities: '$5.4M pipeline in 2026',
      pocOrDemoGiven: 'PoC completed for roaming analytics and fraud rules tuning',
      consultingTrialsGiven: '2 consulting trials and 1 sandbox onboarding workshop'
    }
  },
  "UAE": {
    productSection: {
      mobileumProducts: ['Roaming DNA', 'Fraud Management', 'Customer Intelligence', 'eSIM & OTA'],
      competitionProducts: ['BICS roaming hub', 'Syniverse transport', 'Tomia settlement'],
      productGaps: ['Advanced managed services for legacy roaming workflows', 'Faster rollout for data analytics modules'],
      managedServicesPossibility: ['Managed QA and incident response', 'Roaming performance optimization service'],
      replaceableCompetitors: ['BICS', 'Tomia'],
      finalStrategies: [
        'Replace BICS roaming hub at e& UAE with Mobileum eSIM solutions and steering systems',
        'Position modern signaling firewall trials at du to address OTT bypass substitution',
        'Initiate eSIM & OTA platform sandbox onboarding workshop to capture digital nomads'
      ]
    },
    financialSection: {
      profit: '$2.9M annualized revenue potential',
      capexInvestment: '$0.9M in solution onboarding and integration support',
      note: 'Priority is to convert existing contracts into higher-value managed services.'
    },
    renewalSection: {
      amcRenewal: [
        { name: 'Roaming DNA', value: '$360K', status: 'Renewal in Q4' },
        { name: 'Customer Intelligence', value: '$240K', status: 'Renewal planning' }
      ],
      managedServicesRenewal: [
        { name: 'Advanced analytics support', value: '$150K', status: 'Ready for renewal' },
        { name: 'Network operations advisory', value: '$130K', status: 'Upsell candidate' }
      ]
    },
    healthSection: {
      installedProductWiseSupportTicket: [
        { product: 'Roaming DNA', tickets: 14, trend: 'Moderate' },
        { product: 'Fraud Management', tickets: 10, trend: 'Stable' },
        { product: 'Customer Intelligence', tickets: 8, trend: 'Improving' }
      ],
      usageOfInstalledProducts: [
        { product: 'Fraud Management', usage: '85% of alerts monitored in production' },
        { product: 'Roaming DNA', usage: '70% of steering actions enabled' },
        { product: 'Customer Intelligence', usage: '60% of dashboards actively used' }
      ]
    },
    plan2026: {
      productsFocusedOn: ['Fraud Management', 'Roaming DNA', 'Managed Services'],
      valueOfOpportunities: '$4.1M pipeline in 2026',
      pocOrDemoGiven: 'Demo delivered for active testing and fraud analytics to the account team',
      consultingTrialsGiven: '1 consulting trial and 2 solution workshops'
    }
  }
};

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
      region: c.region ? c.region.replace(/MECA/g, 'MENA') : c.region,
      sub_region: c.sub_region ? c.sub_region.replace(/MECA/g, 'MENA') : c.sub_region,
      cluster_name: c.cluster_name ? c.cluster_name.replace(/MECA/g, 'MENA') : c.cluster_name
    };
  });
  const metadata = {
    ...rawMetadata,
    regions: [...new Set(rawMetadata.regions.map(r => r === 'MECA' ? 'MENA' : r))]
  };

  const [theme, setTheme] = useState('light');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [currentLens, setCurrentLens] = useState('cluster');
  const [activeRegion, setActiveRegion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [showGlobalOverview, setShowGlobalOverview] = useState(false);

  const [ticketData, setTicketData] = useState(null);
  const [amcData, setAmcData] = useState([]);
  const [competitorData, setCompetitorData] = useState([]);
  const [accountData, setAccountData] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('operators');
  const [selectedOperator, setSelectedOperator] = useState(null);

  const aggregateRegionData = (regionName) => {
    const activeCountriesList = Object.entries(countries).filter(([name, c]) => {
      if (regionName === 'all') return true;
      return c.region === regionName;
    });

    if (activeCountriesList.length === 0) return null;

    const num_operators = activeCountriesList.reduce((sum, [_, c]) => sum + (c.num_operators || 0), 0);
    
    const statsKeys = ['mobile_penetration', 'gdp_growth', 'avg_age', 'avg_5g', 'avg_sub_growth', 'avg_market_health', 'fraud_score', 'roaming_intensity', 'internet_users', 'gdp_per_capita', 'population', 'mobile_users'];
    const stats = {};
    statsKeys.forEach(k => {
      const vals = activeCountriesList.map(([_, c]) => c.stats?.[k]).filter(v => v !== undefined && v !== null && !isNaN(v));
      stats[k] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });

    const radarKeys = ['roaming_opportunity', 'fraud_risk', 'fiveG_upsell', 'arpu_pressure', 'subscriber_growth', 'regulatory_risk'];
    const radar = {};
    radarKeys.forEach(k => {
      const vals = activeCountriesList.map(([_, c]) => c.radar?.[k]).filter(v => v !== undefined && v !== null && !isNaN(v));
      radar[k] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 3.0;
    });

    const waterfallKeys = ['base', 'ott_substitution', 'arpu_compression', 'churn_pressure', 'roaming_upside', 'fiveG_upside', 'net'];
    const waterfall = {};
    waterfallKeys.forEach(k => {
      const vals = activeCountriesList.map(([_, c]) => c.waterfall?.[k]).filter(v => v !== undefined && v !== null && !isNaN(v));
      waterfall[k] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0.0;
    });

    const seasonal_roaming = {};
    for (let m = 1; m <= 12; m++) {
      const vals = activeCountriesList.map(([_, c]) => c.seasonal_roaming?.[m]).filter(v => v !== undefined && v !== null);
      seasonal_roaming[m] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 1;
    }

    const productScores = {};
    activeCountriesList.forEach(([_, c]) => {
      if (c.product_ranking) {
        c.product_ranking.forEach(pr => {
          if (!productScores[pr.product]) {
            productScores[pr.product] = { scores: [], reasons: [] };
          }
          productScores[pr.product].scores.push(pr.score);
          productScores[pr.product].reasons.push(pr.reason);
        });
      }
    });

    const product_ranking = Object.entries(productScores).map(([prod, data]) => {
      const score = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
      return {
        product: prod,
        score: score,
        reason: `Aggregated fit for ${regionName === 'all' ? 'global' : regionName} region: average match score is ${score}%.`
      };
    }).sort((a, b) => b.score - a.score);

    const top_product = product_ranking.length > 0 ? product_ranking[0] : null;

    const operators = activeCountriesList.flatMap(([name, c]) => 
      (c.operators || []).map(op => ({ ...op, countryName: name }))
    );

    return {
      country: regionName === 'all' ? 'Global Overview' : `${regionName} Region`,
      region: regionName === 'all' ? 'Global' : regionName,
      sub_region: 'Aggregated Region Analysis',
      iso: 'WLD',
      num_operators,
      operators,
      stats,
      percentiles: stats,
      regional_averages: stats,
      radar,
      waterfall,
      seasonal_roaming,
      product_ranking,
      cluster_name: regionName === 'all' ? 'Global Markets' : `${regionName} Markets`,
      anomaly_text: null,
      top_product,
      anomaly_z_score: 0
    };
  };

  const getAggregatedTickets = (regionName) => {
    let total = 0;
    const buTickets = {};
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
      const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
      return { month: months[i], count: 0 };
    });

    Object.entries(MOCK_TICKETS).forEach(([country, data]) => {
      const cv = countries[country];
      if (cv && (regionName === 'all' || cv.region === regionName)) {
        total += data.total_tickets;
        data.trend_12_months.forEach((t, idx) => {
          monthlyTrend[idx].count += t.count;
        });
        data.business_units.forEach(bu => {
          if (!buTickets[bu.unit]) {
            buTickets[bu.unit] = { tickets: 0, color: bu.color };
          }
          buTickets[bu.unit].tickets += bu.tickets;
        });
      }
    });

    if (total === 0) {
      return {
        total_tickets: 4200,
        trend_12_months: monthlyTrend.map(m => ({ ...m, count: Math.floor(Math.random() * 200) + 150 })),
        business_units: [
          { unit: "Risk", tickets: 1200, color: "#7c3aed" },
          { unit: "Fraud", tickets: 1500, color: "#ef4444" },
          { unit: "Roaming Management", tickets: 800, color: "#10b981" },
          { unit: "Network Security", tickets: 400, color: "#3b82f6" },
          { unit: "Customer Intelligence", tickets: 300, color: "#ea580c" }
        ]
      };
    }

    return {
      total_tickets: total,
      trend_12_months: monthlyTrend,
      business_units: Object.entries(buTickets).map(([unit, info]) => ({
        unit,
        tickets: info.tickets,
        color: info.color
      }))
    };
  };

  const getAggregatedAMC = (regionName) => {
    const list = [];
    Object.entries(MOCK_AMC).forEach(([country, amcs]) => {
      const cv = countries[country];
      if (cv && (regionName === 'all' || cv.region === regionName)) {
        list.push(...amcs);
      }
    });
    
    if (list.length === 0) {
      const activeCountriesList = Object.entries(countries).filter(([_, c]) => regionName === 'all' || c.region === regionName);
      activeCountriesList.slice(0, 5).forEach(([cName, cv]) => {
        const ops = cv.operators || [];
        ops.slice(0, 1).forEach((op) => {
          list.push({
            "contract_id": `AMC-2026-REG-${op.operator.substring(0,3).toUpperCase()}`,
            "business_unit": "Risk (RAID 9)",
            "client_name": `${op.operator} (${cName})`,
            "outstanding_amount": 250000.00,
            "due_date": "2026-09-30"
          });
        });
      });
    }

    return list;
  };

  const getAggregatedAccountData = (regionName) => {
    const activeCountries = Object.keys(MOCK_ACCOUNT_INSIGHTS).filter(c => {
      const cv = countries[c];
      return cv && (regionName === 'all' || cv.region === regionName);
    });

    const mobileumProductsSet = new Set();
    const competitionProductsSet = new Set();
    const productGapsSet = new Set();
    const managedServicesPossibilitySet = new Set();
    const replaceableCompetitorsSet = new Set();
    const finalStrategiesSet = new Set();

    activeCountries.forEach(c => {
      const section = MOCK_ACCOUNT_INSIGHTS[c].productSection;
      if (section) {
        section.mobileumProducts?.forEach(p => mobileumProductsSet.add(p));
        section.competitionProducts?.forEach(p => competitionProductsSet.add(p));
        section.productGaps?.forEach(p => productGapsSet.add(p));
        section.managedServicesPossibility?.forEach(p => managedServicesPossibilitySet.add(p));
        section.replaceableCompetitors?.forEach(p => replaceableCompetitorsSet.add(p));
        section.finalStrategies?.forEach(p => finalStrategiesSet.add(p));
      }
    });

    if (mobileumProductsSet.size === 0) {
      ['Fraud Management', 'Roaming DNA', 'Steering of Roaming', '5G Active Testing'].forEach(p => mobileumProductsSet.add(p));
      ['Syniverse clearing', 'Tomia roaming'].forEach(p => competitionProductsSet.add(p));
      ['Managed services enablement', 'Fast-track onboarding'].forEach(p => productGapsSet.add(p));
      ['Managed fraud operations', 'Roaming optimization'].forEach(p => managedServicesPossibilitySet.add(p));
      ['Syniverse'].forEach(p => replaceableCompetitorsSet.add(p));
      ['Transition operators to SaaS models', 'Target legacy competitor deployments for replacement', 'Establish managed services pilot programs'].forEach(p => finalStrategiesSet.add(p));
    }

    let totalProfit = 0;
    let totalCapex = 0;
    activeCountries.forEach(c => {
      const fin = MOCK_ACCOUNT_INSIGHTS[c].financialSection;
      if (fin) {
        const p = parseFloat(fin.profit.replace(/[^0-9.]/g, '')) || 0;
        const cx = parseFloat(fin.capexInvestment.replace(/[^0-9.]/g, '')) || 0;
        totalProfit += p;
        totalCapex += cx;
      }
    });
    if (totalProfit === 0) {
      totalProfit = 12.5;
      totalCapex = 4.2;
    }

    const amcRenewal = [];
    const managedServicesRenewal = [];
    const installedTicketsMap = {};
    const usageMap = {};

    activeCountries.forEach(c => {
      const renewal = MOCK_ACCOUNT_INSIGHTS[c].renewalSection;
      if (renewal) {
        renewal.amcRenewal?.forEach(r => amcRenewal.push({ ...r, name: `${c} - ${r.name}` }));
        renewal.managedServicesRenewal?.forEach(r => managedServicesRenewal.push({ ...r, name: `${c} - ${r.name}` }));
      }
      const health = MOCK_ACCOUNT_INSIGHTS[c].healthSection;
      if (health) {
        health.installedProductWiseSupportTicket?.forEach(h => {
          if (!installedTicketsMap[h.product]) {
            installedTicketsMap[h.product] = { tickets: 0, trend: h.trend };
          }
          installedTicketsMap[h.product].tickets += h.tickets;
        });
        health.usageOfInstalledProducts?.forEach(u => {
          usageMap[u.product] = (usageMap[u.product] || '') + `; ${c}: ${u.usage}`;
        });
      }
    });

    if (amcRenewal.length === 0) {
      amcRenewal.push({ name: 'Primary AMC renewal', value: '$850K', status: 'Renewal due Q4' });
      managedServicesRenewal.push({ name: 'Managed Roaming Support', value: '$450K', status: 'Renewal due Q3' });
      installedTicketsMap['Core Platform'] = { tickets: 24, trend: 'Stable' };
      usageMap['Core Platform'] = 'High usage across regional operators';
    }

    let totalPipeline = 0;
    const allProductsFocused = new Set();
    activeCountries.forEach(c => {
      const plan = MOCK_ACCOUNT_INSIGHTS[c].plan2026;
      if (plan) {
        const pip = parseFloat(plan.valueOfOpportunities.replace(/[^0-9.]/g, '')) || 0;
        totalPipeline += pip;
        plan.productsFocusedOn?.forEach(p => allProductsFocused.add(p));
      }
    });
    if (totalPipeline === 0) {
      totalPipeline = 18.4;
      ['Roaming DNA', 'Fraud Management', 'Steering of Roaming'].forEach(p => allProductsFocused.add(p));
    }

    return {
      productSection: {
        mobileumProducts: Array.from(mobileumProductsSet),
        competitionProducts: Array.from(competitionProductsSet),
        productGaps: Array.from(productGapsSet),
        managedServicesPossibility: Array.from(managedServicesPossibilitySet),
        replaceableCompetitors: Array.from(replaceableCompetitorsSet),
        finalStrategies: Array.from(finalStrategiesSet)
      },
      financialSection: {
        profit: `$${totalProfit.toFixed(1)}M ARR Potential`,
        capexInvestment: `$${totalCapex.toFixed(1)}M Total Capex`,
        note: `Overall growth and renewal strategy for the ${regionName === 'all' ? 'global' : regionName} markets.`
      },
      renewalSection: {
        amcRenewal,
        managedServicesRenewal
      },
      healthSection: {
        installedProductWiseSupportTicket: Object.entries(installedTicketsMap).map(([prod, info]) => ({
          product: prod,
          tickets: info.tickets,
          trend: info.trend
        })),
        usageOfInstalledProducts: Object.entries(usageMap).map(([prod, txt]) => ({
          product: prod,
          usage: typeof txt === 'string' && txt.startsWith(';') ? txt.substring(2) : txt
        }))
      },
      plan2026: {
        productsFocusedOn: Array.from(allProductsFocused),
        valueOfOpportunities: `$${totalPipeline.toFixed(1)}M pipeline in 2026`,
        pocOrDemoGiven: `Demonstrations completed across active regional accounts.`,
        consultingTrialsGiven: `Active consulting engagements and pilot evaluations running across the region.`
      }
    };
  };

  useEffect(() => {
    setIsDataLoading(true);
    const timer = setTimeout(() => {
      if (!selectedCountry) {
        // Aggregated region mode loading
        const tickets = getAggregatedTickets(activeRegion);
        const amcs = getAggregatedAMC(activeRegion);
        const accountInsight = getAggregatedAccountData(activeRegion);

        setTicketData(tickets);
        setAmcData(amcs);
        setCompetitorData(MOCK_COMPETITORS);
        setAccountData(accountInsight);
        setIsDataLoading(false);
        return;
      }

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

      // Base account insights
      const baseInsight = MOCK_ACCOUNT_INSIGHTS[selectedCountry] || {
        productSection: {
          mobileumProducts: ['Fraud Management', 'Roaming DNA'],
          competitionProducts: ['Syniverse clearing', 'Tomia roaming'],
          productGaps: ['Managed services enablement', 'Fast-track onboarding'],
          managedServicesPossibility: ['Managed fraud operations', 'Roaming optimization'],
          replaceableCompetitors: ['Syniverse'],
          finalStrategies: ['Upsell core platforms to SaaS models', 'Target legacy competitor deployments for replacement', 'Establish managed services pilot programs']
        },
        financialSection: {
          profit: '$2.5M projected value',
          capexInvestment: '$0.8M deployment investment',
          note: 'A strong 2026 growth path through upsell and managed services.'
        },
        renewalSection: {
          amcRenewal: [{ name: 'Primary AMC contract', value: '$200K', status: 'Renewal in plan' }],
          managedServicesRenewal: [{ name: 'Managed support service', value: '$150K', status: 'Renewal opportunity' }]
        },
        healthSection: {
          installedProductWiseSupportTicket: [{ product: 'Core Platform', tickets: 9, trend: 'Stable' }],
          usageOfInstalledProducts: [{ product: 'Core Platform', usage: 'High usage across the account' }]
        },
        plan2026: {
          productsFocusedOn: ['Roaming DNA', 'Fraud Management'],
          valueOfOpportunities: '$3.5M pipeline',
          pocOrDemoGiven: 'Demo and solution workshop completed',
          consultingTrialsGiven: '1 consulting trial scheduled'
        }
      };

      let opInsight = { ...baseInsight };

      if (selectedOperator) {
        const opData = ops.find(o => o.operator === selectedOperator);
        const plan = opData?.plan2026 || {
          productsFocusedOn: baseInsight.plan2026.productsFocusedOn,
          valueOfOpportunities: `$2.5M pipeline for ${selectedOperator}`,
          pocOrDemoGiven: `PoC successfully showcased to ${selectedOperator} team`,
          consultingTrialsGiven: baseInsight.plan2026.consultingTrialsGiven,
          strategies: [
            `Target ${selectedOperator} for full RAID 9 Fraud Management migration`,
            `Position modern Steering of Roaming solutions`,
            `Conduct sandbox onboarding workshops`
          ]
        };

        // Find if there are specific AMCs for this operator
        const opAmcs = amcs.filter(row => {
          const client = row.client_name.toLowerCase();
          const op = selectedOperator.toLowerCase();
          return client.includes(op) || op.includes(client);
        });
        
        const amcList = opAmcs.length > 0 
          ? opAmcs.map(row => ({ name: `AMC - ${row.business_unit}`, value: `$${(row.outstanding_amount / 1000).toFixed(0)}K`, status: 'Renewal Pending' }))
          : [{ name: `Primary AMC contract for ${selectedOperator}`, value: '$150K', status: 'Active Support' }];

        opInsight = {
          productSection: {
            mobileumProducts: plan.productsFocusedOn,
            competitionProducts: baseInsight.productSection.competitionProducts,
            productGaps: baseInsight.productSection.productGaps,
            managedServicesPossibility: baseInsight.productSection.managedServicesPossibility,
            replaceableCompetitors: baseInsight.productSection.replaceableCompetitors,
            finalStrategies: plan.strategies
          },
          financialSection: {
            profit: `$${(Math.random() * 1.5 + 1).toFixed(1)}M ARR for ${selectedOperator}`,
            capexInvestment: `$${(Math.random() * 0.4 + 0.2).toFixed(1)}M enabled capex for ${selectedOperator}`,
            note: `Strategic financial plan customized for ${selectedOperator}: focus on upsell to RAID 9 SaaS.`
          },
          renewalSection: {
            amcRenewal: amcList,
            managedServicesRenewal: [
              { name: `${selectedOperator} - Managed Support`, value: '$120K', status: 'Renewal ready' }
            ]
          },
          healthSection: {
            installedProductWiseSupportTicket: baseInsight.healthSection.installedProductWiseSupportTicket.map(h => ({
              ...h,
              product: `${h.product} (${selectedOperator})`
            })),
            usageOfInstalledProducts: baseInsight.healthSection.usageOfInstalledProducts.map(u => ({
              ...u,
              product: `${u.product} (${selectedOperator})`
            }))
          },
          plan2026: plan
        };
      }

      setTicketData(tickets);
      setAmcData(amcs);
      setCompetitorData(MOCK_COMPETITORS);
      setAccountData(opInsight);
      setIsDataLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedCountry, selectedOperator, activeRegion]);

  // Reset tab and operator on country change
  useEffect(() => {
    setActiveTab('operators');
    setSelectedOperator(null);
  }, [selectedCountry]);

  // Reset operator selection on tab change if moving away from operator/account context
  useEffect(() => {
    if (activeTab !== 'account' && activeTab !== 'operators') {
      setSelectedOperator(null);
    }
  }, [activeTab]);

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

        <button 
          className={`filter-btn ${showGlobalOverview && !selectedCountry ? 'active' : ''}`} 
          onClick={() => {
            setSelectedCountry(null);
            setShowGlobalOverview(prev => !prev);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          🌍 Global Overview
        </button>

        <div className="filter-sep"></div>

        <button className="filter-btn" onClick={openCompareModal}>
          ⊕ Compare Countries
        </button>
      </div>

      {/* MAIN APP CONTAINER */}
      <div id="app">
        <div style={{ display: 'flex', width: '100%', height: '100%', gap: '20px', padding: '16px', overflow: 'hidden' }}>
          {/* Left panel: Map (Always Visible) with Floating Overlay Sidebar */}
          <div style={{ display: (!selectedCountry && showGlobalOverview) ? 'none' : 'flex', flex: 1.2, height: '100%', overflow: 'hidden', position: 'relative' }}>
            <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
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

            {/* Country Floating Overlay Sidebar (positioned inside Map panel) */}
            {selectedCountry && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: activeRegion !== 'all' ? '336px' : '16px',
                maxHeight: 'calc(100% - 32px)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <StaticCountrySidebar
                  selectedCountry={selectedCountry}
                  countryData={countries[selectedCountry]}
                  onClose={() => {
                    setSelectedCountry(null);
                    setSelectedOperator(null);
                  }}
                  getFlagEmoji={getFlagEmoji}
                  selectedOperator={selectedOperator}
                  onSelectOperator={(opName) => {
                    setSelectedOperator(opName);
                    if (opName) {
                      setActiveTab('account');
                    } else {
                      setActiveTab('operators');
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Right panel: Dynamic Dashboard */}
          {(selectedCountry || showGlobalOverview) && (
            <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
              <DynamicCenterDashboard
                selectedCountry={selectedCountry}
              countryData={selectedCountry ? countries[selectedCountry] : aggregateRegionData(activeRegion)}
              allCountries={countries}
              metadata={metadata}
              getFlagEmoji={getFlagEmoji}
              theme={theme}
              ticketData={ticketData}
              amcData={amcData}
              competitorData={competitorData}
              accountData={accountData}
              isDataLoading={isDataLoading}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedOperator={selectedOperator}
              setSelectedOperator={setSelectedOperator}
              setSelectedCountry={setSelectedCountry}
              activeRegion={activeRegion}
              setActiveRegion={setActiveRegion}
              onCloseOverview={() => setShowGlobalOverview(false)}
            />
          </div>
          )}

        </div>
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
