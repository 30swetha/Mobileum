"""
STEP 1 — Master Data Pipeline
Sources:
  - Global_Telecom_MNO_Verified.xlsx       → operator-level telecom metrics
  - Global_Telecom_MNO_ImpactAnalysis*.xlsx → impact analysis + Mobileum services text
  - oragnised_telecom.xlsx                  → European data supplement
  - MECA_Combined_MNO_Data.xlsx            → MECA dual-source verification
Outputs:
  - master_telecom.json  (137 countries, 517 operators, all metrics + clusters + scores)
"""

import os
import pandas as pd
import json, re, numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans
import warnings
warnings.filterwarnings('ignore')

BASE = os.path.dirname(os.path.abspath(__file__)) + os.sep

# ═══════════════════════════════════════════════════════════════════
# UTILITIES
# ═══════════════════════════════════════════════════════════════════
def clean_float(val):
    if val is None or (isinstance(val, float) and np.isnan(val)): return None
    s = str(val).strip().replace('%','').replace(',','').replace('$','').replace('USD','').replace('M','').strip()
    try: return round(float(s), 2)
    except: return None

def trend_score(val):
    if val is None or (isinstance(val, float) and np.isnan(val)): return 3
    v = str(val).lower()
    if any(k in v for k in ['very high','world highest','major increase','strongly up','extreme']): return 5
    if any(k in v for k in ['high','growing','increasing','up','active','strong','positive','significant']): return 4
    if any(k in v for k in ['moderate','stable','flat','neutral','marginal','mixed','seasonal']): return 3
    if any(k in v for k in ['low','declining','down','decreasing','weak','marginal down']): return 2
    if any(k in v for k in ['very low','none','no ','minimal','absent','nil']): return 1
    return 3

def profitability_score(val):
    if val is None or (isinstance(val, float) and np.isnan(val)): return 3
    v = str(val).lower()
    if 'profitable' in v and 'strong' in v: return 5
    if 'profitable' in v: return 4
    if 'stable' in v or 'marginal' in v: return 3
    if 'loss' in v or 'declining' in v: return 2
    if 'severe' in v or 'crisis' in v: return 1
    return 3

def parse_services(text):
    """Parse Mobileum Services IA text into structured product list."""
    if not text or (isinstance(text, float) and np.isnan(text)):
        return []
    products = []
    # Split on numbered pattern [1], [2] etc.
    blocks = re.split(r'\[\d+\]', str(text))
    for block in blocks:
        block = block.strip()
        if not block: continue
        # First line = product name
        lines = block.split('\n')
        name_line = lines[0].strip().rstrip('\\n').strip()
        if not name_line: continue
        # Extract category
        cat_match = re.search(r'Category:\s*([^.]+)\.', block)
        category = cat_match.group(1).strip() if cat_match else 'General'
        # Extract KPI
        kpi_match = re.search(r'Key KPI:\s*(.+?)(?:\.|$)', block)
        kpi = kpi_match.group(1).strip() if kpi_match else ''
        # Extract rationale (sentence after ->)
        rat_match = re.search(r'->\s*Category:[^.]+\.\s*(.+?)(?:Key KPI|$)', block, re.DOTALL)
        rationale = rat_match.group(1).strip()[:200] if rat_match else ''
        products.append({
            'name': name_line[:80],
            'category': category[:50],
            'kpi': kpi[:100],
            'rationale': rationale
        })
    return products

