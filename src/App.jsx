import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Leaf,
  Plus,
  Trash2,
  Download,
  Upload,
  Settings2,
  Mail,
  Factory,
  Rocket,
  Coins,
  TrendingUp,
} from "lucide-react";

// ----------------------
// Minimal UI primitives (no shadcn)
// ----------------------
const cx = (...c) => c.filter(Boolean).join(" ");

function Card({ className = "", children }) {
  return <div className={cx("rounded-2xl border border-gray-200 bg-white shadow-sm", className)}>{children}</div>;
}
function CardHeader({ className = "", children }) {
  return <div className={cx("p-4 md:p-5 border-b border-gray-100", className)}>{children}</div>;
}
function CardTitle({ className = "", children }) {
  return <div className={cx("text-lg font-semibold", className)}>{children}</div>;
}
function CardDescription({ className = "", children }) {
  return <div className={cx("text-sm text-gray-500", className)}>{children}</div>;
}
function CardContent({ className = "", children }) {
  return <div className={cx("p-4 md:p-5", className)}>{children}</div>;
}

function Button({ variant = "default", size = "md", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-md";
  const sizes = { sm: "px-2.5 py-1.5 text-sm", md: "px-3 py-2", lg: "px-4 py-2.5" };
  const variants = {
    default: "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-700",
    secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent",
  };
  return <button className={cx(base, sizes[size], variants[variant], className)} {...props} />;
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={cx(
        "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none",
        "focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
        className,
      )}
      {...props}
    />
  );
}

function Label({ className = "", children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className={cx("text-sm font-medium text-gray-700", className)}>
      {children}
    </label>
  );
}

function SelectNative({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cx(
        "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
        "focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
        className,
      )}
    >
      {children}
    </select>
  );
}

function SliderNative({ value, onChange, min = 0, max = 100, step = 1, className = "" }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className={cx("w-full", className)}
    />
  );
}

function Badge({ children, className = "" }) {
  return <span className={cx("inline-flex items-center rounded-xl border border-gray-300 bg-gray-100 px-2.5 py-1 text-xs", className)}>{children}</span>;
}

