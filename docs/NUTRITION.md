# Module Nutrition

Suivi des calories et des nutriments, adossé à de vraies bases de données
alimentaires ouvertes.

> **Cronometer n'expose aucune API publique.** C'est une application fermée,
> dont les données viennent de la base NCCDB (Nutrition Coordinating Center)
> et d'USDA sous licence. Il est donc impossible de « se connecter à
> Cronometer ». Ce module s'appuie sur les équivalents ouverts et gratuits
> qui couvrent les mêmes besoins.

---

## 1. Sources de données

| Source | Couverture | Clé API | Rôle |
|---|---|---|---|
| **Base locale vibes-arc** | 140 aliments, dont staples d'Afrique de l'Ouest et du Centre | aucune | Référence instantanée, hors-ligne |
| **Open Food Facts** | Plusieurs millions de produits emballés, codes-barres | aucune | Produits de marque |
| **USDA FoodData Central** | Aliments bruts et génériques, 30+ micronutriments | [gratuite](https://fdc.nal.usda.gov/api-key-signup.html) | Précision nutritionnelle |

Les trois sources sont interrogées **en parallèle** et fusionnées : la base
locale s'affiche immédiatement, les sources distantes enrichissent ensuite la
liste. Une source indisponible produit un avertissement, jamais une erreur
bloquante.

### Attribution

Les données Open Food Facts sont publiées sous
[licence ODbL](https://opendatacommons.org/licenses/odbl/1.0/) — l'attribution
est affichée dans l'interface (badge de source sur chaque aliment).

### Pourquoi un proxy serveur pour Open Food Facts

Le navigateur ne peut pas appeler `search.openfoodfacts.org` directement :
ce domaine ne renvoie **aucun en-tête CORS**. Les requêtes passent donc par
`/api/nutrition/off-search` et `/api/nutrition/off-product`, ce qui permet en
plus :

- d'envoyer le `User-Agent` identifiant l'application, demandé par les
  [conditions d'usage d'OFF](https://world.openfoodfacts.org/terms-of-use) ;
- de mettre les réponses en cache CDN et ainsi ménager une infrastructure
  associative gratuite.

Le proxy ne transforme rien : il relaie le JSON brut, que le client normalise.

---

## 2. Mise en place

### 2.1 Appliquer la migration Supabase

```bash
supabase db push          # ou appliquer le fichier manuellement
```

Fichier : `supabase/migrations/20260922_nutrition_module.sql`

Il crée deux tables avec RLS (chaque utilisateur ne voit que ses données) :

- `nutrition_profiles` — profil et surcharges de cibles (une ligne par utilisateur)
- `food_entries` — journal alimentaire, avec **instantané nutritionnel** par ligne

> Sans migration, le module reste utilisable : il bascule automatiquement en
> mode hors-ligne (badge « Hors-ligne ») et stocke tout dans le navigateur.

### 2.2 Activer USDA (optionnel)

1. Obtenir une clé gratuite : <https://fdc.nal.usda.gov/api-key-signup.html>
2. Ajouter dans `.env.local` (local) **et** dans les variables d'environnement
   Vercel (production) :

   ```
   USDA_API_KEY="ta-clé"
   ```

   ⚠️ **Jamais** de préfixe `VITE_` : la clé resterait côté serveur.

3. Redémarrer le serveur de dev. L'onglet Nutrition indique les sources
   actives via `GET /api/nutrition/status`.

Sans clé, tout fonctionne sauf les aliments bruts génériques (riz, légumes,
viandes…) — un message l'indique dans la recherche.

---

## 3. Architecture

```
src/types/nutrition.ts                   Modèle de données + 42 définitions de nutriments
src/data/localFoodSeeds.ts               Données brutes (valeurs pour 100 g)
src/data/commonFoods.ts                  Validation + conversion en FoodItem

src/services/nutrition/
  nutrientDefs (dans types)              Unités canoniques par nutriment
  nutritionGoals.ts                      BMR → TDEE → cible, macros, DRI
  nutritionMath.ts                       Mise à l'échelle, agrégation, progression
  openFoodFacts.ts                       Adaptateur OFF (mapping + conversions)
  foodSearchService.ts                   Fusion multi-sources, dédoublonnage, cache
  nutritionLocalStore.ts                 Cache localStorage (repli hors-ligne)

api/nutrition/
  _off.ts                                Proxy OFF partagé (serverless + dev)
  _usda.ts                               USDA + normalisation (clé côté serveur)
  off-search.ts / off-product.ts         Fonctions Vercel
  search.ts / status.ts                  USDA + état des sources

src/components/nutrition/
  NutritionView.tsx                      Journal, bandeau du jour, repas
  FoodSearchPanel.tsx                    Recherche, portions, code-barres
  NutritionGoalsPanel.tsx                Profil + chaîne de calcul + surcharges
  NutrientLedger.tsx                     « L'étiquette » — rapport nutritionnel
```

### Deux décisions structurantes

**Unités canoniques.** Chaque nutriment a une unité de stockage unique
(kcal, g, mg ou µg), déclarée dans `NUTRIENT_DEFS`. Les adaptateurs convertissent
à l'ingestion. Open Food Facts exprime **tout en grammes** pour 100 g — le
calcium de l'emmental vaut `0.97`, soit 970 mg. C'est la source d'erreur la plus
fréquente dans ce type d'intégration, et elle est silencieuse : elle fausse tous
les totaux sans jamais planter.

**Instantané par ligne du journal.** Chaque entrée fige les valeurs
nutritionnelles au moment de la saisie. Si Open Food Facts corrige une fiche
plus tard, l'historique de l'utilisateur ne change pas.

---

## 4. Calcul des objectifs

```
Métabolisme de base        Mifflin-St Jeor (ou Katch-McArdle si % de graisse connu)
        × facteur d'activité      1,2 → 1,9
= Dépense énergétique totale
        ± ajustement objectif     1 kg ≈ 7 700 kcal, réparti sur 7 jours
= Cible calorique du jour     (plancher de sécurité : 1 200 kcal F / 1 500 kcal H)

Répartition macro (% des calories, ajustable)
  + plancher protéique : 1,6 g/kg en perte et prise, 1,2 g/kg en maintien

Micronutriments : DRI adultes (IOM/ANSES), modulés par sexe et âge
  Fibres  14 g / 1 000 kcal
  Eau     35 ml / kg
  Plafonds : sodium 2 300 mg, sucres ajoutés < 10 % énergie, AG saturés < 10 %
```

Chaque cible est surchargeable manuellement, sans casser le calcul des autres.

### Code couleur du rapport nutritionnel

| Couleur | Signification |
|---|---|
| Vert | ≥ 100 % de la cible — couvert |
| Ambre | 50–99 % — à compléter |
| Ardoise | < 50 % — reste à couvrir, ce n'est pas une erreur |
| Rouge | Plafond dépassé — le seul état réellement actionnable |

Le rouge est réservé aux dépassements de plafond : à 8 h du matin, être à 25 %
de sa cible de protéines est normal.

Les nutriments qu'aucun aliment saisi ne renseigne s'affichent « — » et non
« 0 % » : une donnée absente n'est pas un apport nul.

---

## 5. Vérification

```bash
npm run test:nutrition   # 65 vérifications : formules, DRI, conversions OFF, données réelles
npm run verify:foods     # contrôle qualité de la base locale (unités, Atwater, structure)
```

`test:nutrition` vérifie notamment les conversions d'unités contre des valeurs
calculées à la main, et interroge réellement Open Food Facts.

`verify:foods` traque les erreurs d'unité (calcium saisi en grammes plutôt qu'en
milligrammes) et les incohérences énergétiques, en testant les deux conventions
de glucides en vigueur (USDA « fibres incluses » et CIQUAL « glucides
disponibles »).

---

## 6. Limites connues et honnêteté des données

- **La base locale est indicative.** La composition réelle d'un aliment varie
  selon la variété, le sol, la saison et le mode de cuisson. Lorsqu'une valeur
  n'était pas suffisamment fiable, elle est **volontairement omise** plutôt
  qu'estimée : l'application l'affiche comme non renseignée.
- **Les plats composés** (`plats-prepares` : mafé, yassa, ndolé, thieboudienne…)
  sont des moyennes approchées — seuls énergie et macronutriments sont fournis.
- **Les aliments d'Afrique de l'Ouest** non couverts par l'USDA (attiéké, fonio,
  voandzou, safou, folon…) sont les entrées les moins certaines : elles
  s'appuient sur les tables FAO, dont la dispersion est large.
- **Vitamine A de l'huile de palme rouge et des feuilles de manioc** : omise
  volontairement (fourchette trop large pour publier un chiffre unique).
- **Les valeurs USDA sont majoritairement américaines.** Pour un produit
  français ou africain précis, la recherche Open Food Facts est plus fiable.
- Ce module est un outil de suivi, **pas un dispositif médical**. En cas de
  grossesse, de maladie chronique ou de traitement, demander conseil à un
  professionnel de santé.
