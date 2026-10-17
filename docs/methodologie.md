===============================================================================
RAPPORT DE MÉTHODOLOGIE — Test de recrutement MyBestSim
Stagiaire Développeur IA & Automatisation
Outil IA utilisé : Claude Code (agent IA en terminal)
===============================================================================

Ce document retrace, étape par étape, comment j'ai réalisé le test et comment
je me suis servi de l'IA. Il servira de base à la section « comment tu as
utilisé l'IA » demandée dans le livrable.

-------------------------------------------------------------------------------
ÉTAPE 0 — Lecture et compréhension du sujet
-------------------------------------------------------------------------------
- J'ai fait lire le PDF du test par l'IA pour en extraire les attentes exactes.
- Le test comporte 2 parties :
  * Partie 1 : un dashboard EN LIGNE (lien, sans installation) qui lit les 18
    CSV fournisseurs et affiche 6 stats clés + bonus.
  * Partie 2 : un article de blog SEO « Internet en croisière : quelle eSIM
    choisir ? », ton MyBestSim.
- Critères d'évaluation : résultat final, autonomie, méthodologie.

-------------------------------------------------------------------------------
ÉTAPE 1 — Exploration et audit des données (18 fichiers CSV)
-------------------------------------------------------------------------------
Objectif : comprendre la structure avant de coder, repérer les pièges.