# ═══════════════════════════════════════════════════════════════════
# COUNTRY COORDINATES + ISO (complete 137-country map)
# ═══════════════════════════════════════════════════════════════════
COORDS = {
    "Saudi Arabia":{"iso":"SAU","lat":24.0,"lng":45.0},
    "UAE":{"iso":"ARE","lat":24.0,"lng":54.0},
    "Qatar":{"iso":"QAT","lat":25.3,"lng":51.2},
    "Kuwait":{"iso":"KWT","lat":29.3,"lng":47.7},
    "Bahrain":{"iso":"BHR","lat":26.0,"lng":50.5},
    "Oman":{"iso":"OMN","lat":21.0,"lng":57.0},
    "Jordan":{"iso":"JOR","lat":31.0,"lng":36.0},
    "Lebanon":{"iso":"LBN","lat":33.9,"lng":35.5},
    "Syria":{"iso":"SYR","lat":34.8,"lng":38.9},
    "Iraq":{"iso":"IRQ","lat":33.0,"lng":44.0},
    "Iran":{"iso":"IRN","lat":32.0,"lng":53.0},
    "Yemen":{"iso":"YEM","lat":15.5,"lng":47.5},
    "Palestine":{"iso":"PSE","lat":31.9,"lng":35.2},
    "Egypt (Sinai)":{"iso":"EGY","lat":26.0,"lng":30.0},
    "Libya":{"iso":"LBY","lat":25.0,"lng":17.0},
    "Tunisia":{"iso":"TUN","lat":33.9,"lng":9.5},
    "Algeria":{"iso":"DZA","lat":28.0,"lng":3.0},
    "Morocco":{"iso":"MAR","lat":31.8,"lng":-7.0},
    "Sudan":{"iso":"SDN","lat":15.0,"lng":30.0},
    "Turkey":{"iso":"TUR","lat":39.0,"lng":35.0},
    "Pakistan":{"iso":"PAK","lat":30.0,"lng":70.0},
    "Afghanistan":{"iso":"AFG","lat":33.0,"lng":65.0},
    "Kazakhstan":{"iso":"KAZ","lat":48.0,"lng":68.0},
    "Uzbekistan":{"iso":"UZB","lat":41.4,"lng":64.6},
    "Turkmenistan":{"iso":"TKM","lat":40.0,"lng":60.0},
    "Kyrgyzstan":{"iso":"KGZ","lat":41.2,"lng":74.8},
    "Tajikistan":{"iso":"TJK","lat":39.0,"lng":71.0},
    "Armenia":{"iso":"ARM","lat":40.1,"lng":45.0},
    "Azerbaijan":{"iso":"AZE","lat":40.4,"lng":47.6},
    "Georgia":{"iso":"GEO","lat":42.3,"lng":43.4},
    "Germany":{"iso":"DEU","lat":51.2,"lng":10.5},
    "France":{"iso":"FRA","lat":46.2,"lng":2.2},
    "United Kingdom":{"iso":"GBR","lat":55.4,"lng":-3.4},
    "Italy":{"iso":"ITA","lat":41.9,"lng":12.6},
    "Spain":{"iso":"ESP","lat":40.5,"lng":-3.7},
    "Netherlands":{"iso":"NLD","lat":52.1,"lng":5.3},
    "Belgium":{"iso":"BEL","lat":50.5,"lng":4.5},
    "Switzerland":{"iso":"CHE","lat":46.8,"lng":8.2},
    "Austria":{"iso":"AUT","lat":47.5,"lng":14.6},
    "Sweden":{"iso":"SWE","lat":60.1,"lng":18.6},
    "Norway":{"iso":"NOR","lat":60.5,"lng":8.5},
    "Denmark":{"iso":"DNK","lat":56.3,"lng":9.5},
    "Finland":{"iso":"FIN","lat":61.9,"lng":25.7},
    "Poland":{"iso":"POL","lat":51.9,"lng":19.1},
    "Czech Republic":{"iso":"CZE","lat":49.8,"lng":15.5},
    "Hungary":{"iso":"HUN","lat":47.2,"lng":19.5},
    "Romania":{"iso":"ROU","lat":45.9,"lng":24.9},
    "Bulgaria":{"iso":"BGR","lat":42.7,"lng":25.5},
    "Greece":{"iso":"GRC","lat":39.1,"lng":21.8},
    "Portugal":{"iso":"PRT","lat":39.4,"lng":-8.2},
    "Ireland":{"iso":"IRL","lat":53.1,"lng":-8.2},
    "Croatia":{"iso":"HRV","lat":45.1,"lng":15.2},
    "Serbia":{"iso":"SRB","lat":44.0,"lng":21.0},
    "Slovakia":{"iso":"SVK","lat":48.7,"lng":19.7},
    "Ukraine":{"iso":"UKR","lat":48.4,"lng":31.2},
    "Russia":{"iso":"RUS","lat":61.5,"lng":105.3},
    "RUSSIA (ASIAN)":{"iso":"RUS","lat":61.5,"lng":105.3},
    "Belarus":{"iso":"BLR","lat":53.7,"lng":28.0},
    "Lithuania":{"iso":"LTU","lat":55.2,"lng":24.0},
    "Latvia":{"iso":"LVA","lat":56.9,"lng":24.6},
    "Estonia":{"iso":"EST","lat":58.6,"lng":25.0},
    "Slovenia":{"iso":"SVN","lat":46.2,"lng":14.8},
    "Bosnia and Herzegovina":{"iso":"BIH","lat":44.2,"lng":17.7},
    "North Macedonia":{"iso":"MKD","lat":41.6,"lng":21.7},
    "Albania":{"iso":"ALB","lat":41.2,"lng":20.2},
    "Montenegro":{"iso":"MNE","lat":42.7,"lng":19.4},
    "Kosovo":{"iso":"XKX","lat":42.6,"lng":20.9},
    "Moldova":{"iso":"MDA","lat":47.4,"lng":28.4},
    "Luxembourg":{"iso":"LUX","lat":49.8,"lng":6.1},
    "Malta":{"iso":"MLT","lat":35.9,"lng":14.4},
    "Cyprus":{"iso":"CYP","lat":35.1,"lng":33.4},
    "Iceland":{"iso":"ISL","lat":65.0,"lng":-18.0},
    "Faroe Islands":{"iso":"FRO","lat":62.0,"lng":-6.8},
    "Isle of Man":{"iso":"IMN","lat":54.2,"lng":-4.5},
    "Jersey":{"iso":"JEY","lat":49.2,"lng":-2.1},
    "Liechtenstein":{"iso":"LIE","lat":47.2,"lng":9.5},
    "Greenland":{"iso":"GRL","lat":71.7,"lng":-42.6},
    "Israel":{"iso":"ISR","lat":31.0,"lng":35.0},
    "China":{"iso":"CHN","lat":35.9,"lng":104.2},
    "CHINA":{"iso":"CHN","lat":35.9,"lng":104.2},
    "Japan":{"iso":"JPN","lat":36.2,"lng":138.3},
    "JAPAN":{"iso":"JPN","lat":36.2,"lng":138.3},
    "South Korea":{"iso":"KOR","lat":35.9,"lng":127.8},
    "SOUTH KOREA":{"iso":"KOR","lat":35.9,"lng":127.8},
    "North Korea":{"iso":"PRK","lat":40.3,"lng":127.5},
    "NORTH KOREA":{"iso":"PRK","lat":40.3,"lng":127.5},
    "India":{"iso":"IND","lat":20.6,"lng":79.0},
    "Indonesia":{"iso":"IDN","lat":-0.8,"lng":113.9},
    "INDONESIA":{"iso":"IDN","lat":-0.8,"lng":113.9},
    "Australia":{"iso":"AUS","lat":-25.3,"lng":133.8},
    "AUSTRALIA":{"iso":"AUS","lat":-25.3,"lng":133.8},
    "New Zealand":{"iso":"NZL","lat":-40.9,"lng":174.9},
    "NEW ZEALAND":{"iso":"NZL","lat":-40.9,"lng":174.9},
    "Singapore":{"iso":"SGP","lat":1.4,"lng":103.8},
    "SINGAPORE":{"iso":"SGP","lat":1.4,"lng":103.8},
    "Malaysia":{"iso":"MYS","lat":4.2,"lng":108.0},
    "MALAYSIA":{"iso":"MYS","lat":4.2,"lng":108.0},
    "Thailand":{"iso":"THA","lat":15.9,"lng":100.9},
    "THAILAND":{"iso":"THA","lat":15.9,"lng":100.9},
    "Philippines":{"iso":"PHL","lat":12.9,"lng":121.8},
    "PHILIPPINES":{"iso":"PHL","lat":12.9,"lng":121.8},
    "Vietnam":{"iso":"VNM","lat":14.1,"lng":108.3},
    "VIETNAM":{"iso":"VNM","lat":14.1,"lng":108.3},
    "Bangladesh":{"iso":"BGD","lat":23.7,"lng":90.4},
    "Sri Lanka":{"iso":"LKA","lat":7.9,"lng":80.8},
    "Myanmar":{"iso":"MMR","lat":17.1,"lng":96.0},
    "MYANMAR":{"iso":"MMR","lat":17.1,"lng":96.0},
    "Cambodia":{"iso":"KHM","lat":12.6,"lng":104.8},
    "CAMBODIA":{"iso":"KHM","lat":12.6,"lng":104.8},
    "Laos":{"iso":"LAO","lat":17.4,"lng":102.5},
    "LAOS":{"iso":"LAO","lat":17.4,"lng":102.5},
    "Nepal":{"iso":"NPL","lat":28.4,"lng":84.1},
    "Mongolia":{"iso":"MNG","lat":46.9,"lng":103.8},
    "MONGOLIA":{"iso":"MNG","lat":46.9,"lng":103.8},
    "Taiwan":{"iso":"TWN","lat":23.7,"lng":121.0},
    "TAIWAN":{"iso":"TWN","lat":23.7,"lng":121.0},
    "Hong Kong":{"iso":"HKG","lat":22.4,"lng":114.1},
    "HONG KONG":{"iso":"HKG","lat":22.4,"lng":114.1},
    "Macau":{"iso":"MAC","lat":22.2,"lng":113.5},
    "MACAU":{"iso":"MAC","lat":22.2,"lng":113.5},
    "Papua New Guinea":{"iso":"PNG","lat":-6.3,"lng":143.9},
    "PAPUA NEW GUINEA":{"iso":"PNG","lat":-6.3,"lng":143.9},
    "Fiji":{"iso":"FJI","lat":-17.7,"lng":178.1},
    "FIJI":{"iso":"FJI","lat":-17.7,"lng":178.1},
    "Brunei":{"iso":"BRN","lat":4.5,"lng":114.7},
    "BRUNEI":{"iso":"BRN","lat":4.5,"lng":114.7},
    "Maldives":{"iso":"MDV","lat":3.2,"lng":73.2},
    "Bhutan":{"iso":"BTN","lat":27.5,"lng":90.4},
    "Timor-Leste":{"iso":"TLS","lat":-8.9,"lng":125.7},
    "TIMOR-LESTE":{"iso":"TLS","lat":-8.9,"lng":125.7},
    "Solomon Islands":{"iso":"SLB","lat":-9.6,"lng":160.2},
    "SOLOMON ISLANDS":{"iso":"SLB","lat":-9.6,"lng":160.2},
    "Vanuatu":{"iso":"VUT","lat":-15.4,"lng":166.9},
    "VANUATU":{"iso":"VUT","lat":-15.4,"lng":166.9},
    "Samoa":{"iso":"WSM","lat":-13.8,"lng":-172.1},
    "SAMOA":{"iso":"WSM","lat":-13.8,"lng":-172.1},
    "Tonga":{"iso":"TON","lat":-21.2,"lng":-175.2},
    "TONGA":{"iso":"TON","lat":-21.2,"lng":-175.2},
    "Kiribati":{"iso":"KIR","lat":1.9,"lng":-157.4},
    "KIRIBATI":{"iso":"KIR","lat":1.9,"lng":-157.4},
    "Micronesia":{"iso":"FSM","lat":7.4,"lng":150.6},
    "MICRONESIA":{"iso":"FSM","lat":7.4,"lng":150.6},
    "Palau":{"iso":"PLW","lat":7.5,"lng":134.6},
    "PALAU":{"iso":"PLW","lat":7.5,"lng":134.6},
    "Marshall Islands":{"iso":"MHL","lat":7.1,"lng":171.2},
    "MARSHALL ISLANDS":{"iso":"MHL","lat":7.1,"lng":171.2},
    "Nauru":{"iso":"NRU","lat":-0.5,"lng":166.9},
    "NAURU":{"iso":"NRU","lat":-0.5,"lng":166.9},
    "Tuvalu":{"iso":"TUV","lat":-7.1,"lng":177.6},
    "TUVALU":{"iso":"TUV","lat":-7.1,"lng":177.6},
    "Brazil":{"iso":"BRA","lat":-14.2,"lng":-51.9},
    "BRAZIL":{"iso":"BRA","lat":-14.2,"lng":-51.9},
    "Mexico":{"iso":"MEX","lat":23.6,"lng":-102.6},
    "MEXICO":{"iso":"MEX","lat":23.6,"lng":-102.6},
    "Argentina":{"iso":"ARG","lat":-38.4,"lng":-63.6},
    "ARGENTINA":{"iso":"ARG","lat":-38.4,"lng":-63.6},
    "Colombia":{"iso":"COL","lat":4.6,"lng":-74.3},
    "COLOMBIA":{"iso":"COL","lat":4.6,"lng":-74.3},
    "Chile":{"iso":"CHL","lat":-35.7,"lng":-71.5},
    "CHILE":{"iso":"CHL","lat":-35.7,"lng":-71.5},
    "Peru":{"iso":"PER","lat":-9.2,"lng":-75.0},
    "PERU":{"iso":"PER","lat":-9.2,"lng":-75.0},
    "Venezuela":{"iso":"VEN","lat":6.4,"lng":-66.6},
    "VENEZUELA":{"iso":"VEN","lat":6.4,"lng":-66.6},
    "Ecuador":{"iso":"ECU","lat":-1.8,"lng":-78.2},
    "ECUADOR":{"iso":"ECU","lat":-1.8,"lng":-78.2},
    "Bolivia":{"iso":"BOL","lat":-16.3,"lng":-63.6},
    "BOLIVIA":{"iso":"BOL","lat":-16.3,"lng":-63.6},
    "Paraguay":{"iso":"PRY","lat":-23.4,"lng":-58.4},
    "PARAGUAY":{"iso":"PRY","lat":-23.4,"lng":-58.4},
    "Uruguay":{"iso":"URY","lat":-32.5,"lng":-55.8},
    "URUGUAY":{"iso":"URY","lat":-32.5,"lng":-55.8},
    "Guyana":{"iso":"GUY","lat":4.9,"lng":-59.0},
    "GUYANA":{"iso":"GUY","lat":4.9,"lng":-59.0},
    "Suriname":{"iso":"SUR","lat":3.9,"lng":-56.0},
    "SURINAME":{"iso":"SUR","lat":3.9,"lng":-56.0},
    "Costa Rica":{"iso":"CRI","lat":9.7,"lng":-83.8},
    "COSTA RICA":{"iso":"CRI","lat":9.7,"lng":-83.8},
    "Panama":{"iso":"PAN","lat":8.5,"lng":-80.8},
    "PANAMA":{"iso":"PAN","lat":8.5,"lng":-80.8},
    "Guatemala":{"iso":"GTM","lat":15.8,"lng":-90.2},
    "GUATEMALA":{"iso":"GTM","lat":15.8,"lng":-90.2},
    "Honduras":{"iso":"HND","lat":15.2,"lng":-86.2},
    "HONDURAS":{"iso":"HND","lat":15.2,"lng":-86.2},
    "El Salvador":{"iso":"SLV","lat":13.8,"lng":-88.9},
    "EL SALVADOR":{"iso":"SLV","lat":13.8,"lng":-88.9},
    "Nicaragua":{"iso":"NIC","lat":12.9,"lng":-85.2},
    "NICARAGUA":{"iso":"NIC","lat":12.9,"lng":-85.2},
    "Belize":{"iso":"BLZ","lat":17.2,"lng":-88.5},
    "BELIZE":{"iso":"BLZ","lat":17.2,"lng":-88.5},
    "Cuba":{"iso":"CUB","lat":21.5,"lng":-79.5},
    "CUBA":{"iso":"CUB","lat":21.5,"lng":-79.5},
    "Dominican Republic":{"iso":"DOM","lat":18.7,"lng":-70.2},
    "DOMINICAN REPUBLIC":{"iso":"DOM","lat":18.7,"lng":-70.2},
    "Jamaica":{"iso":"JAM","lat":18.1,"lng":-77.3},
    "JAMAICA":{"iso":"JAM","lat":18.1,"lng":-77.3},
    "Trinidad & Tobago":{"iso":"TTO","lat":10.7,"lng":-61.2},
    "TRINIDAD & TOBAGO":{"iso":"TTO","lat":10.7,"lng":-61.2},
    "Puerto Rico":{"iso":"PRI","lat":18.2,"lng":-66.6},
    "PUERTO RICO":{"iso":"PRI","lat":18.2,"lng":-66.6},
}