function Progress({ value = 0, className = "" }) {
  return (
    <div className={cx("w-full h-2 rounded-full bg-gray-200", className)}>
      <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function Modal({ open, onClose, title, description, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </div>
    </div>
  );
}

// ----------------------
// Utility & Constants
// ----------------------
const COUNTRIES = {
  UK: {
    name: "United Kingdom",
    code: "UK",
    currency: "GBP",
    symbol: "£",
    tariffPerKWh: 0.30, // demo default
    emissionFactorKgPerKWh: 0.20,
    petrolPricePerL: 1.70,
    solarYieldKWhPerKWPerDay: 2.7,
  },
  US: {
    name: "United States",
    code: "US",
    currency: "USD",
    symbol: "$",
    tariffPerKWh: 0.16,
    emissionFactorKgPerKWh: 0.40,
    petrolPricePerL: 0.95,
    solarYieldKWhPerKWPerDay: 4.0,
  },
  ZA: {
    name: "South Africa",
    code: "ZA",
    currency: "ZAR",
    symbol: "R",
    tariffPerKWh: 3.0,
    emissionFactorKgPerKWh: 0.90,
    petrolPricePerL: 25.0,
    solarYieldKWhPerKWPerDay: 5.5,
  },
};

const DEFAULTS = {
  performanceRatio: 0.85,
  pvSelfConsumption: 0.8,
  evKWhPerKm: 0.15,
  iceKgPerKm: 0.192,
  iceLPer100km: 7.5,
  geyserKWhPerLitrePerDay: 0.018,
  emailBaseGrams: 4,
  emailAttachGrams: 19,
};

const niceNumber = (n) => (isFinite(n) ? Math.round(n * 100) / 100 : 0);
const daysSince = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.floor((now - d) / (1000 * 60 * 60 * 24)));
};
const currencyFmt = (country) => (value) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: COUNTRIES[country].currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${COUNTRIES[country].symbol}${niceNumber(value)}`;
  }
};
const tonne = 1000; // kg

const demoDevices = (country = "ZA") => [
  {
    id: crypto.randomUUID(),
    type: "solar",
    name: "Rooftop PV",
    installDate: new Date(new Date().setMonth(new Date().getMonth() - 4)).toISOString().slice(0, 10),
    config: {
      capacityKW: 5,
      insolation: COUNTRIES[country].solarYieldKWhPerKWPerDay,
      performanceRatio: DEFAULTS.performanceRatio,
      selfConsumption: DEFAULTS.pvSelfConsumption,
    },
  },
  {
    id: crypto.randomUUID(),
    type: "ev",
    name: "Daily Driver EV",
    installDate: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().slice(0, 10),
    config: {
      kmPerDay: 35,
      evKWhPerKm: DEFAULTS.evKWhPerKm,
      iceKgPerKm: DEFAULTS.iceKgPerKm,
      iceLPer100km: DEFAULTS.iceLPer100km,
    },
  },
  {
    id: crypto.randomUUID(),
    type: "solar_geyser",
    name: "Solar Geyser 200L",
    installDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10),
    config: {
      tankLitres: 200,
      kWhPerLitrePerDay: DEFAULTS.geyserKWhPerLitrePerDay,
    },
  },
];

const demoEmail = {
  emailsPerDay: 40,
  pctWithAttachments: 0.35,
  baseGrams: DEFAULTS.emailBaseGrams,
  attachGrams: DEFAULTS.emailAttachGrams,
};

function calcSolar(device, country) {
  const c = COUNTRIES[country];
  const cfg = device.config;
  const dailyGen = cfg.capacityKW * (cfg.insolation ?? c.solarYieldKWhPerKWPerDay) * (cfg.performanceRatio ?? DEFAULTS.performanceRatio);
  const usedOnSite = dailyGen * (cfg.selfConsumption ?? DEFAULTS.pvSelfConsumption);
  const kgAvoided = usedOnSite * c.emissionFactorKgPerKWh;
  const moneySaved = usedOnSite * c.tariffPerKWh;
  return { dailyKWh: usedOnSite, kgAvoided, moneySaved };
}
function calcEV(device, country) {
  const c = COUNTRIES[country];
  const cfg = device.config;
  const evKWh = (cfg.kmPerDay ?? 0) * (cfg.evKWhPerKm ?? DEFAULTS.evKWhPerKm);
  const evKg = evKWh * c.emissionFactorKgPerKWh;
  const iceKg = (cfg.kmPerDay ?? 0) * (cfg.iceKgPerKm ?? DEFAULTS.iceKgPerKm);
  const kgAvoided = Math.max(0, iceKg - evKg);
  const petrolCost = (cfg.kmPerDay ?? 0) * ((cfg.iceLPer100km ?? DEFAULTS.iceLPer100km) / 100) * c.petrolPricePerL;
  const elecCost = evKWh * c.tariffPerKWh;
  const moneySaved = petrolCost - elecCost;
  return { dailyKWh: evKWh, kgAvoided, moneySaved };
}
function calcGeyser(device, country) {
  const c = COUNTRIES[country];
  const cfg = device.config;
  const kWhSaved = (cfg.tankLitres ?? 0) * (cfg.kWhPerLitrePerDay ?? DEFAULTS.geyserKWhPerLitrePerDay);
  const kgAvoided = kWhSaved * c.emissionFactorKgPerKWh;
  const moneySaved = kWhSaved * c.tariffPerKWh;
  return { dailyKWh: kWhSaved, kgAvoided, moneySaved };
}
function calcEmail(emailCfg) {
  const base = emailCfg.baseGrams ?? DEFAULTS.emailBaseGrams;
  const attach = emailCfg.attachGrams ?? DEFAULTS.emailAttachGrams;
  const n = emailCfg.emailsPerDay ?? 0;
  const p = emailCfg.pctWithAttachments ?? 0;
  const gramsAvg = base * (1 - p) + attach * p;
  const kg = (n * gramsAvg) / 1000;
  return { dailyKg: kg };
}
function calcDevice(device, country) {
  switch (device.type) {
    case "solar":
      return calcSolar(device, country);
    case "ev":
      return calcEV(device, country);
    case "solar_geyser":
      return calcGeyser(device, country);
    default:
      return { dailyKWh: 0, kgAvoided: 0, moneySaved: 0 };
  }
}
function cumulativeSinceInstall(device, country) {
  const daily = calcDevice(device, country);
  const days = daysSince(device.installDate);
  return {
    kWh: daily.dailyKWh * days,
    kg: daily.kgAvoided * days,
    money: daily.moneySaved * days,
    days,
  };
}

function Stat({ icon: Icon, label, value, sub, accent = "" }) {
  return (
    <Card className="rounded-2xl shadow-sm border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cx("p-2 rounded-xl bg-gray-100", accent)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
            <div className="text-xl font-semibold leading-tight">{value}</div>
            {sub && <div className="text-xs text-gray-500">{sub}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeviceRow({ d, country, onDelete }) {
  const res = calcDevice(d, country);
  const fmt = currencyFmt(country);
  return (
    <div className="grid grid-cols-12 items-center gap-3 border-b border-gray-100 py-3">
      <div className="col-span-3 flex items-center gap-2">
        <Badge>{d.type === "solar" ? "Solar" : d.type === "ev" ? "EV" : "Solar Geyser"}</Badge>
        <div className="font-medium">{d.name}</div>
      </div>
      <div className="col-span-2 text-sm text-gray-500">Installed {new Date(d.installDate).toLocaleDateString()}</div>
      <div className="col-span-2 text-sm">{niceNumber(res.dailyKWh)} kWh/day</div>
      <div className="col-span-2 text-sm">{niceNumber(res.kgAvoided)} kg CO₂e/day</div>
      <div className="col-span-2 text-sm">{fmt(res.moneySaved)}/day</div>
      <div className="col-span-1 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onDelete(d.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function AddDeviceModal({ country, onAdd }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("solar");
  const [name, setName] = useState("");
  const [installDate, setInstallDate] = useState(new Date().toISOString().slice(0, 10));

  // Solar
  const [capacityKW, setCapacityKW] = useState(5);
  const [insolation, setInsolation] = useState(COUNTRIES[country].solarYieldKWhPerKWPerDay);
  const [performanceRatio, setPerformanceRatio] = useState(DEFAULTS.performanceRatio);
  const [selfConsumption, setSelfConsumption] = useState(DEFAULTS.pvSelfConsumption);

  // EV
  const [kmPerDay, setKmPerDay] = useState(30);
  const [evKWhPerKm, setEvKWhPerKm] = useState(DEFAULTS.evKWhPerKm);
  const [iceKgPerKm, setIceKgPerKm] = useState(DEFAULTS.iceKgPerKm);
  const [iceLPer100km, setIceLPer100km] = useState(DEFAULTS.iceLPer100km);

  // Geyser
  const [tankLitres, setTankLitres] = useState(200);
  const [kWhPerLitrePerDay, setKWhPerLitrePerDay] = useState(DEFAULTS.geyserKWhPerLitrePerDay);

  function submit() {
    const device = {
      id: crypto.randomUUID(),
      type,
      name: name || (type === "solar" ? "Solar PV" : type === "ev" ? "Electric Vehicle" : "Solar Geyser"),
      installDate,
      config:
        type === "solar"
          ? { capacityKW, insolation, performanceRatio, selfConsumption }
          : type === "ev"
          ? { kmPerDay, evKWhPerKm, iceKgPerKm, iceLPer100km }
          : { tankLitres, kWhPerLitrePerDay },
    };
    onAdd(device);
    setOpen(false);
  }

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add device
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a device"
        description="Capture key details to estimate daily savings."
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <SelectNative value={type} onChange={(e) => setType(e.target.value)}>
                <option value="solar">Solar PV</option>
                <option value="ev">Electric Vehicle</option>
                <option value="solar_geyser">Solar Geyser</option>
              </SelectNative>
            </div>
            <div className="grid gap-2">
              <Label>Install date</Label>
              <Input type="date" value={installDate} onChange={(e) => setInstallDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Name</Label>
            <Input placeholder="My rooftop array / Model Y / 200L geyser" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {type === "solar" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Capacity (kW)</Label>
                <Input type="number" step="0.1" value={capacityKW} onChange={(e) => setCapacityKW(parseFloat(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>Insolation (kWh/kW/day)</Label>
                <Input type="number" step="0.1" value={insolation} onChange={(e) => setInsolation(parseFloat(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>Performance ratio</Label>
                <Input type="number" step="0.01" value={performanceRatio} onChange={(e) => setPerformanceRatio(parseFloat(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>Self-consumption (%)</Label>
                <SliderNative value={Math.round(selfConsumption * 100)} onChange={(e) => setSelfConsumption(parseFloat(e.target.value) / 100)} />
                <div className="text-xs text-gray-500">{Math.round(selfConsumption * 100)}% of PV used on-site</div>
              </div>
            </div>
          )}

          {type === "ev" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Km driven per day</Label>
                <Input type="number" value={kmPerDay} onChange={(e) => setKmPerDay(parseFloat(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>EV efficiency (kWh/km)</Label>
                <Input type="number" step="0.01" value={evKWhPerKm} onChange={(e) => setEvKWhPerKm(parseFloat(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>ICE emissions (kg/km)</Label>
                <Input type="number" step="0.001" value={iceKgPerKm} onChange={(e) => setIceKgPerKm(parseFloat(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>ICE fuel economy (L/100km)</Label>
                <Input type="number" step="0.1" value={iceLPer100km} onChange={(e) => setIceLPer100km(parseFloat(e.target.value))} />
              </div>
            </div>
          )}

          {type === "solar_geyser" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tank size (litres)</Label>
                <Input type="number" value={tankLitres} onChange={(e) => setTankLitres(parseFloat(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>kWh saved per litre per day</Label>
                <Input type="number" step="0.001" value={kWhPerLitrePerDay} onChange={(e) => setKWhPerLitrePerDay(parseFloat(e.target.value))} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} className="gap-2">
              <Leaf className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function EmailImpact({ emailCfg, setEmailCfg }) {
  const res = calcEmail(emailCfg);
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5"/> Email carbon consumption</CardTitle>
        <CardDescription>Estimate CO₂e for your daily email activity. Adjust factors if you have better data.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Emails per day</Label>
            <Input type="number" value={emailCfg.emailsPerDay} onChange={(e) => setEmailCfg({ ...emailCfg, emailsPerDay: parseFloat(e.target.value) })} />
          </div>
          <div className="grid gap-2">
            <Label>Share with attachments (%)</Label>
            <SliderNative value={Math.round((emailCfg.pctWithAttachments ?? 0) * 100)} onChange={(e) => setEmailCfg({ ...emailCfg, pctWithAttachments: parseFloat(e.target.value) / 100 })} />
            <div className="text-xs text-gray-500">{Math.round((emailCfg.pctWithAttachments ?? 0) * 100)}% with attachments</div>
          </div>
          <div className="grid gap-2">
            <Label>Base (g/email)</Label>
            <Input type="number" step="0.1" value={emailCfg.baseGrams} onChange={(e) => setEmailCfg({ ...emailCfg, baseGrams: parseFloat(e.target.value) })} />
          </div>
          <div className="grid gap-2">
            <Label>With attachment (g/email)</Label>
            <Input type="number" step="0.1" value={emailCfg.attachGrams} onChange={(e) => setEmailCfg({ ...emailCfg, attachGrams: parseFloat(e.target.value) })} />
          </div>
        </div>
        <div className="text-sm text-gray-600">Estimated: <span className="font-medium">{niceNumber(res.dailyKg)} kg CO₂e/day</span></div>
      </CardContent>
    </Card>
  );
}

function TradingPreview({ netKgPerDay }) {
  const dailyCredits = netKgPerDay / tonne;
  const daysToOne = dailyCredits > 0 ? Math.ceil(1 / dailyCredits) : Infinity;
  const mockBids = [
    { price: 7.8, qty: 0.2 },
    { price: 7.5, qty: 0.5 },
    { price: 7.1, qty: 1.0 },
  ];
  const mockAsks = [
    { price: 8.2, qty: 0.1 },
    { price: 8.6, qty: 0.3 },
    { price: 9.0, qty: 0.7 },
  ];
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5"/> Trading (Coming Soon)</CardTitle>
        <CardDescription>Preview a simple market once you accrue ≥1.0 tCO₂e. Uses demo order book data.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={TrendingUp} label="Best Bid" value={`$${mockBids[0].price.toFixed(2)}/t`} />
          <Stat icon={TrendingUp} label="Best Ask" value={`$${mockAsks[0].price.toFixed(2)}/t`} />
          <Stat icon={Leaf} label="Daily Credits" value={`${niceNumber(dailyCredits)} t/day`} />
        </div>
        <div className="text-sm text-gray-600">
          {isFinite(daysToOne) ? (
            <>At this pace you'll mint ~1 carbon credit in <span className="font-medium">{daysToOne} days</span>.</>
          ) : (
            <>You're emitting more than you save — add devices or reduce email footprint to reach net positive.</>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium mb-1">Top bids</div>
            {mockBids.map((b, i) => (
              <div key={i} className="flex justify-between border-b border-gray-100 py-1">
                <span>${b.price.toFixed(2)}</span>
                <span>{b.qty} t</span>
              </div>
            ))}
          </div>
          <div>
            <div className="font-medium mb-1">Top asks</div>
            {mockAsks.map((a, i) => (
              <div key={i} className="flex justify-between border-b border-gray-100 py-1">
                <span>${a.price.toFixed(2)}</span>
                <span>{a.qty} t</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled>List credits</Button>
          <Button disabled>Buy offsets</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EcoCreditsApp() {
  const [country, setCountry] = useState("ZA");
  const [devices, setDevices] = useState(() => {
    const cached = localStorage.getItem("eco_devices_v1");
    return cached ? JSON.parse(cached) : demoDevices("ZA");
  });
  const [emailCfg, setEmailCfg] = useState(() => {
    const cached = localStorage.getItem("eco_email_v1");
    return cached ? JSON.parse(cached) : demoEmail;
  });
  const [tariff, setTariff] = useState(() => {
    const cached = localStorage.getItem("eco_tariff_v1");
    return cached ? parseFloat(cached) : COUNTRIES["ZA"].tariffPerKWh;
  });
  const [emissionFactor, setEmissionFactor] = useState(() => {
    const cached = localStorage.getItem("eco_ef_v1");
    return cached ? parseFloat(cached) : COUNTRIES["ZA"].emissionFactorKgPerKWh;
  });

  useEffect(() => {
    localStorage.setItem("eco_devices_v1", JSON.stringify(devices));
  }, [devices]);
  useEffect(() => {
    localStorage.setItem("eco_email_v1", JSON.stringify(emailCfg));
  }, [emailCfg]);
  useEffect(() => {
    localStorage.setItem("eco_tariff_v1", String(tariff));
  }, [tariff]);
  useEffect(() => {
    localStorage.setItem("eco_ef_v1", String(emissionFactor));
  }, [emissionFactor]);

  useEffect(() => {
    setTariff(COUNTRIES[country].tariffPerKWh);
    setEmissionFactor(COUNTRIES[country].emissionFactorKgPerKWh);
  }, [country]);

  const fmt = useMemo(() => currencyFmt(country), [country]);

  const daily = useMemo(() => {
    const perDevice = devices.map((d) => ({ id: d.id, type: d.type, name: d.name, ...calcDevice(d, country) }));
    const totalMoney = perDevice.reduce((s, x) => s + x.moneySaved, 0);
    const totalKgAvoided = perDevice.reduce((s, x) => s + x.kgAvoided, 0);
    const email = calcEmail(emailCfg);
    const netKg = totalKgAvoided - email.dailyKg;
    return { perDevice, totalMoney, totalKgAvoided, emailKg: email.dailyKg, netKg };
  }, [devices, emailCfg, country]);

  const cumulative = useMemo(() => {
    const sums = devices
      .map((d) => cumulativeSinceInstall(d, country))
      .reduce((acc, x) => ({ kWh: acc.kWh + x.kWh, kg: acc.kg + x.kg, money: acc.money + x.money, days: Math.max(acc.days, x.days) }), { kWh: 0, kg: 0, money: 0, days: 0 });
    return sums;
  }, [devices, country]);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }).map((_, i) => {
      const m = new Date();
      m.setMonth(m.getMonth() + i);
      const label = m.toLocaleString(undefined, { month: "short" });
      const daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      const kgSaved = daily.totalKgAvoided * daysInMonth;
      const kgEmail = daily.emailKg * daysInMonth;
      return { name: label, Saved: niceNumber(kgSaved), Email: niceNumber(kgEmail), Net: niceNumber(kgSaved - kgEmail) };
    });
    return months;
  }, [daily]);

  const pieData = useMemo(() => {
    const arr = [
      ...daily.perDevice.map((x) => ({ name: x.name, value: Math.max(0.001, x.kgAvoided) })),
      { name: "Email consumption", value: Math.max(0.001, daily.emailKg) },
    ];
    return arr;
  }, [daily]);

  function addDevice(device) {
    setDevices((d) => [device, ...d]);
  }
  function deleteDevice(id) {
    setDevices((d) => d.filter((x) => x.id !== id));
  }
  function exportJSON() {
    const blob = new Blob([JSON.stringify({ country, devices, emailCfg, tariff, emissionFactor }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eco-credits-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const obj = JSON.parse(String(evt.target?.result));
        if (obj.country) setCountry(obj.country);
        if (obj.devices) setDevices(obj.devices);
        if (obj.emailCfg) setEmailCfg(obj.emailCfg);
        if (obj.tariff) setTariff(obj.tariff);
        if (obj.emissionFactor) setEmissionFactor(obj.emissionFactor);
      } catch (err) {
        alert("Invalid JSON");
      }
    };
    reader.readAsText(file);
  }

  const creditProgress = Math.max(0, Math.min(100, (daily.netKg / tonne) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div initial={{ rotate: -10, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
              <div className="rounded-2xl bg-emerald-100 p-2">
                <Leaf className="h-6 w-6 text-emerald-700" />
              </div>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Eco credits visualiser</h1>
              <p className="text-sm text-gray-500">Track daily energy savings and carbon credit impact across the UK, US, and South Africa.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="gap-2" onClick={exportJSON}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
              <Upload className="h-4 w-4" /> Import
              <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
            </label>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-6 rounded-2xl">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Country</Label>
                <SelectNative value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="UK">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="ZA">South Africa</option>
                </SelectNative>
              </div>
              <div className="grid gap-2">
                <Label>Electricity tariff (per kWh)</Label>
                <Input type="number" step="0.01" value={tariff} onChange={(e) => setTariff(parseFloat(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>Grid emission factor (kg CO₂e/kWh)</Label>
                <Input type="number" step="0.01" value={emissionFactor} onChange={(e) => setEmissionFactor(parseFloat(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Row */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Stat icon={Factory} label="Grid EF" value={`${emissionFactor} kg/kWh`} />
          <Stat icon={Rocket} label="Daily Net" value={`${niceNumber(daily.netKg)} kg CO₂e`} sub={`${niceNumber(daily.totalKgAvoided)} saved - ${niceNumber(daily.emailKg)} email`} />
          <Stat icon={Leaf} label="Daily Savings" value={fmt(daily.totalMoney)} />
          <Stat icon={Coins} label="Credit Progress" value={`${niceNumber(daily.netKg / tonne)} t/day`} sub={<Progress value={creditProgress} className="mt-1 h-2" />} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="grid gap-6 lg:col-span-2">
            <Card className="rounded-2xl">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5"/> Devices</CardTitle>
                  <CardDescription>Add solar, EV, or a solar geyser. We estimate daily kWh, CO₂e avoided, and money saved.</CardDescription>
                </div>
                <AddDeviceModal country={country} onAdd={addDevice} />
              </CardHeader>
              <CardContent>
                {devices.length === 0 ? (
                  <div className="py-8 text-sm text-gray-500">No devices yet. Click <span className="font-medium">Add device</span> to get started.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {devices.map((d) => (
                      <DeviceRow key={d.id} d={d} country={country} onDelete={deleteDevice} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5"/> Projections</CardTitle>
                <CardDescription>Next 12 months (monthly totals). Edit tariff or grid EF above to explore different scenarios.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="Saved" strokeWidth={2} />
                    <Line type="monotone" dataKey="Email" strokeWidth={2} />
                    <Line type="monotone" dataKey="Net" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <EmailImpact emailCfg={emailCfg} setEmailCfg={setEmailCfg} />
          </div>

          {/* Right Column */}
          <div className="grid gap-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5"/> Savings breakdown</CardTitle>
                <CardDescription>Daily CO₂e avoided by source (negative for email).</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: "Email", value: -niceNumber(daily.emailKg) }, ...daily.perDevice.map((x) => ({ name: x.name, value: niceNumber(x.kgAvoided) }))]}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5"/> Mix (today)</CardTitle>
                <CardDescription>Share of savings vs email consumption.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90}>
                      {pieData.map((_, i) => (
                        <Cell key={i} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <TradingPreview netKgPerDay={Math.max(0, daily.netKg)} />

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5"/> Advanced & data</CardTitle>
                <CardDescription>Bring your own data later via APIs or CSV.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <ul className="list-disc space-y-2 pl-5">
                  <li>Connect to smart meter / utility APIs to replace tariff and grid factor with live values.</li>
                  <li>Pull live PV generation from inverter APIs (Fronius, SolarEdge, Sunsynk, Victron).</li>
                  <li>Import EV trips from Tesla API or OBD logs to auto-calc km/day.</li>
                  <li>Upload monthly CSVs to backfill historical savings.</li>
                </ul>
                <div className="text-xs text-gray-500">Assumptions are editable. Figures are indicative only and not financial or regulatory advice.</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-gray-500">Built for demo purposes by Kuda Zafevere. 🇬🇧🇺🇸🇿🇦 • Make it yours and plug in real data later.</div>
      </div>
    </div>
  );
}