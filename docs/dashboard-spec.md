# MyBestSim — Dashboard Catalogue eSIM
### Specification complète (données + identité de marque + features)
Document de référence prêt à transmettre à un outil IA pour construire le dashboard.

---

## 0. Objectif & livrable
Construire **un dashboard en ligne autonome** : ouvrable via un simple lien, dans un navigateur, **sans rien installer ni télécharger**. Il lit les 18 fichiers CSV fournisseurs et présente les statistiques clés du catalogue + 2 features à valeur ajoutée.

- **Hébergement** : fichier HTML unique auto-suffisant (GitHub Pages / Netlify / Vercel, ou tout hébergeur statique).
- **Pas de backend.** Les données sont pré-calculées dans un `catalog.json` (les 5 056 lignes normalisées, ~1,3 Mo) servi avec l'app et chargé au démarrage.
- Code sur GitHub : bonus optionnel.

---

## 1. Les données

**18 fichiers CSV**, un par fournisseur, **colonnes strictement identiques** (aucune normalisation inter-fichiers nécessaire) :

| Colonne | Type | Notes |
|---|---|---|
| `sku` | texte | identifiant unique produit (clé pour détecter les doublons) |
| `provider` | texte | nom du fournisseur |
| `product_name` | texte | ex. « eSIM Espagne 3 Go 15 jours » |
| `country_code` | texte | code ISO (EU, AS, NA… pour les zones) |
| `country_name` | texte | destination (pays ou région) |
| `data_gb` | nombre **ou vide** | **vide = forfait illimité** (voir décision §3) |
| `data_display` | texte | ex. « 3 Go » ou « Illimité » |
| `validity_days` | entier | durée de validité |
| `price` | nombre | prix en EUR |
| `currency` | texte | **toujours EUR** |
| `network` | texte | `4G` ou `5G` |
| `top_up` | texte | `oui` / `non` (rechargeable) |

**Volumétrie vérifiée** : 5 056 produits · 18 fournisseurs · devise 100 % EUR · 0 prix manquant.

---

## 2. Identité visuelle — à aligner sur mybestsim.com

Valeurs **réelles extraites du CSS du site** (thème WordPress/Rehub).

**Police :** **Poppins** partout (titres, texte, nav, boutons). Disponible sur Google Fonts → charger via `<link>`, fallback `sans-serif`. Titres en semibold/medium.

**Palette de marque :**
| Rôle | Hex | Usage dans le dashboard |
|---|---|---|
| Bleu primaire | `#007bff` | couleur dominante : barres de graphiques, accents KPI, liens, états actifs |
| Jaune secondaire | `#ffcc00` | accent secondaire (2ᵉ série, « illimité », mises en avant) |
| Rouge CTA | `#de1414` | **un seul** usage fort : bouton d'action principal ou badge d'alerte (« > 100 € ») |
| Navy profond | `#003f71` | titres sombres / pied de page |
| Slate | `#44596b` | texte secondaire |
| Blanc | `#ffffff` | fond des cartes |
| Dégradé violet | `#667eea → #764ba2` | flourish de hero optionnel |

