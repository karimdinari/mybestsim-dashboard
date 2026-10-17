import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Moon, Sun, Upload, Search, Info, ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { auditRows, computeStats, fmtDec, fmtEur, fmtInt, parseCsv, referenceStats, type Check, type Row } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyBestSim — Tableau de bord du catalogue eSIM" },
      { name: "description", content: "5 056 forfaits eSIM de 18 fournisseurs : prix, data, réseaux et destinations en un coup d'œil." },
      { property: "og:title", content: "MyBestSim — Catalogue eSIM" },
      { property: "og:description", content: "Statistiques clés du catalogue eSIM MyBestSim : 18 fournisseurs, 54 destinations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const tip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)", fontSize: 12 },
  cursor: { fill: "var(--muted)" },
};
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`surface overflow-hidden ${className}`}>
      <header className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <span className="h-4 w-1 rounded-full bg-primary" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Kpi({ label, value, sub, tone = "primary" }: { label: string; value: string; sub?: ReactNode; tone?: "primary" | "alert" | "accent" }) {
  const bar = tone === "alert" ? "bg-destructive" : tone === "accent" ? "bg-secondary" : "bg-primary";
  return (
    <div className="surface relative overflow-hidden p-5">
      <span className={`absolute inset-y-0 left-0 w-0.5 ${bar}`} />
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[1.7rem]">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Dashboard() {
  const [dark, setDark] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [fileCount, setFileCount] = useState(0);
  const [source, setSource] = useState<"ref" | "auto" | "files">("ref");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  // Charge automatiquement le catalogue complet (les 18 CSV pré-agrégés) au démarrage.
  useEffect(() => {
    let active = true;
    fetch("/catalog.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Row[]) => { if (active && Array.isArray(data) && data.length) { setRows(data); setSource("auto"); } })
      .catch(() => { /* on garde les valeurs de référence si le fichier est absent */ });
    return () => { active = false; };
  }, []);

  const s = useMemo(() => (rows ? computeStats(rows) : referenceStats), [rows]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const all = (await Promise.all([...files].map((f) => f.text()))).flatMap(parseCsv).filter((r) => r.provider);
    setRows(all);
    setFileCount(files.length);
    setSource("files");
  }

  const importLabel = source === "files" ? `${fileCount} CSV chargés` : source === "auto" ? "Catalogue chargé" : "Importer les CSV";

  const avgProv = s.providers.filter((p) => p.avgPrice !== undefined).sort((a, b) => a.avgPrice! - b.avgPrice!);
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 text-sm font-bold ring-1 ring-primary-foreground/25">MB</div>
            <div>
              <p className="text-lg font-semibold tracking-tight">MyBestSim <span className="font-normal opacity-60">· Catalogue eSIM</span></p>
              <p className="text-xs opacity-70">{fmtInt(s.total)} produits · {s.providers.length} fournisseurs · mis à jour le {today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input ref={input} type="file" accept=".csv" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            <button onClick={() => input.current?.click()} className="inline-flex items-center gap-2 rounded-md bg-card px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-90">
              <Upload className="h-4 w-4" /> {importLabel}
            </button>
            <button aria-label="Changer de thème" onClick={() => setDark(!dark)} className="rounded-md bg-primary-foreground/10 p-2 ring-1 ring-primary-foreground/20 transition hover:bg-primary-foreground/20">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <Kpi label="Cartes eSIM" value={fmtInt(s.total)} sub={`${s.providers.length} fournisseurs`} />
          <Kpi label="Produits > 100 €" value={fmtInt(s.over100)} sub="Haut de gamme" tone="alert" />
          <Kpi label="Fourchette de prix" value={`${fmtDec(s.minPrice)}–${fmtDec(s.maxPrice)} €`} sub="Min – max" />
          <Kpi label="Data moyenne" value={`${fmtDec(s.avgGb)} Go`} sub={`hors ${fmtInt(s.unlimited)} illimités`} />
          <Kpi label="Prix moyen" value={fmtEur(s.avgPrice)} sub="Tous forfaits" />
          <Kpi label="Forfaits illimités" value={fmtInt(s.unlimited)} sub="Comptés à part" tone="accent" />
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Kpi label="Prix par Go" value={`${fmtDec(s.perGo)} €/Go`} sub="hors illimités" />
          <Kpi label="Validité moyenne" value={`${fmtDec(s.avgValidity, 1)} j`} />
          <Kpi label="Rechargeables" value={`${fmtDec(s.topupPct, 1)} %`} sub="Top-up possible" />
          <Kpi label="Destinations" value={fmtInt(s.destinations)} sub="Pays et régions" />
        </div>

        <p className="flex items-start gap-2.5 rounded-lg border border-border bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Les forfaits illimités n'ont pas de volume en Go : la data moyenne et le prix par Go sont calculés sans eux, et leur nombre est affiché séparément.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Cartes par fournisseur">
            <ResponsiveContainer width="100%" height={520}>
              <BarChart data={s.providers} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" {...axis} />
                <YAxis type="category" dataKey="name" width={90} {...axis} />
                <Tooltip {...tip} formatter={(v: number) => [fmtInt(v), "Cartes"]} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="space-y-6">
            <Card title="Répartition des prix (€)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={s.hist}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" {...axis} />
                  <YAxis {...axis} />
                  <Tooltip {...tip} formatter={(v: number) => [fmtInt(v), "Produits"]} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {s.hist.map((h) => <Cell key={h.label} fill={h.label === "100+" ? "var(--chart-5)" : "var(--chart-1)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Réseau 4G vs 5G">
              <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                <div className="bg-primary" style={{ width: `${(s.net4g / (s.net4g + s.net5g)) * 100}%` }} />
                <div className="flex-1 bg-secondary" />
              </div>
              <div className="mt-3 flex justify-between text-sm">
                <span><b className="text-primary">4G</b> · {fmtInt(s.net4g)} ({fmtDec((s.net4g / (s.net4g + s.net5g)) * 100, 1)} %)</span>
                <span><b>5G</b> · {fmtInt(s.net5g)} ({fmtDec((s.net5g / (s.net4g + s.net5g)) * 100, 1)} %)</span>
              </div>
            </Card>
          </div>

          <Card title="Prix moyen par fournisseur">
            {avgProv.length > 2 ? (
              <ResponsiveContainer width="100%" height={520}>
                <BarChart data={avgProv} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" {...axis} />
                  <YAxis type="category" dataKey="name" width={90} {...axis} />
                  <Tooltip {...tip} formatter={(v: number) => [fmtEur(v), "Prix moyen"]} />
                  <Bar dataKey="avgPrice" fill="var(--chart-4)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="space-y-3 text-sm">
                {avgProv.map((p, i) => (
                  <div key={p.name} className="flex justify-between rounded-xl bg-muted px-4 py-3">
                    <span>{i === 0 ? "Moins cher" : "Plus cher"} · <b>{p.name}</b></span>
                    <span className="font-semibold">{fmtEur(p.avgPrice!)}</span>
                  </div>
                ))}
                <p className="text-muted-foreground">Importez les 18 fichiers CSV pour voir le classement complet.</p>
              </div>
            )}
          </Card>

          <Card title={`Top ${s.topDest.length} destinations`}>
            <ResponsiveContainer width="100%" height={Math.max(300, s.topDest.length * 32)}>
              <BarChart data={s.topDest} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" {...axis} />
                <YAxis type="category" dataKey="name" width={120} {...axis} />
                <Tooltip {...tip} formatter={(v: number) => [fmtInt(v), "Produits"]} />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <ImportHealth rows={rows} />

        <Explorer rows={rows} onImport={() => input.current?.click()} />
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">MyBestSim · mybestsim.com · Prix en EUR, toutes taxes comprises</footer>
    </div>
  );
}

function CheckRow({ c }: { c: Check }) {
  const Icon = c.level === "error" ? XCircle : c.level === "warning" ? AlertTriangle : CheckCircle2;
  const tone = c.level === "error" ? "text-destructive" : c.level === "warning" ? "text-secondary-foreground" : "text-primary";
  const badge = c.level === "ok"
    ? "bg-muted text-muted-foreground"
    : c.level === "warning"
      ? "bg-secondary/25 text-secondary-foreground"
      : "bg-destructive/15 text-destructive";
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{c.label}</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${badge}`}>
            {c.level === "ok" && c.label !== "Forfaits illimités" ? "OK" : fmtInt(c.count)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{c.hint}</p>
      </div>
    </div>
  );
}

function ImportHealth({ rows }: { rows: Row[] | null }) {
  const audit = useMemo(() => (rows ? auditRows(rows) : null), [rows]);

  return (
    <Card title="Santé des imports">
      {!audit ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Chargez le catalogue pour lancer l'audit automatique de qualité des données.
        </p>
      ) : (
        <>
          <div
            className={`mb-5 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 ${
              audit.errors > 0
                ? "border-destructive/30 bg-destructive/10"
                : audit.warnings > 0
                  ? "border-secondary/40 bg-secondary/15"
                  : "border-primary/25 bg-primary/5"
            }`}
          >
            <ShieldCheck className={`h-5 w-5 shrink-0 ${audit.errors > 0 ? "text-destructive" : "text-primary"}`} />
            <p className="text-sm font-medium text-foreground">
              {audit.healthy
                ? `${fmtInt(audit.providers)} fournisseurs · ${fmtInt(audit.rows)} lignes contrôlées · aucune anomalie bloquante`
                : `${fmtInt(audit.errors)} erreur(s) · ${fmtInt(audit.warnings)} avertissement(s) sur ${fmtInt(audit.rows)} lignes`}
            </p>
            <span
              className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
                audit.errors > 0
                  ? "bg-destructive text-primary-foreground"
                  : audit.warnings > 0
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
              }`}
            >
              {audit.errors > 0 ? "À corriger" : audit.warnings > 0 ? "À surveiller" : "Prêt à publier"}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {audit.checks.map((c) => <CheckRow key={c.label} c={c} />)}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Contrôles rejoués à chaque import (champs manquants, prix/validité invalides, devise, doublons de SKU, réseau, tarifs au Go aberrants). Objectif : bloquer les données corrompues avant leur mise en ligne.
          </p>
        </>
      )}
    </Card>
  );
}

function Explorer({ rows, onImport }: { rows: Row[] | null; onImport: () => void }) {
  const [q, setQ] = useState("");
  const [prov, setProv] = useState("");
  const [mode, setMode] = useState<"all" | "over" | "unl">("all");
  const [asc, setAsc] = useState(true);
  const [limit, setLimit] = useState(50);

  const providers = useMemo(() => [...new Set(rows?.map((r) => r.provider))].sort(), [rows]);
  const list = useMemo(() => {
    if (!rows) return [];
    const t = q.toLowerCase();
    return rows
      .filter((r) => (!prov || r.provider === prov) && (!t || r.country_name.toLowerCase().includes(t) || r.country_code.toLowerCase().includes(t)))
      .filter((r) => (mode === "over" ? r.price > 100 : mode === "unl" ? r.data_gb === null : true))
      .sort((a, b) => (asc ? a.price - b.price : b.price - a.price));
  }, [rows, q, prov, mode, asc]);

  const ctrl = "rounded-md border border-input bg-card px-3.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
  const chip = (on: boolean) => `rounded-md px-3.5 py-2 text-sm font-medium transition ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`;

  return (
    <Card title="Explorateur de données">
      {!rows ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="max-w-md text-sm text-muted-foreground">Chargez les 18 fichiers CSV des fournisseurs pour parcourir les 5 056 produits. Tout reste dans votre navigateur.</p>
          <button onClick={onImport} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Upload className="h-4 w-4" /> Importer les CSV
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Destination…" className={`${ctrl} pl-9`} />
            </div>
            <select value={prov} onChange={(e) => setProv(e.target.value)} className={ctrl}>
              <option value="">Tous les fournisseurs</option>
              {providers.map((p) => <option key={p}>{p}</option>)}
            </select>
            <button className={chip(mode === "all")} onClick={() => setMode("all")}>Tous</button>
            <button className={chip(mode === "over")} onClick={() => setMode("over")}>&gt; 100 €</button>
            <button className={chip(mode === "unl")} onClick={() => setMode("unl")}>Illimités</button>
            <span className="ml-auto self-center text-sm text-muted-foreground">{fmtInt(list.length)} résultats</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  {["Fournisseur", "Produit", "Destination", "Data", "Validité", "Réseau", "Recharge"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}
                  <th className="cursor-pointer px-3 py-2.5 text-right font-semibold text-primary" onClick={() => setAsc(!asc)}>Prix {asc ? "↑" : "↓"}</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, limit).map((r) => (
                  <tr key={r.sku + r.provider} className="border-b last:border-0 hover:bg-muted/60">
                    <td className="px-3 py-2 font-medium">{r.provider}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.product_name}</td>
                    <td className="px-3 py-2">{r.country_name}</td>
                    <td className="px-3 py-2">{r.data_gb === null ? <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">Illimité</span> : r.data_display}</td>
                    <td className="px-3 py-2">{r.validity_days} j</td>
                    <td className="px-3 py-2">{r.network}</td>
                    <td className="px-3 py-2">{r.top_up ? "Oui" : "Non"}</td>
                    <td className={`px-3 py-2 text-right font-semibold tabular-nums ${r.price > 100 ? "text-destructive" : ""}`}>{fmtEur(r.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length > limit && (
            <button onClick={() => setLimit(limit + 100)} className="mt-4 w-full rounded-md bg-muted py-2 text-sm font-medium text-foreground hover:bg-accent">Afficher plus</button>
          )}
        </>
      )}
    </Card>
  );
}
