import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { auditRows, computeStats, referenceStats, type Row } from "@/lib/catalog";

// Loads the real bundled catalogue (the 18 providers, 5 056 rows) and checks that
// the stats computed live by the dashboard match the independently verified
// reference figures. This proves Part 1 runs on real data, not hard-coded numbers.
const rows: Row[] = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../public/catalog.json"), "utf-8"),
);

describe("Catalogue eSIM — statistiques calculées", () => {
  const s = computeStats(rows);

  it("charge les 5 056 produits des 18 fournisseurs", () => {
    expect(rows.length).toBe(5056);
    expect(s.total).toBe(5056);
    expect(s.providers.length).toBe(18);
  });

  it("retrouve les KPI obligatoires de référence", () => {
    expect(s.over100).toBe(referenceStats.over100); // 56
    expect(s.minPrice).toBeCloseTo(referenceStats.minPrice, 2); // 5,36 €
    expect(s.maxPrice).toBeCloseTo(referenceStats.maxPrice, 2); // 154,63 €
    expect(s.avgPrice).toBeCloseTo(referenceStats.avgPrice, 1); // 29,30 €
    expect(s.avgGb).toBeCloseTo(referenceStats.avgGb, 1); // 14,49 Go (hors illimité)
    expect(s.unlimited).toBe(referenceStats.unlimited); // 653
  });

  it("calcule les bonus (prix/Go, réseau, top-up, destinations)", () => {
    expect(s.perGo).toBeCloseTo(referenceStats.perGo, 1); // 3,17 €/Go
    expect(s.net4g).toBe(referenceStats.net4g); // 3302
    expect(s.net5g).toBe(referenceStats.net5g); // 1754
    expect(s.topupPct).toBeCloseTo(referenceStats.topupPct, 1); // 54,2 %
    expect(s.destinations).toBe(referenceStats.destinations); // 54
  });

  it("classe les fournisseurs par nombre de cartes (Airalo en tête)", () => {
    expect(s.providers[0]).toMatchObject({ name: "Airalo", count: 722 });
  });
});

describe("Santé des imports — audit qualité", () => {
  it("ne trouve aucune erreur bloquante sur le catalogue réel", () => {
    const a = auditRows(rows);
    expect(a.rows).toBe(5056);
    expect(a.providers).toBe(18);
    expect(a.errors).toBe(0); // données propres : pas de prix nul, devise ou champ manquant
  });

  it("détecte les anomalies injectées", () => {
    const bad: Row[] = [
      { ...rows[0]!, sku: "dup" },
      { ...rows[1]!, sku: "dup" }, // doublon de SKU
      { ...rows[2]!, price: 0 }, // prix invalide
      { ...rows[3]!, currency: "USD" }, // devise non EUR
      { ...rows[4]!, network: "3G" }, // réseau inconnu
    ];
    const a = auditRows(bad);
    expect(a.healthy).toBe(false);
    expect(a.errors).toBeGreaterThan(0);
    const byLabel = Object.fromEntries(a.checks.map((c) => [c.label, c.count]));
    expect(byLabel["SKU en doublon"]).toBe(1);
    expect(byLabel["Prix invalides (≤ 0)"]).toBe(1);
    expect(byLabel["Devises non EUR"]).toBe(1);
    expect(byLabel["Réseau inconnu"]).toBe(1);
  });
});
