export type Row = {
  sku: string;
  provider: string;
  product_name: string;
  country_code: string;
  country_name: string;
  data_gb: number | null;
  data_display: string;
  validity_days: number;
  price: number;
  currency: string;
  network: string;
  top_up: boolean;
};

export type Stats = {
  total: number;
  over100: number;
  minPrice: number;
  maxPrice: number;
  avgGb: number;
  unlimited: number;
  avgPrice: number;
  perGo: number;
  avgValidity: number;
  net4g: number;
  net5g: number;
  topupPct: number;
  destinations: number;
  providers: { name: string; count: number; avgPrice?: number | undefined }[];
  topDest: { name: string; count: number }[];
  hist: { label: string; count: number }[];
};

const counts: [string, number][] = [
  ["Airalo", 722], ["Ubigi", 562], ["eSIMX", 432], ["Saily", 382], ["GigSky", 342], ["Nomad", 312],
  ["Instabridge", 282], ["aloSIM", 262], ["Holafly", 242], ["Yesim", 222], ["Jetpac", 212], ["Truphone", 202],
  ["JamboSIM", 182], ["Flexiroam", 172], ["Yatelo", 162], ["Maya Mobile", 152], ["Roamic", 122], ["4S eSIM", 92],
];

/** Verified reference values from the brief — shown until CSV files are imported. */
export const referenceStats: Stats = {
  total: 5056, over100: 56, minPrice: 5.36, maxPrice: 154.63, avgGb: 14.49, unlimited: 653,
  avgPrice: 29.3, perGo: 3.17, avgValidity: 17.4, net4g: 3302, net5g: 1754, topupPct: 54.2, destinations: 54,
  providers: counts.map(([name, count]) => ({
    name, count, avgPrice: name === "4S eSIM" ? 24.26 : name === "Yesim" ? 32.1 : undefined,
  })),
  topDest: [
    ["Europe", 206], ["Asie", 194], ["Amérique du Nord", 192], ["Monde", 186], ["Indonésie", 104],
    ["Arabie saoudite", 102], ["Singapour", 99], ["Égypte", 98], ["États-Unis", 98], ["Kenya", 96],
  ].map(([name, count]) => ({ name: name as string, count: count as number })),
  hist: [
    ["0–10", 887], ["10–20", 1605], ["20–30", 679], ["30–50", 922], ["50–75", 697], ["75–100", 210], ["100+", 56],
  ].map(([label, count]) => ({ label: label as string, count: count as number })),
};

const BUCKETS: [string, number][] = [
  ["0–10", 10], ["10–20", 20], ["20–30", 30], ["30–50", 50], ["50–75", 75], ["75–100", 100], ["100+", Infinity],
];

export function computeStats(rows: Row[]): Stats {
  const n = rows.length || 1;
  const sized = rows.filter((r) => r.data_gb !== null && r.data_gb > 0);
  const prov = new Map<string, { count: number; sum: number }>();
  const dest = new Map<string, number>();
  const hist = BUCKETS.map(([label]) => ({ label, count: 0 }));
  for (const r of rows) {
    const p = prov.get(r.provider) ?? { count: 0, sum: 0 };
    p.count++; p.sum += r.price; prov.set(r.provider, p);
    dest.set(r.country_name, (dest.get(r.country_name) ?? 0) + 1);
    hist[BUCKETS.findIndex(([, max]) => r.price < max)]!.count++;
  }
  const prices = rows.map((r) => r.price);
  return {
    total: rows.length,
    over100: rows.filter((r) => r.price > 100).length,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgGb: sized.reduce((s, r) => s + r.data_gb!, 0) / (sized.length || 1),
    unlimited: rows.length - sized.length,
    avgPrice: prices.reduce((a, b) => a + b, 0) / n,
    perGo: sized.reduce((s, r) => s + r.price / r.data_gb!, 0) / (sized.length || 1),
    avgValidity: rows.reduce((s, r) => s + r.validity_days, 0) / n,
    net4g: rows.filter((r) => r.network === "4G").length,
    net5g: rows.filter((r) => r.network === "5G").length,
    topupPct: (rows.filter((r) => r.top_up).length / n) * 100,
    destinations: dest.size,
    providers: [...prov].map(([name, v]) => ({ name, count: v.count, avgPrice: v.sum / v.count })).sort((a, b) => b.count - a.count),
    topDest: [...dest].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15),
    hist,
  };
}

function parseLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === delim) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const num = (s: string) => {
  const v = parseFloat((s ?? "").replace(",", ".").trim());
  return Number.isFinite(v) ? v : null;
};

