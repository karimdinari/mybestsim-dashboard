# MyBestSim — Dashboard Catalogue eSIM

Tableau de bord qui lit le catalogue eSIM (5 056 forfaits de 18 fournisseurs) et
présente les statistiques clés, un audit qualité des imports et un explorateur de
données. Application web autonome, sans backend : les données sont servies en
statique et toutes les analyses sont calculées côté navigateur.

## Stack

TanStack Start · React 19 · Vite · Tailwind CSS v4 · shadcn/ui · Recharts.

## Développement

```bash
npm install
npm run dev        # http://localhost:8080
```

Le dashboard charge automatiquement `public/catalog.json` au démarrage (aucun
import manuel requis). Le bouton « Importer les CSV » permet de recharger
d'autres fichiers à la volée, entièrement dans le navigateur.

## Scripts

```bash
npm run dev        # serveur de développement
npm run build      # build de production
npm run preview    # prévisualiser le build
npm run test       # tests (statistiques + audit qualité)
npm run lint       # ESLint
```

## Données

Le catalogue est généré depuis les CSV sources par le script
`../scripts/build_catalog.py`, qui écrit `public/catalog.json`. La logique de
parsing, de calcul des statistiques et d'audit vit dans `src/lib/catalog.ts` ;
l'interface dans `src/routes/index.tsx`.

## Déploiement

Build SSR via Nitro, qui détecte automatiquement la plateforme cible (un preset
Vercel est fourni via `vercel.json`). Déployable sur tout hébergeur compatible.