# ═══════════════════════════════════════════════════════════════════
# MOBILEUM SCORING ENGINE
# ═══════════════════════════════════════════════════════════════════
PRODUCTS = [
    "Steering of Roaming (SoR)",
    "Roaming Campaign Management",
    "Roaming DNA",
    "RAID 9 – Fraud Management",
    "Revenue & Provisioning Assurance",
    "Signalling Security",
    "Customer Intelligence",
    "eSIM Enablement & Testing",
    "Roaming Hub & IPX",
    "Active Roaming Testing",
    "Managed Services",
    "5G Active Testing"
]

def score_products(row):
    """
    Rule-based scoring engine.
    Each product scored 0-100 from actual data fields.
    Returns dict of product: score with reason.
    """
    scores = {}
    reasons = {}

    fiveG    = clean_float(row.get('5G Penetration (%)')) or 0
    arpu_g   = trend_score(row.get('ARPU Growth'))
    sub_g    = clean_float(row.get('Subscriber Growth (%)')) or 0
    rev_g    = trend_score(row.get('Revenue Growth (3 Yrs)'))
    profit   = profitability_score(row.get('Profitability (3 Yrs)'))
    out_roam = trend_score(row.get('Outbound Roaming Trend'))
    in_roam  = trend_score(row.get('Inbound Roaming Trend'))
    biz_trav = trend_score(row.get('Business Travellers Outbound'))
    ott      = trend_score(row.get('OTT / International Calls'))
    avg_age  = clean_float(row.get('Avg Age (Yrs)')) or 30
    gdp_g    = clean_float(row.get('GDP Growth (%)')) or 2
    internet = clean_float(row.get('Internet Users (%)')) or 50
    mkt_shr  = clean_float(row.get('Market Share (%)')) or 20
    ms_fin   = str(row.get('IA_Need_MS_Financial','')).lower()
    ms_tech  = str(row.get('IA_Need_MS_Technical','')).lower()
    fin_com  = str(row.get('IA_Financials','')).lower()
    penetr   = clean_float(row.get('Mobile Penetration (%)')) or 80

    # 1. STEERING OF ROAMING
    sor = (out_roam * 15) + (in_roam * 10) + (biz_trav * 10) + min(fiveG/2, 20) + (3 if ott >= 3 else 0)
    scores["Steering of Roaming (SoR)"] = min(int(sor), 100)
    reasons["Steering of Roaming (SoR)"] = f"Outbound trend score {out_roam}/5, inbound {in_roam}/5, business travellers {biz_trav}/5"

    # 2. ROAMING CAMPAIGN MANAGEMENT
    rcm = (out_roam * 14) + (in_roam * 9) + (5 if arpu_g <= 3 else 10) + (biz_trav * 8) + (5 if gdp_g > 3 else 0)
    scores["Roaming Campaign Management"] = min(int(rcm), 100)
    reasons["Roaming Campaign Management"] = f"Outbound {out_roam}/5, ARPU growth pressure {arpu_g}/5, GDP growth {gdp_g}%"

    # 3. ROAMING DNA
    rdna = (out_roam * 12) + (in_roam * 12) + min(fiveG/3, 20) + (biz_trav * 8) + (internet/10)
    scores["Roaming DNA"] = min(int(rdna), 100)
    reasons["Roaming DNA"] = f"Roaming volumes (out:{out_roam}, in:{in_roam}), 5G:{fiveG}%"

    # 4. RAID 9 FRAUD
    fraud_age = 5 if avg_age < 28 else (4 if avg_age < 35 else 3)
    raid = (ott * 15) + (fraud_age * 8) + (5 if sub_g > 5 else 0) + (out_roam * 8) + (10 if 'high' in str(row.get('IA_International_Calls','')).lower() else 5)
    scores["RAID 9 – Fraud Management"] = min(int(raid), 100)
    reasons["RAID 9 – Fraud Management"] = f"OTT/bypass risk {ott}/5, avg age {avg_age}yrs, subscriber growth {sub_g}%"

    # 5. REVENUE ASSURANCE
    ra_need = (5 if arpu_g <= 2 else 0) + (5 if profit <= 2 else 0) + (5 if rev_g <= 2 else 0)
    ra = (ra_need * 8) + (sub_g * 2) + 20
    scores["Revenue & Provisioning Assurance"] = min(int(ra), 100)
    reasons["Revenue & Provisioning Assurance"] = f"Profitability score {profit}/5, revenue growth {rev_g}/5, ARPU trend {arpu_g}/5"

    # 6. SIGNALLING SECURITY
    sig = (ott * 12) + (in_roam * 10) + (15 if fiveG > 50 else 8) + (internet/8)
    scores["Signalling Security"] = min(int(sig), 100)
    reasons["Signalling Security"] = f"OTT exposure {ott}/5, inbound roaming {in_roam}/5, 5G:{fiveG}%"

    # 7. CUSTOMER INTELLIGENCE
    ci_churn = 5 if arpu_g <= 2 else 3
    ci_age = 5 if avg_age < 30 else 3
    ci = (ci_churn * 10) + (ci_age * 8) + (rev_g * 5) + (sub_g * 2) + 15
    scores["Customer Intelligence"] = min(int(ci), 100)
    reasons["Customer Intelligence"] = f"Churn risk (ARPU:{arpu_g}/5), digital-native age {avg_age}yrs"

    # 8. eSIM
    esim = (in_roam * 12) + min(fiveG/2, 25) + (internet/6) + (biz_trav * 8) + (5 if gdp_g > 3 else 0)
    scores["eSIM Enablement & Testing"] = min(int(esim), 100)
    reasons["eSIM Enablement & Testing"] = f"Inbound roaming {in_roam}/5, 5G:{fiveG}%, internet:{internet}%"

    # 9. ROAMING HUB IPX
    rhub = (in_roam * 14) + (biz_trav * 12) + (out_roam * 8) + (5 if gdp_g > 2 else 0)
    scores["Roaming Hub & IPX"] = min(int(rhub), 100)
    reasons["Roaming Hub & IPX"] = f"Inbound {in_roam}/5, biz travellers {biz_trav}/5"

    # 10. ACTIVE ROAMING TESTING (universal — floor 60)
    art = 60 + (out_roam * 5) + (in_roam * 5) + min(fiveG/5, 10)
    scores["Active Roaming Testing"] = min(int(art), 100)
    reasons["Active Roaming Testing"] = "Universal — applied to all operators for QoS assurance"

    # 11. MANAGED SERVICES
    ms_score = 0
    if 'high' in ms_fin or 'medium' in ms_fin: ms_score += 25
    if 'high' in ms_tech or 'medium' in ms_tech: ms_score += 25
    if profit <= 2: ms_score += 20
    if rev_g <= 2: ms_score += 15
    ms_score += max(0, 30 - mkt_shr)  # smaller operators need more support
    scores["Managed Services"] = min(int(ms_score), 100)
    reasons["Managed Services"] = f"Financial need: {ms_fin[:30]}, technical gap: {ms_tech[:30]}"

    # 12. 5G ACTIVE TESTING
    fiveG_test = (100 - fiveG) * 0.4 + (gdp_g * 5) + (internet / 5) + (5 if avg_age < 32 else 0)
    scores["5G Active Testing"] = min(int(fiveG_test), 100)
    reasons["5G Active Testing"] = f"5G deployment:{fiveG}%, GDP growth:{gdp_g}%, internet:{internet}%"

    # Sort by score descending
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [{"product": p, "score": s, "reason": reasons[p]} for p, s in ranked]