export function parseCsv(text: string): Row[] {
  const lines: string[] = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const delim = lines[0]!.split(";").length > lines[0]!.split(",").length ? ";" : ",";
  const head = parseLine(lines[0]!, delim).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((l) => {
    const c = parseLine(l, delim);
    const g = (k: string) => (c[head.indexOf(k)] ?? "").trim();
    return {
      sku: g("sku"), provider: g("provider"), product_name: g("product_name"),
      country_code: g("country_code"), country_name: g("country_name"),
      data_gb: num(g("data_gb")), data_display: g("data_display"),
      validity_days: num(g("validity_days")) ?? 0, price: num(g("price")) ?? 0,
      currency: g("currency"), network: g("network").toUpperCase(),
      top_up: g("top_up").toLowerCase() === "oui",
    };
  });
}

// ---------------------------------------------------------------------------
// Santé des imports : audit automatique de la qualité des données (chaque import
// quotidien de CSV est contrôlé). C'est le volet « Automatisation » du test :
// détecter les données corrompues avant qu'elles n'atteignent le site.
// ---------------------------------------------------------------------------
export type CheckLevel = "ok" | "warning" | "error";
export type Check = { label: string; level: CheckLevel; count: number; hint: string };
export type Audit = {
  rows: number;
  providers: number;
  healthy: boolean;
  errors: number;
  warnings: number;
  checks: Check[];
};

const VALID_NET = new Set(["4G", "5G"]);

export function auditRows(rows: Row[]): Audit {
  const seen = new Set<string>();
  let dupSku = 0, missingKey = 0, badPrice = 0, badValidity = 0, badCurrency = 0, badNetwork = 0;
  for (const r of rows) {
    if (r.sku) { if (seen.has(r.sku)) dupSku++; else seen.add(r.sku); } else missingKey++;
    if (!r.provider || !r.country_name || !r.product_name) missingKey++;
    if (!(r.price > 0)) badPrice++;
    if (!(r.validity_days > 0)) badValidity++;
    if (r.currency && r.currency.toUpperCase() !== "EUR") badCurrency++;
    if (!VALID_NET.has(r.network)) badNetwork++;
  }

  // Outliers de prix au Go (règle robuste médiane + MAD) sur les forfaits chiffrés.
  const perGo = rows.filter((r) => r.data_gb && r.data_gb > 0).map((r) => r.price / r.data_gb!).sort((a, b) => a - b);
  let priceOutliers = 0;
  if (perGo.length > 10) {
    const med = perGo[Math.floor(perGo.length / 2)]!;
    const mad = [...perGo].map((v) => Math.abs(v - med)).sort((a, b) => a - b)[Math.floor(perGo.length / 2)]! || 1;
    const hi = med + 6 * 1.4826 * mad;
    priceOutliers = perGo.filter((v) => v > hi).length;
  }

  const unlimited = rows.filter((r) => r.data_gb === null).length;

  const mk = (label: string, count: number, hint: string, bad: CheckLevel): Check => ({
    label, count, hint, level: count === 0 ? "ok" : bad,
  });

  const checks: Check[] = [
    mk("Champs clés manquants", missingKey, "sku, fournisseur, destination ou nom de produit vide", "error"),
    mk("Prix invalides (≤ 0)", badPrice, "prix absent ou nul", "error"),
    mk("Devises non EUR", badCurrency, "une devise étrangère s'est glissée dans l'import", "error"),
    mk("SKU en doublon", dupSku, "même identifiant produit répété", "warning"),
    mk("Validité invalide (≤ 0 j)", badValidity, "durée manquante ou nulle", "warning"),
    mk("Réseau inconnu", badNetwork, "valeur hors 4G / 5G", "warning"),
    mk("Prix/Go aberrants", priceOutliers, "tarif au Go anormalement élevé (médiane + 6·MAD)", "warning"),
    { label: "Forfaits illimités", count: unlimited, hint: "détectés et comptés à part (normal)", level: "ok" },
  ];

  const errors = checks.filter((c) => c.level === "error").reduce((s, c) => s + c.count, 0);
  const warnings = checks.filter((c) => c.level === "warning").reduce((s, c) => s + c.count, 0);
  return {
    rows: rows.length,
    providers: new Set(rows.map((r) => r.provider)).size,
    healthy: errors === 0 && warnings === 0,
    errors,
    warnings,
    checks,
  };
}

const nf = (d: number) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtInt = (v: number) => nf(0).format(v);
export const fmtEur = (v: number) => `${nf(2).format(v)} €`;
export const fmtDec = (v: number, d = 2) => nf(d).format(v);
