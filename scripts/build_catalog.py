"""
build_catalog.py — Pipeline de données MyBestSim (Partie 1).

Lit les CSV fournisseurs (un fichier par fournisseur, mêmes colonnes), les
normalise en un catalogue unique et écrit le JSON consommé par le dashboard.
Affiche aussi les statistiques clés pour vérification.

Usage (depuis la racine du projet) :
    python -I scripts/build_catalog.py
    python -I scripts/build_catalog.py <dossier_csv> <sortie_json>

Par défaut :
    entrée  = data/providers/*.csv
    sortie  = dashboard/public/catalog.json   (ou pixel-perfect-23/public/… si présent)
"""
import csv, glob, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def default_out():
    for app in ("dashboard", "pixel-perfect-23"):
        pub = os.path.join(ROOT, app, "public")
        if os.path.isdir(pub):
            return os.path.join(pub, "catalog.json")
    return os.path.join(ROOT, "catalog.json")


CSV_DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "data", "providers")
OUT_JSON = sys.argv[2] if len(sys.argv) > 2 else default_out()


def to_float(s):
    s = (s or "").strip()
    return float(s) if s else None


def normalize(r):
    """Une ligne CSV -> une ligne du catalogue (schéma attendu par le dashboard)."""
    dg = to_float(r.get("data_gb"))
    return {
        "sku": r.get("sku", "").strip(),
        "provider": r.get("provider", "").strip(),
        "product_name": r.get("product_name", "").strip(),
        "country_code": r.get("country_code", "").strip(),
        "country_name": r.get("country_name", "").strip(),
        "data_gb": dg,  # None = forfait illimité
        "data_display": r.get("data_display", "").strip(),
        "validity_days": int(to_float(r.get("validity_days")) or 0),
        "price": to_float(r.get("price")) or 0.0,
        "currency": r.get("currency", "").strip(),
        "network": r.get("network", "").strip().upper(),
        "top_up": r.get("top_up", "").strip().lower() == "oui",
    }


def load_rows(csv_dir):
    files = sorted(glob.glob(os.path.join(csv_dir, "*.csv")))
    if not files:
        sys.exit(f"Aucun CSV trouvé dans {csv_dir}")
    rows = []
    for path in files:
        with open(path, encoding="utf-8-sig", newline="") as f:
            rows.extend(normalize(r) for r in csv.DictReader(f))
    return rows, len(files)


def summarize(rows):
    prices = [r["price"] for r in rows if r["price"]]
    sized = [r for r in rows if r["data_gb"]]
    provs = {}
    for r in rows:
        provs[r["provider"]] = provs.get(r["provider"], 0) + 1
    return {
        "fichiers_fournisseurs": None,  # rempli par l'appelant
        "total_produits": len(rows),
        "fournisseurs": len(provs),
        "produits_plus_100e": sum(1 for p in prices if p > 100),
        "prix_min": round(min(prices), 2),
        "prix_max": round(max(prices), 2),
        "prix_moyen": round(sum(prices) / len(prices), 2),
        "data_moyenne_go_hors_illimite": round(sum(r["data_gb"] for r in sized) / len(sized), 2),
        "forfaits_illimites": len(rows) - len(sized),
        "prix_moyen_par_go": round(sum(r["price"] / r["data_gb"] for r in sized) / len(sized), 2),
        "destinations": len({r["country_name"] for r in rows}),
    }


def main():
    rows, n_files = load_rows(CSV_DIR)
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))

    stats = summarize(rows)
    stats["fichiers_fournisseurs"] = n_files
    print(json.dumps(stats, ensure_ascii=False, indent=2))
    print(f"\n{len(rows)} lignes depuis {n_files} fichiers -> {OUT_JSON}")


if __name__ == "__main__":
    main()