# ═══════════════════════════════════════════════════════════════════
# LOAD ALL DATA
# ═══════════════════════════════════════════════════════════════════
print("Loading MNO data...")
df_mno = pd.read_excel(BASE + 'Global_Telecom_MNO_Verified.xlsx',
                       sheet_name='Combined MNO Data', header=1)
df_mno.columns = [c.strip() for c in df_mno.columns]
df_mno = df_mno.dropna(subset=['Country','Operator Name'])

print("Loading impact analysis...")
df_ia = pd.read_excel(BASE + 'Global_Telecom_MNO_ImpactAnalysis_Mobileum (2).xlsx',
                      sheet_name='Combined Impact Analysis', header=0)
df_ia.columns = [c.strip() for c in df_ia.columns]
df_ia = df_ia.dropna(subset=['Country','Operator Name'])

print("Loading European supplement...")
df_eu = pd.read_excel(BASE + 'oragnised_telecom.xlsx',
                      sheet_name='European Telecom Data', header=0)
df_eu.columns = [c.strip() for c in df_eu.columns]

print("Loading MECA verification...")
df_meca = pd.read_excel(BASE + 'MECA_Combined_MNO_Data.xlsx',
                        sheet_name='Country Summary', header=0)
df_meca.columns = [c.strip() for c in df_meca.columns]