Ce que j'ai vérifié avec l'IA (commandes d'inspection sur les CSV) :
- Schéma des fichiers : les 18 fichiers partagent EXACTEMENT les mêmes colonnes :
  sku, provider, product_name, country_code, country_name, data_gb,
  data_display, validity_days, price, currency, network, top_up
  => Bonne nouvelle : pas de normalisation de colonnes à faire entre fournisseurs.

- Volume : 5 056 produits au total répartis sur 18 fournisseurs.
  Détail (nb de produits) :
    airalo 722, ubigi 562, esimx 432, saily 382, gigsky 342, nomad 312,
    instabridge 282, alosim 262, holafly 242, yesim 222, jetpac 212,
    truphone 202, flexiroam 172, yatelo 162, maya 152, roamic 122,
    jambosim 182, 4sesim 92.

- Devise : une seule devise, EUR, sur les 5 056 lignes => pas de conversion.

- Prix : aucune valeur manquante. min = 5,36 € / max = 154,63 € / moyenne = 29,30 €.
  56 produits à plus de 100 €.

- Donnée (data_gb) : valeurs 1, 3, 5, 10, 20, 50 Go.
  PIÈGE IMPORTANT : 653 lignes ont data_gb VIDE. Ce ne sont pas des erreurs :
  leur data_display = « Illimité » (forfaits données illimitées).

DÉCISION ASSUMÉE (demandée par le sujet en cas de doute) :
- Pour « la moyenne de data (Go) par carte », on ne PEUT PAS moyenner l'illimité.
  => Je calcule la moyenne de Go UNIQUEMENT sur les forfaits à data chiffrée
     (hors illimité), et j'affiche à côté le nombre de forfaits illimités comme
     information séparée. C'est plus honnête qu'un 0 ou qu'une valeur arbitraire.

-------------------------------------------------------------------------------
ÉTAPE 2 — Pipeline de normalisation des données (script Python)
-------------------------------------------------------------------------------
Objectif : transformer les 18 CSV en UN jeu de données propre + calculer les
stats demandées, de façon reproductible (le sujet parle d'un import quotidien).

Ce que j'ai fait faire à l'IA :
- Écriture d'un script Python (build_data.py) qui :
  * lit les 18 CSV,
  * normalise chaque ligne (prix en float, data illimitée -> champ "unlimited",
    top_up oui/non -> booléen),
  * calcule toutes les stats du cahier des charges + des bonus,
  * exporte un fichier data.json (stats agrégées + les 5056 lignes détaillées)
    pour rendre le dashboard interactif (filtres par fournisseur, recherche).

RÉSULTATS CALCULÉS (chiffres clés du dashboard) :
  1. Nombre total de cartes eSIM .............. 5 056
  2. Produits à plus de 100 € ................. 56
  3. Fourchette de prix ....................... 5,36 € – 154,63 €
  4. Moyenne de data (hors illimité) .......... 14,49 Go  (+ 653 forfaits illimités)
  5. Prix moyen global ........................ 29,30 €
  6. Répartition par fournisseur (18) ......... Airalo 722 … 4S eSIM 92

BONUS calculés :
  - Prix moyen au Go ......................... 3,17 €/Go
  - Validité moyenne ......................... 17,4 jours
  - Réseau : 4G 3302 vs 5G 1754
  - % de forfaits rechargeables (top-up) ..... 54,2 %
  - 54 destinations distinctes ; top : Europe, Asie, Amérique du Nord, Monde…
  - Histogramme de distribution des prix (7 tranches)
  - Prix moyen par fournisseur (pour comparer les fournisseurs entre eux)

Choix technique : embarquer data.json (1,4 Mo) directement dans la page =>
dashboard 100 % autonome, aucun backend, ouvrable par simple lien.

-------------------------------------------------------------------------------
ÉTAPE 3 — Étude de l'identité de marque (site officiel mybestsim.com)
-------------------------------------------------------------------------------
Objectif : que le dashboard soit visuellement cohérent avec la marque.

Ce que j'ai fait faire à l'IA :
- Récupération du HTML/CSS réel du site (thème WordPress/Rehub) et extraction des
  variables de thème (et non des suppositions) :
  * Police : Poppins (titres, texte, nav, boutons) -> dispo sur Google Fonts.
  * Bleu primaire  #007bff (couleur de marque, liens, accents)
  * Jaune secondaire #ffcc00
  * Rouge CTA #de1414 (boutons d'action principaux)
  * Navy #003f71 / Slate #44596b (textes) ; dégradé violet #667eea->#764ba2
- Ton de marque : amical, voyage, légèrement ludique (émojis de section), FR.
=> Règles d'application définies (bleu dominant pour les graphes, rouge réservé
   à une seule action, cartes blanches arrondies, note contraste sur le jaune).

-------------------------------------------------------------------------------
ÉTAPE 4 — Features à valeur ajoutée (créativité + autonomie)
-------------------------------------------------------------------------------
Au-delà des stats demandées, 2 features choisies car elles collent au métier et
au titre du poste (« IA & Automatisation ») :
  1. « Trouveur de la meilleure eSIM » : mini-comparateur interactif (destination
     -> meilleur forfait toutes marques, tri par prix / €Go / data). Reproduit le
     coeur de métier de MyBestSim à partir des données.
  2. « Santé des imports » : audit auto des 18 CSV (lignes, valeurs manquantes,
     doublons SKU, devise, outliers de prix). Répond directement au volet
     « Automatisation » (détecter les données corrompues avant mise en ligne).

-------------------------------------------------------------------------------
ÉTAPE 5 — Rédaction du cahier des charges professionnel (handoff)
-------------------------------------------------------------------------------
Décision produit : je ne code pas le dashboard dans cette session ; je produis
une SPEC complète et professionnelle (dashboard-brief.md) qui relie le front
(identité MyBestSim) aux données (champs, calculs, valeurs vérifiées) + les 2
features. Objectif : pouvoir faire construire le dashboard par un autre outil IA
de façon fiable et reproductible.

Livrables générés dans le dossier du projet :
  - dashboard-brief.md .... cahier des charges complet (données + marque + features)
  - build_data.py ......... script de normalisation des 18 CSV
  - data.json ............. données normalisées (stats agrégées + 5056 lignes)
  - rapport.text .......... le présent journal de méthodologie

-------------------------------------------------------------------------------
ÉTAPE 6 — Intégration des données dans le frontend (Partie 1 fonctionnelle)
-------------------------------------------------------------------------------
Contexte : un frontend a été généré (projet Lovable « pixel-perfect-23 » :
TanStack Start + React 19 + Vite + Tailwind v4 + shadcn/ui, police Poppins,
couleurs MyBestSim). Il affichait par défaut des valeurs de référence codées en
dur et n'affichait les vraies données QUE si l'utilisateur importait manuellement
les CSV (l'explorateur restait vide au chargement).

Objectif : rendre la Partie 1 réellement fonctionnelle (le dashboard doit LIRE
les données et marcher via un simple lien, sans action manuelle).

Ce que j'ai fait faire à l'IA :
- Génération d'un fichier public/catalog.json (les 5056 lignes normalisées,
  construites directement depuis les 18 CSV, champ data_display inclus, ~1,28 Mo).
- Modification de src/routes/index.tsx :
  * chargement automatique de /catalog.json au démarrage (useEffect) -> les KPIs,
    graphiques ET l'explorateur affichent les vraies données calculées, sans import.
  * conservation de l'import manuel comme surcharge (re-tester avec d'autres CSV).
  * libellé du bouton adapté selon la source (référence / catalogue / CSV importés).
