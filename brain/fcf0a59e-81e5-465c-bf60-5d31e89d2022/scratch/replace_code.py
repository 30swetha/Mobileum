import os

file_path = r"c:\Users\SWETHA.S\Mobileum\mobileum_react\src\App.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's locate getAggregatedAMC and getAggregatedAccountData block
# It starts around: const getAggregatedAMC = (regionName) => {
# and ends around: getAggregatedAccountData block's end.
# Let's define the replacement string for this block.

old_methods = """  const getAggregatedAMC = (regionName) => {
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
  };"""

new_methods = """  const getAggregatedAMC = (regionName) => {
    const list = [];
    Object.entries(countries).forEach(([cName, cData]) => {
      if (regionName === 'all' || cData.region === regionName) {
        cData.operators?.forEach((op, opIdx) => {
          const opInsight = buildOperatorInsight(cName, op);
          if (opInsight) {
            opInsight.renewalSection.amcRenewal.forEach((amc, idx) => {
              const val = parseFloat(amc.value.replace(/[^0-9.]/g, '')) * 1000;
              list.push({
                contract_id: `AMC-2026-${op.operator.substring(0,3).toUpperCase()}-${opIdx}-${idx}`,
                business_unit: amc.name.replace(' AMC Support', ''),
                client_name: `${op.operator} (${cName})`,
                outstanding_amount: val,
                due_date: `2026-11-${15 + idx * 5}`
              });
            });
          }
        });
      }
    });
    return list;
  };

  const getAggregatedAccountData = (regionName) => {
    const activeCountriesList = Object.entries(countries).filter(([name, c]) => {
      return regionName === 'all' || c.region === regionName;
    });

    if (activeCountriesList.length === 0) {
      return {
        productSection: { mobileumProducts: [], competitionProducts: [], productGaps: [], managedServicesPossibility: [], replaceableCompetitors: [], finalStrategies: [] },
        financialSection: { profit: '$0.0M Projected Potential', capexInvestment: '$0.0M Capex Enabled', note: 'No data' },
        renewalSection: { amcRenewal: [], managedServicesRenewal: [] },
        healthSection: { installedProductWiseSupportTicket: [], usageOfInstalledProducts: [] },
        plan2026: { productsFocusedOn: [], valueOfOpportunities: '$0.0M pipeline', pocOrDemoGiven: '', consultingTrialsGiven: '' }
      };
    }

    let totalRevPot = 0;
    let totalCapex = 0;
    const allProducts = new Set();
    const allCompetitors = new Set();
    const allGaps = new Set();
    const allStrategies = [];
    const amcRenewal = [];
    const managedServicesRenewal = [];
    const installedTicketsMap = {};
    const usageMap = {};

    activeCountriesList.forEach(([cName, cData]) => {
      const countryInsight = buildCountryInsight(cName, cData);
      if (!countryInsight) return;

      const rMatch = countryInsight.financialSection.profit.match(/\\$?([0-9.]+)/);
      if (rMatch) totalRevPot += parseFloat(rMatch[1]);

      const cMatch = countryInsight.financialSection.capexInvestment.match(/\\$?([0-9.]+)/);
      if (cMatch) totalCapex += parseFloat(cMatch[1]);

      countryInsight.productSection.mobileumProducts.forEach(p => allProducts.add(p));
      countryInsight.productSection.competitionProducts.forEach(p => allCompetitors.add(p));
      countryInsight.productSection.productGaps.forEach(p => allGaps.add(p));
      countryInsight.productSection.finalStrategies.forEach(s => allStrategies.push(s));

      countryInsight.renewalSection.amcRenewal.forEach(amc => {
        amcRenewal.push(amc);
      });
      countryInsight.renewalSection.managedServicesRenewal.forEach(ms => {
        managedServicesRenewal.push(ms);
      });

      countryInsight.healthSection.installedProductWiseSupportTicket.forEach(t => {
        if (!installedTicketsMap[t.product]) {
          installedTicketsMap[t.product] = { tickets: 0, trend: t.trend };
        }
        installedTicketsMap[t.product].tickets += t.tickets;
      });
      countryInsight.healthSection.usageOfInstalledProducts.forEach(u => {
        usageMap[u.product] = (usageMap[u.product] || '') + `; ${u.product}: ${u.usage}`;
      });
    });

    return {
      productSection: {
        mobileumProducts: Array.from(allProducts).slice(0, 6),
        competitionProducts: Array.from(allCompetitors).slice(0, 4),
        productGaps: Array.from(allGaps).slice(0, 4),
        managedServicesPossibility: ['Managed Services Transformation', 'SaaS Licensing Migration'],
        replaceableCompetitors: ['Syniverse', 'Tomia', 'Subex'],
        finalStrategies: allStrategies.slice(0, 5)
      },
      financialSection: {
        profit: `$${totalRevPot.toFixed(1)}M Projected Potential`,
        capexInvestment: `$${totalCapex.toFixed(1)}M Capex Enabled`,
        note: `Aggregated regional financial plan for the ${regionName === 'all' ? 'global' : regionName} markets.`
      },
      renewalSection: {
        amcRenewal: amcRenewal.slice(0, 5),
        managedServicesRenewal: managedServicesRenewal.slice(0, 3)
      },
      healthSection: {
        installedProductWiseSupportTicket: Object.entries(installedTicketsMap).slice(0, 5).map(([prod, info]) => ({
          product: prod,
          tickets: info.tickets,
          trend: info.trend
        })),
        usageOfInstalledProducts: Object.entries(usageMap).slice(0, 5).map(([prod, txt]) => ({
          product: prod,
          usage: 'Aggregated regional solution usage'
        }))
      },
      plan2026: {
        productsFocusedOn: Array.from(allProducts).slice(0, 4),
        valueOfOpportunities: `$${totalRevPot.toFixed(1)}M pipeline`,
        pocOrDemoGiven: 'Demos and PoCs run across region operators.',
        consultingTrialsGiven: 'Solution sandbox workshops scheduled.'
      }
    };
  };"""