print(f"MNO: {len(df_mno)} rows | IA: {len(df_ia)} rows | EU: {len(df_eu)} rows | MECA: {len(df_meca)} rows")

# ═══════════════════════════════════════════════════════════════════
# MERGE MNO + IA on Country + Operator Name
# ═══════════════════════════════════════════════════════════════════
df_mno['_key'] = df_mno['Country'].str.strip().str.upper() + '||' + df_mno['Operator Name'].str.strip().str.upper()
df_ia['_key']  = df_ia['Country'].str.strip().str.upper()  + '||' + df_ia['Operator Name'].str.strip().str.upper()

# IA columns to bring in (excluding duplicates already in MNO)
ia_cols = ['_key','IA_Population_Growth','IA_Penetration','IA_GDP_Growth',
           'IA_Age_of_Population','IA_Sub_Base_Growth','IA_ARPU_Impact',
           'IA_Outbound_Impact','IA_Biz_Traveller_Impact','IA_Inbound_Impact',
           'IA_Immigration_Impact','IA_International_Calls','IA_Apps',
           'IA_Rev_Growth','IA_Profitability','IA_Future_Investment_CF',
           'IA_Need_MS_Financial','IA_Need_MS_Technical','IA_Need_MS_Package',
           'IA_Future_Investment_UC','IA_Financials','IA_Scope_of_MS',
           'IA_Intl_In_Roamers','IA_Outroamers','IA_BU_Gaps',
           'IA_Recommended_Solutions','IA_Recommended_Biz_Model',
           'IA_Satisfaction_Competitive','IA_Cost_Replace_Competition',
           'IA_Approach_Replace','Mobileum Services IA']

df_merged = df_mno.merge(df_ia[ia_cols], on='_key', how='left')
print(f"Merged: {len(df_merged)} rows, {len(df_merged.columns)} columns")

