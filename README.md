# MyBestSim — Test de recrutement (Stagiaire Développeur IA & Automatisation)

Livrables du test : un **dashboard du catalogue eSIM** (Partie 1) et, à venir, un
**article SEO** (Partie 2). Ce dépôt contient le code, les données et la
documentation de méthodologie.

## Structure du projet

```
MyBestSim/
├── README.md                  Ce fichier : vue d'ensemble et prise en main
├── dashboard/                 Application web du dashboard (TanStack Start + React)
│   ├── src/                   Code source (routes, composants, logique catalogue)
│   │   ├── routes/index.tsx   Page du dashboard (KPI, graphiques, audit, explorateur)
│   │   └── lib/catalog.ts     Parsing CSV, calcul des stats, audit qualité
│   ├── public/catalog.json    Données normalisées servies à l'app (généré)
│   └── src/test/              Tests automatisés (vérifient les stats + l'audit)
├── data/
│   └── providers/             Les 18 CSV sources, un par fournisseur
├── scripts/
│   └── build_catalog.py       Pipeline : 18 CSV -> dashboard/public/catalog.json
└── docs/
    ├── dashboard-spec.md      Cahier des charges (données + marque + features)
    ├── methodologie.md        Journal de méthodologie (comment l'IA a été utilisée)
    └── recruitment-test.pdf   Sujet original du test
```

> Note : le dossier de l'app s'appelle encore `pixel-perfect-23` (nom généré par
> Lovable). Le renommer en `dashboard` depuis VS Code (clic droit → Renommer)
> aligne l'arborescence ci-dessus ; le code et les scripts fonctionnent avec les
> deux noms.

## Prise en main

### 1. Lancer le dashboard (Partie 1)

```bash
cd dashboard          # ou pixel-perfect-23
npm install           # une seule fois
npm run dev           # ouvre http://localhost:8080
```

Le dashboard charge automatiquement le catalogue (5 056 produits, 18
fournisseurs) — aucun import manuel requis. Le bouton « Importer les CSV » permet
de recharger d'autres fichiers à la volée.

### 2. Régénérer les données depuis les CSV

Si les CSV sources changent (import quotidien), on reconstruit le catalogue :

```bash
python -I scripts/build_catalog.py
```

Le script lit `data/providers/*.csv`, normalise les lignes et écrit
`dashboard/public/catalog.json`, puis affiche les statistiques clés pour contrôle.

### 3. Vérifier (tests + build)

```bash
cd dashboard
npm run test          # les stats calculées == valeurs de référence + audit qualité
npm run build         # build de production (déployable)
```

## Ce que fait le dashboard

- **6 KPI obligatoires** : total de cartes, produits > 100 €, fourchette de prix,
  data moyenne (hors illimité), prix moyen, nombre de fournisseurs.
- **Bonus** : prix/Go, validité moyenne, % rechargeables, illimités, destinations.
- **Graphiques** : cartes par fournisseur, distribution des prix, prix moyen par
  fournisseur, réseau 4G/5G, top destinations.
- **Santé des imports** (volet Automatisation) : audit auto de la qualité des
  données (champs manquants, prix/validité invalides, devise, doublons de SKU,
  réseau, tarifs au Go aberrants) avec un statut global.
- **Explorateur** : table filtrable et triable des 5 056 produits.

### Décision assumée
Les 653 forfaits **illimités** (`data_gb` vide) ne peuvent pas être moyennés : la
data moyenne et le prix/Go sont calculés **hors illimité**, et le nombre
d'illimités est affiché séparément. C'est indiqué sur le dashboard.

## Stack

TanStack Start · React 19 · Vite · Tailwind CSS v4 · shadcn/ui · Recharts ·
police Poppins et couleurs de marque MyBestSim. Pas de backend : données
statiques + calcul côté navigateur → déployable sur n'importe quel hébergeur.