**Règles d'application :**
- Fond de page gris-bleu très clair ; **cartes blanches, coins arrondis, ombres douces** (le thème est rond, aérien, amical — pas corporate/anguleux).
- Texte des axes/valeurs en **navy/slate** (jamais jaune sur blanc : contraste insuffisant — le jaune s'utilise en aplat avec label).
- Rouge réservé à **une** action/alerte, pas diffusé partout.
- Ton : amical, voyage, légèrement ludique (émojis de section 🧭 🌍 🔍 🤝), **interface en français**.
- Logo/wordmark **« MyBestSim »** en haut à gauche du header.
- **Responsive** (mobile ok) + thèmes **clair & sombre**.
- Formatage FR des nombres : `29,30 €`, `5 056`.

---

## 3. Décision assumée à afficher (demandée par le sujet)
653 lignes ont `data_gb` vide = **forfaits illimités** (`data_display = "Illimité"`).
On ne peut pas « moyenner » de l'illimité → **la moyenne de Go se calcule uniquement sur les forfaits chiffrés**, et le **nombre de forfaits illimités est affiché séparément** comme KPI à part. À mentionner visiblement sur le dashboard (note sous la tuile « moyenne de data »).

---

## 4. Header
`[Logo MyBestSim]  Catalogue eSIM` · `5 056 produits · 18 fournisseurs` · `Mis à jour le JJ/MM/AAAA` · `[toggle clair/sombre]`

---

## 5. Section KPI — statistiques obligatoires (6 tuiles « big number »)
Valeurs pré-calculées (servent aussi à vérifier le build) :

| # | KPI | Valeur | Champ / calcul |
|---|---|---|---|
| 1 | Total cartes eSIM | **5 056** | nombre de lignes |
| 2 | Produits > 100 € | **56** | `count(price > 100)` — badge rouge |
| 3 | Fourchette de prix | **5,36 € – 154,63 €** | `min(price)` / `max(price)` |
| 4 | Data moyenne / carte | **14,49 Go** | moyenne `data_gb` **hors illimité** (+ note : 653 illimités) |
| 5 | Prix moyen global | **29,30 €** | `avg(price)` |
| 6 | Fournisseurs | **18** | `distinct(provider)` |

---

## 6. Section KPI bonus (tuiles secondaires)
| KPI | Valeur | Calcul |
|---|---|---|
| Prix moyen au Go | **3,17 €/Go** | `avg(price/data_gb)` hors illimité — indicateur de valeur |
| Validité moyenne | **17,4 jours** | `avg(validity_days)` |
| Rechargeables (top-up) | **54,2 %** | part de `top_up = oui` |
| Forfaits illimités | **653** | `count(data_gb vide)` |
| Destinations | **54** | `distinct(country_name)` |

---

## 7. Graphiques
Couleur dominante des barres = bleu `#007bff`. Axes/labels en slate/navy. Chaque graphe a un titre clair.

1. **Répartition par fournisseur** — barres horizontales, 18 fournisseurs triés décroissant.
   Airalo 722 · Ubigi 562 · eSIMX 432 · Saily 382 · GigSky 342 · Nomad 312 · Instabridge 282 · aloSIM 262 · Holafly 242 · Yesim 222 · Jetpac 212 · Truphone 202 · JamboSIM 182 · Flexiroam 172 · Yatelo 162 · Maya Mobile 152 · Roamic 122 · 4S eSIM 92
2. **Distribution des prix** — histogramme vertical, 7 tranches (€) :
   0–10 → 887 · 10–20 → 1605 · 20–30 → 679 · 30–50 → 922 · 50–75 → 697 · 75–100 → 210 · 100+ → 56
3. **Prix moyen par fournisseur** — barres horizontales (de 4S eSIM 24,26 € le moins cher … à Yesim 32,10 € le plus cher).
4. **Réseau 4G vs 5G** — barre segmentée : 4G 3 302 · 5G 1 754 (bleu / jaune).
5. **Top 15 destinations** — barres horizontales : Europe 206 · Asie 194 · Amérique du Nord 192 · Monde 186 · Indonésie 104 · Arabie saoudite 102 · Singapour 99 · Égypte 98 · États-Unis 98 · Kenya 96 …

---

## 8. ⭐ Feature créative #1 — « Trouveur de la meilleure eSIM » (hero du dashboard)
Reproduit le cœur de métier de MyBestSim (le comparateur) à partir des données.

**UX :** un bloc interactif en haut (sous les KPI).
- **Entrées utilisateur :** `Destination` (menu déroulant alimenté par les `country_name` distincts) + `Critère de tri` (`Moins cher` / `Meilleur rapport €/Go` / `Plus de data`) + filtres optionnels (`réseau 5G`, `rechargeable`, `illimité`).
- **Sortie :** classement en direct des forfaits de la destination choisie, **toutes marques confondues**, avec pour chaque ligne : fournisseur, nom du produit, data, validité, réseau, prix, et **€/Go** calculé.
- La 1ʳᵉ ligne est mise en avant = « 🏆 Meilleur choix ».

**Logique :**
1. Filtrer `rows` sur `country_name == destination` (+ filtres actifs).
2. Trier selon le critère : prix croissant / (price÷data_gb) croissant / data_gb décroissant.
3. Pour l'illimité : `€/Go` non applicable → afficher « ∞ » et exclure du tri €/Go.

> Argument : transforme un rapport statique en l'outil que l'entreprise vend réellement. Montre la compréhension du produit, pas seulement du cahier des charges.

---

## 9. 🔍 Feature créative #2 — « Santé des imports » (signal « Automatisation »)
Le sujet parle d'un **import quotidien** de CSV → un panneau qui **audite automatiquement** la qualité des données à chaque chargement.

**Contrôles affichés (par fournisseur + global) :**
- Nombre de lignes par fichier (les 18).
- **Valeurs manquantes** (prix, data_display, validity…).
- **Doublons de `sku`**.
- Contrôle de devise (tout doit être EUR).
- Nombre de forfaits illimités détectés.
- **Détection d'anomalies / outliers** (règles simples) :
  - `price <= 0` ou `validity_days <= 0`,
  - prix aberrant pour la data (ex. forfait « 1 Go » au prix d'un « 50 Go » → via z-score ou ratio €/Go > seuil),
  - `network` hors {4G, 5G}, `top_up` hors {oui, non}.
- **Statut global** : ✅ « 18/18 fichiers sains » ou ⚠️ liste des alertes.

> Argument : le poste est « Développeur IA & **Automatisation** ». Ce panneau dit « je détecte les données corrompues avant qu'elles n'atteignent le site ». Peu de candidats y penseront.

---

## 10. 🔎 Explorateur de données (table)
Table filtrable/triable sur les 5 056 lignes :
- **Filtres :** fournisseur (select), recherche par destination (texte), toggles `> 100 €` et `illimité uniquement`.
- **Tri :** par prix (et autres colonnes).
- **Colonnes :** produit · fournisseur · destination · data · validité · réseau · top-up · prix.
- Afficher « X résultats sur 5 056 » + pagination ou cap (ex. 300 lignes) avec invitation à affiner.

---

## 11. Pipeline de données (fourni)
Un script Python (`scripts/build_catalog.py`) lit les 18 CSV de `data/providers/`, normalise (`price`→float, illimité→`data_gb` nul, `top_up`→booléen) et écrit **`dashboard/public/catalog.json`** (le tableau des 5 056 lignes), puis affiche les stats pour vérification. Le dashboard charge ce JSON au démarrage.

---

### Checklist d'acceptation
- [ ] Ouvrable par un simple lien, sans installation.
- [ ] 6 KPI obligatoires exacts + répartition par fournisseur.
- [ ] Décision « illimité » visible et justifiée.
- [ ] Identité MyBestSim respectée (Poppins, bleu #007bff, cartes arrondies, FR).
- [ ] Feature « Meilleure eSIM » fonctionnelle.
- [ ] Panneau « Santé des imports » fonctionnel.
- [ ] Responsive + thème clair/sombre.