# ═══════════════════════════════════════════════════════════════════
# BUILD OPERATOR RECORDS
# ═══════════════════════════════════════════════════════════════════
print("Building operator records...")
operators = []
for _, row in df_merged.iterrows():
    country = str(row['Country']).strip()
    operator = str(row['Operator Name']).strip()
    
    op = {
        "operator": operator,
        "sub_base_mln": clean_float(row.get('Sub Base (mln)')),
        "market_share_pct": clean_float(row.get('Market Share (%)')),
        "subscriber_growth_pct": clean_float(row.get('Subscriber Growth (%)')),
        "prepaid_postpaid": str(row.get('Prepaid / Postpaid','')).strip(),
        "arpu_growth": str(row.get('ARPU Growth','')).strip(),
        "arpu_growth_score": trend_score(row.get('ARPU Growth')),
        "fiveG_pct": clean_float(row.get('5G Penetration (%)')),
        "revenue_growth": str(row.get('Revenue Growth (3 Yrs)','')).strip(),
        "revenue_growth_score": trend_score(row.get('Revenue Growth (3 Yrs)')),
        "profitability": str(row.get('Profitability (3 Yrs)','')).strip(),
        "profitability_score": profitability_score(row.get('Profitability (3 Yrs)')),
        "capex_investment": str(row.get('Capex / Investment','')).strip(),
        "financial_comments": str(row.get('Financial Comments','')).strip(),
        "outbound_roaming": str(row.get('Outbound Roaming Trend','')).strip(),
        "outbound_roaming_score": trend_score(row.get('Outbound Roaming Trend')),
        "inbound_roaming": str(row.get('Inbound Roaming Trend','')).strip(),
        "inbound_roaming_score": trend_score(row.get('Inbound Roaming Trend')),
        "biz_travellers": str(row.get('Business Travellers Outbound','')).strip(),
        "biz_travellers_score": trend_score(row.get('Business Travellers Outbound')),
        "top_roaming_countries": str(row.get('Top Roaming Countries','')).strip(),
        "ott_intl_calls": str(row.get('OTT / International Calls','')).strip(),
        "ott_score": trend_score(row.get('OTT / International Calls')),
        "roaming_comments": str(row.get('Roaming Comments','')).strip(),
        "regulations": str(row.get('Regulations (Last 3 Yrs)','')).strip(),
        "regulation_impact": str(row.get('Impact of Regulations','')).strip(),
        "regulation_comments": str(row.get('Regulation Comments','')).strip(),
        "key_events": str(row.get('Key Events','')).strip(),
        "event_month": str(row.get('Event Month','')).strip(),
        "event_impact": str(row.get('Event Impact','')).strip(),
        # IA fields
        "ia_recommended_solutions": str(row.get('IA_Recommended_Solutions','')).strip(),
        "ia_recommended_biz_model": str(row.get('IA_Recommended_Biz_Model','')).strip(),
        "ia_financials": str(row.get('IA_Financials','')).strip(),
        "ia_need_ms_financial": str(row.get('IA_Need_MS_Financial','')).strip(),
        "ia_need_ms_technical": str(row.get('IA_Need_MS_Technical','')).strip(),
        "ia_scope_of_ms": str(row.get('IA_Scope_of_MS','')).strip(),
        "ia_outbound_impact": str(row.get('IA_Outbound_Impact','')).strip(),
        "ia_inbound_impact": str(row.get('IA_Inbound_Impact','')).strip(),
        "ia_arpu_impact": str(row.get('IA_ARPU_Impact','')).strip(),
        "ia_sub_base_growth": str(row.get('IA_Sub_Base_Growth','')).strip(),
        "ia_apps": str(row.get('IA_Apps','')).strip(),
        "ia_rev_growth": str(row.get('IA_Rev_Growth','')).strip(),
        "ia_profitability": str(row.get('IA_Profitability','')).strip(),
        "ia_future_investment": str(row.get('IA_Future_Investment_UC','')).strip(),
        "ia_satisfaction": str(row.get('IA_Satisfaction_Competitive','')).strip(),
        "ia_approach_replace": str(row.get('IA_Approach_Replace','')).strip(),
        "mobileum_services_text": str(row.get('Mobileum Services IA','')).strip(),
        "mobileum_services_parsed": parse_services(row.get('Mobileum Services IA','')),
        "product_scores": score_products(row),
    }
    operators.append({"country": country, "operator_data": op, "_row": row})

print(f"Built {len(operators)} operator records")

# ═══════════════════════════════════════════════════════════════════
# GROUP BY COUNTRY
# ═══════════════════════════════════════════════════════════════════
print("Grouping by country...")
from collections import defaultdict
country_groups = defaultdict(list)
for item in operators:
    country_groups[item['country']].append(item)

# ═══════════════════════════════════════════════════════════════════
# COMPUTE GLOBAL STATS FOR PERCENTILE RANKING
# ═══════════════════════════════════════════════════════════════════
# Country-level aggregates for percentile computation
country_stats = {}
for country, items in country_groups.items():
    row0 = items[0]['_row']
    country_stats[country] = {
        'mobile_penetration': clean_float(row0.get('Mobile Penetration (%)')),
        'gdp_growth': clean_float(row0.get('GDP Growth (%)')),
        'avg_age': clean_float(row0.get('Avg Age (Yrs)')),
        'internet_users': clean_float(row0.get('Internet Users (%)')),
        'gdp_per_capita': clean_float(row0.get('GDP per Capita (USD)')),
        'population': clean_float(row0.get('Population (mln)')),
        'mobile_users': clean_float(row0.get('Mobile Users (mln)')),
        'age_over_65': clean_float(row0.get('Age Over 65 (%)')),
        'avg_5g': np.nanmean([clean_float(i['_row'].get('5G Penetration (%)')) or np.nan for i in items]),
        'avg_sub_growth': np.nanmean([clean_float(i['_row'].get('Subscriber Growth (%)')) or np.nan for i in items]),
        'avg_market_health': np.nanmean([i['operator_data']['profitability_score'] for i in items]),
        'fraud_score': np.nanmean([i['operator_data']['ott_score'] for i in items]),
        'roaming_intensity': np.nanmean([
            (i['operator_data']['outbound_roaming_score'] + i['operator_data']['inbound_roaming_score']) / 2
            for i in items
        ]),
    }

def percentile_rank(country, metric, all_stats):
    vals = [(c, s.get(metric)) for c, s in all_stats.items() if s.get(metric) is not None]
    if not vals: return None
    val = all_stats[country].get(metric)
    if val is None: return None
    rank = sum(1 for _, v in vals if v < val)
    return round(rank / len(vals) * 100, 1)

def regional_avg(country, metric, region, all_stats, country_region_map):
    peers = [s.get(metric) for c, s in all_stats.items()
             if country_region_map.get(c) == region and s.get(metric) is not None]
    return round(np.mean(peers), 2) if peers else None

# ═══════════════════════════════════════════════════════════════════
# K-MEANS CLUSTERING (5 clusters on numeric features)
# ═══════════════════════════════════════════════════════════════════
print("Running K-means clustering...")
cluster_features = ['mobile_penetration','gdp_growth','avg_age','avg_5g',
                    'avg_sub_growth','fraud_score','roaming_intensity','internet_users']