- Les statistiques sont recalculées côté client par computeStats() à partir des
  vraies lignes (et non plus des constantes), ce qui prouve que le pipeline tourne.

ÉTAPE 6 (suite) — Vérification de la Partie 1
- npm install (331 paquets) OK.
- Serveur de dev (npm run dev) : page d'accueil HTTP 200, dashboard rendu
  (KPIs, graphiques, explorateur), /catalog.json servi (5056 lignes).
- Test automatisé ajouté (src/test/catalog-stats.test.ts) : computeStats() sur
  le vrai catalogue == valeurs de référence. 5/5 tests OK (dont over100=56,
  min 5,36 / max 154,63, prix moyen ~29,30, data moyenne ~14,49, 653 illimités,
  3,17 €/Go, 4G 3302 / 5G 1754, 54 destinations, Airalo 722 en tête).
- npm run build : build de production OK (cible Cloudflare), catalog.json présent
  dans .output/public/ => dashboard déployable en ligne tel quel.

CONCLUSION PARTIE 1 : le dashboard lit réellement les données des 18 CSV, calcule
les stats côté client, et fonctionne via un simple lien, sans import manuel.
Reste à faire (optionnel/bonus) : les 2 features « Meilleure eSIM » et « Santé des
imports » décrites dans dashboard-brief.md ; puis le déploiement en ligne.

-------------------------------------------------------------------------------
ÉTAPE 7 — Feature « Santé des imports » (volet Automatisation)
-------------------------------------------------------------------------------
Objectif : rendre concret le « Automatisation » du poste = contrôler la qualité
des CSV à chaque import quotidien et bloquer les données corrompues avant mise
en ligne.

Implémentation :
- src/lib/catalog.ts : fonction auditRows() qui rejoue automatiquement une série
  de contrôles sur les lignes chargées :
  * champs clés manquants (sku, fournisseur, destination, nom produit)   -> ERREUR
  * prix invalides (<= 0)                                                 -> ERREUR
  * devises non EUR                                                       -> ERREUR
  * doublons de SKU                                                       -> alerte
  * validité invalide (<= 0 j)                                            -> alerte
  * réseau hors {4G, 5G}                                                  -> alerte
  * prix/Go aberrants (règle robuste médiane + 6·MAD)                     -> alerte
  * forfaits illimités détectés et comptés à part                        -> info
  + statut global : « Prêt à publier » / « À surveiller » / « À corriger ».
- src/routes/index.tsx : panneau visuel « Santé des imports » (bandeau de statut
  + grille de contrôles colorés), recalculé à chaque import.
- Tests (src/test/catalog-stats.test.ts) : 0 erreur sur le vrai catalogue +
  détection d'anomalies injectées (doublon, prix 0, devise USD, réseau 3G).
  Total 7/7 tests OK. Build de production OK. Panneau rendu (HTTP 200).

-------------------------------------------------------------------------------
ÉTAPE 8 — Mise au propre de l'architecture du projet
-------------------------------------------------------------------------------
Objectif : une arborescence et des noms professionnels, prêts à être rendus.

Réorganisation :
  data/providers/        <- donnees-test-mybestsim/ (les 18 CSV sources)
  scripts/build_catalog.py <- build_data.py (réécrit : lit data/providers, écrit
                              dashboard/public/catalog.json, affiche les stats)
  docs/dashboard-spec.md <- dashboard-brief.md
  docs/methodologie.md   <- rapport.text (ce fichier)
  docs/recruitment-test.pdf <- le PDF du sujet
  README.md              <- nouveau : vue d'ensemble + prise en main
  dashboard/             <- (à renommer depuis pixel-perfect-23 dans VS Code ;
                             bloqué en externe car VS Code tient le dossier .git)

Vérification : scripts/build_catalog.py régénère un catalog.json IDENTIQUE à la
version précédente (diff vide), stats conformes (5056, 56, 5,36–154,63, 29,30,
14,49, 653, 3,17, 54 destinations). Le code et les tests fonctionnent quel que
soit le nom du dossier de l'app.