# Now replace the useEffect block
old_effect = """  useEffect(() => {
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
  }, [selectedCountry, selectedOperator, activeRegion]);"""

new_effect = """  useEffect(() => {
    setIsDataLoading(true);
    const timer = setTimeout(() => {
      if (!selectedCountry) {
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

      const cData = countries[selectedCountry];
      const tickets = getDynamicCountryTickets(selectedCountry, cData);

      const ops = cData?.operators || [];
      const amcs = [];
      ops.forEach((op, opIdx) => {
        const opInsight = buildOperatorInsight(selectedCountry, op);
        if (opInsight) {
          opInsight.renewalSection.amcRenewal.forEach((amc, idx) => {
            const val = parseFloat(amc.value.replace(/[^0-9.]/g, '')) * 1000;
            amcs.push({
              contract_id: `AMC-2026-OP${opIdx}-${idx}`,
              business_unit: amc.name.replace(' AMC Support', ''),
              client_name: op.operator,
              outstanding_amount: val,
              due_date: `2026-11-${15 + idx * 5}`
            });
          });
        }
      });

      let opInsight = buildCountryInsight(selectedCountry, cData);
      if (selectedOperator) {
        const opData = ops.find(o => o.operator === selectedOperator);
        opInsight = buildOperatorInsight(selectedCountry, opData);
      }

      setTicketData(tickets);
      setAmcData(amcs);
      setCompetitorData(MOCK_COMPETITORS);
      setAccountData(opInsight);
      setIsDataLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedCountry, selectedOperator, activeRegion]);"""

# Replace content
if old_methods in content:
    content = content.replace(old_methods, new_methods)
    print("Replaced old_methods successfully!")
else:
    print("WARNING: old_methods not found exactly. Trying partial match...")
    # fallback to a slightly more flexible replace or notify
    
if old_effect in content:
    content = content.replace(old_effect, new_effect)
    print("Replaced old_effect successfully!")
else:
    print("WARNING: old_effect not found exactly.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