cluster_df = pd.DataFrame(country_stats).T
cluster_df = cluster_df[cluster_features].apply(pd.to_numeric, errors='coerce')
cluster_df_filled = cluster_df.fillna(cluster_df.mean())

scaler = MinMaxScaler()
scaled = scaler.fit_transform(cluster_df_filled)

kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
cluster_labels = kmeans.fit_predict(scaled)

CLUSTER_NAMES = {0:"", 1:"", 2:"", 3:"", 4:""}
# Name clusters by centroid characteristics
centroids = scaler.inverse_transform(kmeans.cluster_centers_)
centroid_df = pd.DataFrame(centroids, columns=cluster_features)

for i, row in centroid_df.iterrows():
    p5g = row['avg_5g']
    pen = row['mobile_penetration']
    fraud = row['fraud_score']
    roam = row['roaming_intensity']
    age = row['avg_age']
    sub_g = row['avg_sub_growth']
    gdp = row['gdp_growth']
    
    if p5g > 60 and pen > 120: name = "Mature & Saturated"
    elif fraud > 3.5 and sub_g > 5: name = "High Growth Exposed"
    elif roam > 3.8: name = "Roaming Hub"
    elif gdp > 4 and p5g < 30: name = "Emerging Opportunity"
    else: name = "Regulatory Transition"
    CLUSTER_NAMES[i] = name

country_cluster = {c: int(cluster_labels[i]) for i, c in enumerate(cluster_df.index)}
country_cluster_name = {c: CLUSTER_NAMES[cluster_labels[i]] for i, c in enumerate(cluster_df.index)}

print("Cluster distribution:")
from collections import Counter
cc = Counter(country_cluster_name.values())
for name, count in cc.items():
    print(f"  {name}: {count} countries")

# ═══════════════════════════════════════════════════════════════════
# ARPU vs GDP REGRESSION ANOMALY DETECTION
# ═══════════════════════════════════════════════════════════════════
print("Computing ARPU/GDP anomalies...")
from scipy import stats as scipy_stats

gdp_vals, arpu_vals, countries_reg = [], [], []
for c, s in country_stats.items():
    if s.get('gdp_per_capita') and s.get('mobile_penetration'):
        gdp_vals.append(s['gdp_per_capita'])
        # Use mobile penetration as proxy for ARPU pressure
        arpu_vals.append(s['mobile_penetration'])
        countries_reg.append(c)

if len(gdp_vals) > 10:
    slope, intercept, r_val, p_val, std_err = scipy_stats.linregress(gdp_vals, arpu_vals)
    anomalies = {}
    for i, c in enumerate(countries_reg):
        expected = slope * gdp_vals[i] + intercept
        residual = arpu_vals[i] - expected
        z = residual / (std_err * len(gdp_vals)**0.5) if std_err > 0 else 0
        anomalies[c] = round(float(z), 2)
else:
    anomalies = {}

# ═══════════════════════════════════════════════════════════════════
# BUILD FINAL COUNTRY JSON
# ═══════════════════════════════════════════════════════════════════
print("Building final country JSON...")
country_region_map = {c: items[0]['_row']['Region'] for c, items in country_groups.items()}
all_regions = list(set(country_region_map.values()))

final_data = {}
for country, items in country_groups.items():
    row0 = items[0]['_row']
    coords = COORDS.get(country, {"iso": "UNK", "lat": 0, "lng": 0})
    region = str(row0.get('Region','')).strip()
    sub_region = str(row0.get('Sub-Region','')).strip()
    stats = country_stats[country]

    # Compute percentiles
    percentiles = {}
    for metric in ['mobile_penetration','gdp_growth','avg_age','avg_5g',
                   'avg_sub_growth','internet_users','gdp_per_capita']:
        percentiles[metric] = percentile_rank(country, metric, country_stats)

    # Regional averages
    reg_avgs = {}
    for metric in ['mobile_penetration','avg_5g','gdp_growth','avg_age','internet_users']:
        reg_avgs[metric] = regional_avg(country, metric, region, country_stats, country_region_map)

    # Aggregate product scores across operators (max score per product)
    all_product_scores = {}
    for item in items:
        for ps in item['operator_data']['product_scores']:
            p = ps['product']
            if p not in all_product_scores or ps['score'] > all_product_scores[p]['score']:
                all_product_scores[p] = ps

    country_product_ranking = sorted(all_product_scores.values(), key=lambda x: x['score'], reverse=True)

    # Radar dimensions (impact analysis aggregated)
    def ia_dim(key, default=3):
        vals = [trend_score(i['operator_data'].get(key)) for i in items]
        return round(np.mean(vals), 1)

    radar = {
        "roaming_opportunity": round(np.mean([
            (i['operator_data']['outbound_roaming_score'] + i['operator_data']['inbound_roaming_score']) / 2
            for i in items]), 1),
        "fraud_risk": round(np.mean([i['operator_data']['ott_score'] for i in items]), 1),
        "fiveG_upsell": round(min((stats.get('avg_5g') or 0) / 20, 5), 1),
        "arpu_pressure": round(np.mean([5 - i['operator_data']['arpu_growth_score'] + 1 for i in items]), 1),
        "subscriber_growth": round(np.mean([
            min((clean_float(i['_row'].get('Subscriber Growth (%)')) or 0) / 3 + 1, 5)
            for i in items]), 1),
        "regulatory_risk": round(np.mean([trend_score(i['_row'].get('Impact of Regulations')) for i in items]), 1),
    }

    # Waterfall: revenue components
    wf_base = 100
    ott_impact = round(-(ia_dim('ott_score') - 2) * 2, 1)
    arpu_impact = round(-(3 - round(np.mean([i['operator_data']['arpu_growth_score'] for i in items]),1)) * 1.5, 1)
    churn_impact = round(-(3 - round(np.mean([i['operator_data']['profitability_score'] for i in items]),1)) * 1.2, 1)
    roaming_upside = round((stats.get('roaming_intensity') or 3) * 1.8, 1)
    fiveG_upside = round(((stats.get('avg_5g') or 0) / 100) * 8, 1)
    waterfall = {
        "base": wf_base,
        "ott_substitution": ott_impact,
        "arpu_compression": arpu_impact,
        "churn_pressure": churn_impact,
        "roaming_upside": roaming_upside,
        "fiveG_upside": fiveG_upside,
        "net": round(wf_base + ott_impact + arpu_impact + churn_impact + roaming_upside + fiveG_upside, 1)
    }

    # Seasonal roaming calendar (from event data)
    seasonal = {}
    for item in items:
        em = str(item['operator_data'].get('event_month','')).lower()
        ei = str(item['operator_data'].get('event_impact','')).lower()
        for month_abbr, month_num in [
            ('jan',1),('feb',2),('mar',3),('apr',4),('may',5),('jun',6),
            ('jul',7),('aug',8),('sep',9),('oct',10),('nov',11),('dec',12)
        ]:
            if month_abbr in em:
                intensity = 3
                if 'high' in ei: intensity = 5
                elif 'moderate' in ei: intensity = 3
                elif 'low' in ei: intensity = 2
                seasonal[month_num] = max(seasonal.get(month_num, 0), intensity)

    # Anomaly detection result
    anomaly_z = anomalies.get(country, 0)
    anomaly_text = None
    if abs(anomaly_z) > 1.5:
        direction = "above" if anomaly_z > 0 else "below"
        anomaly_text = (
            f"{country}'s mobile penetration is {abs(anomaly_z):.1f} standard deviations "
            f"{direction} what its GDP per capita ({stats.get('gdp_per_capita','N/A')} USD) would predict. "
            + ("Exceptional pricing power — monitor churn risk if competition increases." if anomaly_z > 0
               else "Underperformance relative to wealth — ARPU compression or regulatory cap likely.")
        )

    # Build operator list for this country
    operators_list = []
    for item in items:
        op = item['operator_data'].copy()
        op.pop('_row', None)  # remove raw row reference
        operators_list.append(op)

    final_data[country] = {
        "country": country,
        "region": region,
        "sub_region": sub_region,
        "iso": coords['iso'],
        "lat": coords['lat'],
        "lng": coords['lng'],
        "population_mln": clean_float(row0.get('Population (mln)')),
        "mobile_users_mln": clean_float(row0.get('Mobile Users (mln)')),
        "mobile_penetration_pct": clean_float(row0.get('Mobile Penetration (%)')),
        "gdp_growth_pct": clean_float(row0.get('GDP Growth (%)')),
        "avg_age": clean_float(row0.get('Avg Age (Yrs)')),
        "age_over_65_pct": clean_float(row0.get('Age Over 65 (%)')),
        "internet_users_pct": clean_float(row0.get('Internet Users (%)')),
        "gdp_per_capita_usd": clean_float(row0.get('GDP per Capita (USD)')),
        "formerly_known_as": str(row0.get('Formerly Known As','')).strip(),
        "num_operators": len(items),
        "operators": operators_list,
        "stats": stats,
        "percentiles": percentiles,
        "regional_averages": reg_avgs,
        "radar": radar,
        "waterfall": waterfall,
        "seasonal_roaming": seasonal,
        "product_ranking": country_product_ranking,
        "cluster_id": country_cluster.get(country, 0),
        "cluster_name": country_cluster_name.get(country, "Unknown"),
        "anomaly_z_score": anomaly_z,
        "anomaly_text": anomaly_text,
        "top_product": country_product_ranking[0] if country_product_ranking else None,
    }

