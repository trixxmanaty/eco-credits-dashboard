# Eco Credits Visualiser

Track how much people are saving on energy and the impact on their carbon credits across the **UK**, **United States**, and **South Africa**. Add devices (solar PV, electric vehicle, solar geyser), set capacities and install dates, estimate email CO₂e use, and preview a future carbon-credit trading flow.

> **Status**: MVP with demo data. APIs can be plugged in later. 1 credit = **1 tCO₂e (1000 kg)**.

---

## ✨ Features

* **Multi‑country** presets (UK/US/ZA) with editable **tariffs** and **grid emission factors**
* **Devices**: Solar PV, EV, Solar Geyser — daily **kWh**, **CO₂e avoided**, and **money saved**
* **Email CO₂e** estimator (base vs attachment emails)
* **Projections**: 12‑month line chart (Saved, Email, Net)
* **Mix view**: per‑source savings vs email consumption
* **Credit tracker**: progress toward 1 tCO₂e and *time-to-1‑credit*
* **Trading preview** (mock order book; disabled actions)
* **Import/Export** all data as JSON; auto‑persist in `localStorage`
* Clean UI (Tailwind + shadcn/ui), icons (lucide), animations (Framer Motion), charts (Recharts)

---

## 🧱 Tech Stack

* **React + Vite** (SPA)
* **Tailwind CSS** + **shadcn/ui** components
* **lucide-react** icons, **Framer Motion** animations
* **recharts** for charts

---

## 🚀 Quickstart

### From this repository

```bash
# install dependencies
npm install

# start dev server
npm run dev

# build for production
npm run build
```

### Start from scratch (copy the single-file component)

```bash
npm create vite@latest eco-credits -- --template react
cd eco-credits
npm i
npm i framer-motion recharts lucide-react class-variance-authority clsx tailwind-merge
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Add Tailwind to `index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Replace `App.jsx` with the component from this repo.

> **Note**: If you don’t use shadcn/ui prebuilt components in your stack, replace the imports with your design system equivalents.

---

## 🌍 Countries & Defaults

Defaults are **editable in the UI** and serve only as placeholders.

| Country             | Currency | Tariff (per kWh) | Grid EF (kg CO₂e/kWh) | Petrol (per L) | Solar yield (kWh/kW/day) |
| ------------------- | -------: | ---------------: | --------------------: | -------------: | -----------------------: |
| United Kingdom (UK) |      GBP |             0.30 |                  0.20 |           1.70 |                      2.7 |
| United States (US)  |      USD |             0.16 |                  0.40 |           0.95 |                      4.0 |
| South Africa (ZA)   |      ZAR |             3.00 |                  0.90 |           25.0 |                      5.5 |

> These are broad estimates to make the demo useful. Replace via live APIs or local data when possible.

**Global defaults** (editable via inputs where applicable):

* PV performance ratio: **0.85**
* PV self-consumption share: **0.8**
* EV efficiency: **0.15 kWh/km**
* ICE emissions: **0.192 kg/km**
* ICE fuel economy: **7.5 L/100km**
* Solar geyser: **0.018 kWh per litre per day**
* Email: **4 g/email** (base), **19 g/email** (with attachment)

---

## 🧮 Calculations

All figures are indicative and simplified; adapt to your context.

### Solar PV

```
dailyGen = capacityKW × insolation(kWh/kW/day) × performanceRatio
usedOnSite = dailyGen × selfConsumption
kgAvoided = usedOnSite × gridEmissionFactor
moneySaved = usedOnSite × tariff
```

### Electric Vehicle (EV)

```
evKWh = kmPerDay × evKWhPerKm
evKg = evKWh × gridEmissionFactor
iceKg = kmPerDay × iceKgPerKm
kgAvoided = max(0, iceKg − evKg)
petrolCost = kmPerDay × (iceLPer100km/100) × petrolPricePerL
elecCost = evKWh × tariff
moneySaved = petrolCost − elecCost
```

### Solar Geyser

```
kWhSaved = tankLitres × kWhPerLitrePerDay
kgAvoided = kWhSaved × gridEmissionFactor
moneySaved = kWhSaved × tariff
```

### Email CO₂e

```
gramsAvg = baseGrams × (1 − pAttach) + attachGrams × pAttach
dailyKg  = emailsPerDay × gramsAvg / 1000
```

### Net & Credits

```
netKgPerDay = sum(kgAvoidedDevices) − dailyEmailKg
creditsPerDay = netKgPerDay / 1000    # 1 tCO₂e = 1000 kg
```

### Cumulative Since Install

For each device: multiply its **daily** outputs by **days since install** (floor).

### Projections

12 months ahead. For month *m*:

```
kgSaved_m = dailySavedKg × daysInMonth(m)
kgEmail_m = dailyEmailKg × daysInMonth(m)
net_m     = kgSaved_m − kgEmail_m
```

---

## 📦 Data Storage & Portability

* Persists to `localStorage`:

  * `eco_devices_v1`, `eco_email_v1`, `eco_tariff_v1`, `eco_ef_v1`
* **Export**: Downloads a single JSON file with all settings.
* **Import**: Load a previously exported JSON to restore state.

**Export schema (example):**

```json
{
  "country": "ZA",
  "tariff": 3.0,
  "emissionFactor": 0.9,
  "emailCfg": {"emailsPerDay": 40, "pctWithAttachments": 0.35, "baseGrams": 4, "attachGrams": 19},
  "devices": [
    {"id": "...", "type": "solar", "name": "Rooftop PV", "installDate": "2025-04-01", "config": {"capacityKW": 5, "insolation": 5.5, "performanceRatio": 0.85, "selfConsumption": 0.8}},
    {"id": "...", "type": "ev", "name": "Daily Driver EV", "installDate": "2025-06-01", "config": {"kmPerDay": 35, "evKWhPerKm": 0.15, "iceKgPerKm": 0.192, "iceLPer100km": 7.5}},
    {"id": "...", "type": "solar_geyser", "name": "Solar Geyser 200L", "installDate": "2025-07-01", "config": {"tankLitres": 200, "kWhPerLitrePerDay": 0.018}}
  ]
}
```

---

## 🔌 Future Integrations

* **Utility & smart‑meter APIs** for live tariffs and grid EF
* **Solar inverter** APIs (Fronius/SolarEdge/Sunsynk/Victron) for live PV generation
* **EV**: Tesla API, OBD trip logs → auto km/day
* **Offsets/Trading**: connect to registries/marketplaces; KYC & attestations
* **CSV importers** for backfilling historic usage
* **Auth & teams**: leaderboards, workplace challenges
* **PWA**: installable, offline mode, push alerts

---

## 🧭 Project Structure (MVP)

This MVP ships as a **single React component** for easy drop‑in. Migrate to a modular folder structure as features grow:

```
src/
  components/
  lib/
  pages/
  hooks/
```

---

## ✅ Accessibility & i18n

* Semantic labels on controls; charts include tooltips and axes
* Future: keyboard shortcuts, screen‑reader summaries for charts
* Future: locale‑aware number/currency formatting and translations

---

## 🤝 Contributing

PRs welcome! Please keep PRs small and focused. For changes that affect formulas or assumptions, include:

* Rationale and sources (for defaults)
* Before/after screenshots
* Unit tests where feasible (utility functions)

---

## ⚠️ Disclaimer

This app provides **indicative** calculations only. It is **not** financial, engineering, or regulatory advice. Always verify with your local utility, installer, and relevant standards.

---

## 📄 License

MIT © Contributors