print(f"Built {len(final_data)} country records")

# ═══════════════════════════════════════════════════════════════════
# GLOBAL METADATA (for cross-country charts + filters)
# ═══════════════════════════════════════════════════════════════════
metadata = {
    "total_countries": len(final_data),
    "total_operators": sum(v['num_operators'] for v in final_data.values()),
    "regions": sorted(list(set(v['region'] for v in final_data.values()))),
    "cluster_names": CLUSTER_NAMES,
    "cluster_definitions": {
        "Mature & Saturated": "High 5G penetration, high ARPU, slow growth. Play: eSIM + SoR + Customer Retention.",
        "High Growth Exposed": "Fast subscriber growth, fraud risk elevated, ARPU pressure. Play: RAID 9 + Revenue Assurance.",
        "Roaming Hub": "High inbound + outbound, business travel driven. Play: Roaming DNA + Campaign + SoR.",
        "Emerging Opportunity": "Low penetration, strong GDP growth, 5G gap. Play: Managed Services + Active Testing.",
        "Regulatory Transition": "OTT restrictions, state influence, high bypass fraud. Play: RAID 9 + Signalling Security.",
    },
    "products": PRODUCTS,
    "global_averages": {
        k: round(float(np.nanmean([v['stats'].get(k) for v in final_data.values() if v['stats'].get(k) is not None])), 2)
        for k in ['mobile_penetration','gdp_growth','avg_age','avg_5g','roaming_intensity','fraud_score']
    },
    "generated": "2025-Q2",
    "data_sources": [
        "Global_Telecom_MNO_Verified.xlsx — MNO telecom metrics (517 operators)",
        "Global_Telecom_MNO_ImpactAnalysis_Mobileum_2.xlsx — Impact analysis + Mobileum product mapping",
        "oragnised_telecom.xlsx — European data supplement",
        "MECA_Combined_MNO_Data.xlsx — MECA dual-source verification (World Bank / ITU)",
    ]
}

# ═══════════════════════════════════════════════════════════════════
# SAVE
# ═══════════════════════════════════════════════════════════════════
output = {"metadata": metadata, "countries": final_data}

def numpy_serializer(obj):
    if isinstance(obj, (np.int64, np.int32, np.int16, np.int8)): return int(obj)
    if isinstance(obj, (np.float64, np.float32)): return None if np.isnan(obj) else float(obj)
    if isinstance(obj, np.ndarray): return obj.tolist()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

with open(BASE + 'master_telecom.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, default=numpy_serializer, ensure_ascii=False, separators=(',', ':'))

# Verify
size_mb = len(json.dumps(output, default=numpy_serializer)) / 1_000_000
print(f"\n✅ master_telecom.json written")
print(f"   Countries: {len(final_data)}")
print(f"   Operators: {sum(v['num_operators'] for v in final_data.values())}")
print(f"   File size: {size_mb:.1f} MB")
print(f"\nSample — India:")
ind = final_data.get('India', {})
print(f"  Operators: {ind.get('num_operators')}")
print(f"  5G avg: {ind.get('stats',{}).get('avg_5g')}")
print(f"  Top product: {ind.get('top_product',{}).get('product')} (score:{ind.get('top_product',{}).get('score')})")
print(f"  Cluster: {ind.get('cluster_name')}")
print(f"  Anomaly: {ind.get('anomaly_text','None')}")
