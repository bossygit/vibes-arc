/**
 * Base locale d'aliments — valeurs de référence indicatives.
 *
 * ⚠️ UNITÉS ET PÉRIMÈTRE
 * Toutes les valeurs portent sur **100 g d'aliment** (ou **100 ml** pour les
 * boissons, signalées par `basis: 'ml'`), pour la **partie comestible, telle
 * que consommée** : les aliments dont le nom contient « cuit » portent des
 * valeurs après cuisson, jamais des valeurs crues.
 *
 * ⚠️ CONVENTION SUR LES GLUCIDES
 * `carbs` = glucides **totaux, fibres incluses** (convention USDA / FoodData
 * Central « carbohydrate by difference »), les fibres étant fournies en plus
 * dans `fiber`. C'est la convention de la plupart des bases de données
 * internationales ; elle surestime légèrement les glucides « nets » des
 * aliments très riches en fibres (oléagineux, son, pulpe de baobab).
 *
 * ⚠️ UNITÉS DES NUTRIMENTS (unités canoniques de l'application)
 * - `energy` : kcal
 * - protéines, glucides, lipides, fibres, sucres, `addedSugars`, acides gras
 *   (`saturatedFat`, `monounsaturatedFat`, `polyunsaturatedFat`, `transFat`,
 *   `omega3`, `omega6`), `water`, `alcohol` : **grammes**
 * - `cholesterol`, `sodium`, `potassium`, `calcium`, `iron`, `magnesium`,
 *   `phosphorus`, `zinc`, `copper`, `manganese`, `vitaminC`, `vitaminE`,
 *   `thiamin`, `riboflavin`, `niacin`, `pantothenicAcid`, `vitaminB6`,
 *   `choline`, `caffeine` : **milligrammes**
 * - `selenium`, `iodine`, `vitaminA`, `vitaminD`, `vitaminK`, `biotin`,
 *   `folate`, `vitaminB12` : **microgrammes**
 *
 * ⚠️ HONNÊTETÉ DES DONNÉES
 * Ces valeurs sont **indicatives** : la composition réelle d'un aliment varie
 * selon la variété, le sol, la saison, le mode de cuisson et la recette.
 * Lorsqu'une valeur n'était pas suffisamment fiable, la clé correspondante est
 * **volontairement omise** — l'application l'affiche alors comme
 * « non renseigné ». Une valeur absente vaut mieux qu'une valeur inventée.
 * Les plats composés (`plats-prepares`) sont des **moyennes approchées** :
 * seuls l'énergie et les macronutriments (plus les fibres) y sont fournis.
 * Les aliments frits (alloco) et les aliments fumés/séchés varient fortement
 * selon la quantité d'huile absorbée ou le degré de séchage.
 *
 * SOURCES (familles de tables de composition de référence)
 * - USDA Agricultural Research Service, SR Legacy / FoodData Central
 * - CIQUAL / ANSES (table de composition nutritionnelle des aliments, France)
 * - FAO / INFOODS, West African Food Composition Table et
 *   « Food Composition Table for Use in Africa » (FAO)
 *
 * Les aliments d'Afrique de l'Ouest et du Centre sont volontairement
 * sur-représentés (contexte FCFA / Afrique francophone).
 */

export interface LocalFoodSeed {
    /** identifiant url-safe unique, en minuscules, ex: 'riz-blanc-cuit' */
    slug: string;
    /** nom affiché en français, ex: 'Riz blanc, cuit' */
    name: string;
    /** une seule des catégories listées ci-dessous */
    category: LocalFoodCategory;
    /** 'ml' uniquement pour les boissons, sinon omis (= 'g') */
    basis?: 'ml';
    /** nutriments POUR 100 g (ou 100 ml), voir la liste des clés autorisées */
    n: Record<string, number>;
    /** portions courantes, optionnel mais utile */
    servings?: { label: string; grams: number }[];
}

export type LocalFoodCategory =
    | 'cereales' | 'tubercules' | 'legumineuses' | 'legumes' | 'fruits'
    | 'viandes' | 'poissons' | 'oeufs' | 'laitiers' | 'matieres-grasses'
    | 'oleagineux' | 'boissons' | 'condiments' | 'plats-prepares';

export const LOCAL_FOOD_SEEDS: LocalFoodSeed[] = [
    /* ------------------------------------------------------------------ */
    /* CÉRÉALES                                                            */
    /* ------------------------------------------------------------------ */
    {
        slug: 'riz-blanc-cuit',
        name: 'Riz blanc, cuit',
        category: 'cereales',
        n: {
            energy: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugars: 0.1,
            water: 68.4, calcium: 10, iron: 0.2, magnesium: 12, phosphorus: 43,
            potassium: 35, zinc: 0.4, sodium: 1, thiamin: 0.02, niacin: 0.4,
        },
        servings: [{ label: '1 bol', grams: 150 }, { label: '1 assiette', grams: 250 }],
    },
    {
        slug: 'riz-complet-cuit',
        name: 'Riz complet, cuit',
        category: 'cereales',
        n: {
            energy: 123, protein: 2.7, carbs: 25.6, fat: 1, fiber: 1.6, sugars: 0.2,
            water: 68.5, calcium: 3, iron: 0.6, magnesium: 39, phosphorus: 77,
            potassium: 79, zinc: 0.6, sodium: 4, thiamin: 0.1, riboflavin: 0.01,
            niacin: 1.5, vitaminB6: 0.1, folate: 4,
        },
        servings: [{ label: '1 bol', grams: 150 }, { label: '1 assiette', grams: 250 }],
    },
    {
        slug: 'attieke',
        name: 'Attiéké (semoule de manioc fermentée), cuit',
        category: 'cereales',
        n: {
            energy: 156, protein: 1.5, carbs: 36, fat: 0.5, fiber: 1.6, water: 60,
            calcium: 12, iron: 0.6, potassium: 120, sodium: 8,
        },
        servings: [{ label: '1 bol', grams: 150 }, { label: '1 portion', grams: 250 }],
    },
    {
        slug: 'fonio-cuit',
        name: 'Fonio, cuit',
        category: 'cereales',
        n: {
            energy: 120, protein: 2.6, carbs: 27, fat: 0.6, fiber: 1, water: 70,
            calcium: 9, potassium: 45, sodium: 2,
        },
        servings: [{ label: '1 bol', grams: 150 }],
    },
    {
        slug: 'mil-bouillie',
        name: 'Bouillie de mil (latchiri / sadza)',
        category: 'cereales',
        n: {
            energy: 62, protein: 1.6, carbs: 13, fat: 0.6, fiber: 0.6, water: 84,
            calcium: 6, iron: 0.5,
        },
        servings: [{ label: '1 bol', grams: 250 }, { label: '1 louche', grams: 150 }],
    },
    {
        slug: 'mil-grain-cuit',
        name: 'Mil (petit mil), grain cuit',
        category: 'cereales',
        n: {
            energy: 119, protein: 3.5, carbs: 23.7, fat: 1, fiber: 1.3, water: 71.4,
            calcium: 3, iron: 0.6, magnesium: 44, phosphorus: 100, potassium: 62,
            zinc: 0.9, sodium: 2, thiamin: 0.11, riboflavin: 0.08, niacin: 1.3,
            vitaminB6: 0.11, folate: 19,
        },
        servings: [{ label: '1 bol', grams: 150 }],
    },
    {
        slug: 'sorgho-cuit',
        name: 'Sorgho, grain cuit',
        category: 'cereales',
        n: {
            energy: 115, protein: 3.5, carbs: 24.5, fat: 1.2, fiber: 2.1, water: 71,
            calcium: 9, iron: 1.1, magnesium: 55, phosphorus: 117, potassium: 121,
            zinc: 0.6, sodium: 3, thiamin: 0.1, niacin: 0.9,
        },
        servings: [{ label: '1 bol', grams: 150 }],
    },
    {
        slug: 'mais-frais-cuit',
        name: 'Maïs doux frais, cuit',
        category: 'cereales',
        n: {
            energy: 96, protein: 3.4, carbs: 21, fat: 1.5, fiber: 2.4, sugars: 4.5,
            water: 73.4, calcium: 2, iron: 0.5, magnesium: 26, phosphorus: 77,
            potassium: 218, zinc: 0.6, sodium: 1, vitaminC: 5.5, thiamin: 0.09,
            niacin: 1.7, folate: 23,
        },
        servings: [{ label: '1 épi', grams: 90 }],
    },
    {
        slug: 'mais-concasse',
        name: 'Maïs concassé, cuit',
        category: 'cereales',
        n: {
            energy: 120, protein: 2.7, carbs: 25.6, fat: 1.2, fiber: 2.4, water: 70,
            calcium: 2, iron: 1.1, magnesium: 31, phosphorus: 72, potassium: 95,
            zinc: 0.6, sodium: 2,
        },
        servings: [{ label: '1 bol', grams: 150 }],
    },
    {
        slug: 'couscous-semoule-cuit',
        name: 'Semoule de couscous, cuite',
        category: 'cereales',
        n: {
            energy: 112, protein: 3.8, carbs: 23.2, fat: 0.2, fiber: 1.4, water: 72.6,
            calcium: 8, iron: 0.4, magnesium: 8, phosphorus: 22, potassium: 58,
            zinc: 0.3, sodium: 5, thiamin: 0.06, niacin: 1, folate: 15,
        },
        servings: [{ label: '1 assiette', grams: 200 }],
    },
    {
        slug: 'pates-cuites',
        name: 'Pâtes alimentaires, cuites',
        category: 'cereales',
        n: {
            energy: 158, protein: 5.8, carbs: 30.9, fat: 0.9, fiber: 1.8, sugars: 0.6,
            water: 62.1, calcium: 7, iron: 0.5, magnesium: 18, phosphorus: 58,
            potassium: 44, zinc: 0.5, sodium: 1, selenium: 26, thiamin: 0.17,
            riboflavin: 0.07, niacin: 1.3, folate: 62,
        },
        servings: [{ label: '1 assiette', grams: 220 }],
    },
    {
        slug: 'pain-baguette',
        name: 'Pain baguette',
        category: 'cereales',
        n: {
            energy: 274, protein: 8.4, carbs: 55.6, fat: 1.5, fiber: 2.8, sugars: 2.6,
            water: 29.5, calcium: 30, iron: 0.9, magnesium: 25, phosphorus: 100,
            potassium: 130, zinc: 0.8, sodium: 590, thiamin: 0.11, niacin: 1.5,
        },
        servings: [
            { label: '1/4 de baguette', grams: 60 },
            { label: '1/2 baguette', grams: 125 },
        ],
    },
    {
        slug: 'pain-complet',
        name: 'Pain complet',
        category: 'cereales',
        n: {
            energy: 249, protein: 8.6, carbs: 43.5, fat: 1.6, fiber: 6.3, sugars: 2.2,
            water: 36, calcium: 40, iron: 2, magnesium: 65, phosphorus: 180,
            potassium: 230, zinc: 1.4, sodium: 540, thiamin: 0.2, niacin: 2.5,
        },
        servings: [{ label: '1 tranche', grams: 40 }],
    },
    {
        slug: 'flocons-avoine',
        name: "Flocons d'avoine",
        category: 'cereales',
        n: {
            energy: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, sugars: 1,
            water: 8.2, calcium: 54, iron: 4.7, magnesium: 177, phosphorus: 523,
            potassium: 429, zinc: 4, copper: 0.6, manganese: 4.9, selenium: 29,
            sodium: 2, thiamin: 0.76, riboflavin: 0.14, niacin: 1, vitaminB6: 0.12,
            folate: 56, pantothenicAcid: 1.35,
        },
        servings: [{ label: '1 bol', grams: 40 }, { label: '1 portion', grams: 60 }],
    },
    {
        slug: 'tapioca',
        name: 'Tapioca (perles), cuit',
        category: 'cereales',
        n: {
            energy: 140, protein: 0.2, carbs: 34.5, fat: 0.1, fiber: 0.3, water: 65,
            calcium: 8, iron: 0.3, potassium: 5, sodium: 3,
        },
        servings: [{ label: '1 bol', grams: 150 }],
    },
    {
        slug: 'gari',
        name: 'Gari (semoule de manioc grillée)',
        category: 'cereales',
        n: {
            energy: 355, protein: 1.3, carbs: 85, fat: 0.5, fiber: 2, water: 8,
            calcium: 20, iron: 1, potassium: 200, sodium: 5,
        },
        servings: [{ label: '1 bol', grams: 100 }],
    },

    /* ------------------------------------------------------------------ */
    /* TUBERCULES                                                          */
    /* ------------------------------------------------------------------ */
    {
        slug: 'igname-cuite',
        name: 'Igname, cuite',
        category: 'tubercules',
        n: {
            energy: 116, protein: 1.5, carbs: 27.5, fat: 0.1, fiber: 3.9, sugars: 0.5,
            water: 70.6, calcium: 14, iron: 0.5, magnesium: 18, phosphorus: 49,
            potassium: 670, zinc: 0.2, sodium: 8, vitaminC: 12, thiamin: 0.09,
            riboflavin: 0.03, niacin: 0.55, vitaminB6: 0.22, folate: 16,
        },
        servings: [{ label: '1 portion', grams: 200 }],
    },
    {
        slug: 'manioc-cuit',
        name: 'Manioc (racine), cuit',
        category: 'tubercules',
        n: {
            energy: 125, protein: 1, carbs: 29.5, fat: 0.2, fiber: 1.4, water: 68,
            calcium: 12, iron: 0.2, magnesium: 16, phosphorus: 20, potassium: 180,
            zinc: 0.3, sodium: 10, vitaminC: 12, thiamin: 0.05, riboflavin: 0.03,
            niacin: 0.5, folate: 15,
        },
        servings: [{ label: '1 portion', grams: 200 }],
    },
    {
        slug: 'plantain-mur-cuit',
        name: 'Plantain mûr, cuit',
        category: 'tubercules',
        n: {
            energy: 116, protein: 1.2, carbs: 31, fat: 0.2, fiber: 2.3, sugars: 14,
            water: 66, calcium: 3, iron: 0.5, magnesium: 32, phosphorus: 28,
            potassium: 465, zinc: 0.1, sodium: 4, vitaminC: 11.5, thiamin: 0.05,
            riboflavin: 0.05, niacin: 0.6, vitaminB6: 0.24, folate: 20,
        },
        servings: [{ label: '1 plantain moyen', grams: 180 }],
    },
    {
        slug: 'alloco',
        name: 'Alloco (plantain mûr frit)',
        category: 'tubercules',
        n: {
            energy: 240, protein: 1.4, carbs: 36, fat: 9.5, fiber: 2.3, water: 50,
            calcium: 5, iron: 0.5, magnesium: 27, potassium: 400, sodium: 5,
            vitaminC: 5,
        },
        servings: [{ label: '1 portion', grams: 150 }],
    },
    {
        slug: 'patate-douce-cuite',
        name: 'Patate douce, cuite à l\u2019eau',
        category: 'tubercules',
        n: {
            energy: 76, protein: 1.4, carbs: 17.7, fat: 0.1, fiber: 2.5, sugars: 5.7,
            water: 77, calcium: 27, iron: 0.7, magnesium: 18, phosphorus: 32,
            potassium: 230, zinc: 0.2, sodium: 27, vitaminC: 13, vitaminA: 787,
            thiamin: 0.06, riboflavin: 0.05, niacin: 0.6, vitaminB6: 0.17, folate: 6,
        },
        servings: [{ label: '1 portion', grams: 200 }],
    },
    {
        slug: 'pomme-de-terre-cuite',
        name: 'Pomme de terre, cuite à l\u2019eau',
        category: 'tubercules',
        n: {
            energy: 87, protein: 1.9, carbs: 20, fat: 0.1, fiber: 1.8, sugars: 0.9,
            water: 77, calcium: 8, iron: 0.3, magnesium: 22, phosphorus: 44,
            potassium: 379, zinc: 0.3, sodium: 4, vitaminC: 13, thiamin: 0.1,
            riboflavin: 0.02, niacin: 1.3, vitaminB6: 0.27, folate: 10,
        },
        servings: [{ label: '1 pomme de terre moyenne', grams: 150 }],
    },
    {
        slug: 'taro-cuit',
        name: 'Taro (macabo), cuit',
        category: 'tubercules',
        n: {
            energy: 142, protein: 0.5, carbs: 34.6, fat: 0.1, fiber: 5.1, sugars: 0.5,
            water: 63.8, calcium: 18, iron: 0.7, magnesium: 30, phosphorus: 76,
            potassium: 484, zinc: 0.2, sodium: 15, vitaminC: 5, thiamin: 0.1,
            riboflavin: 0.03, niacin: 0.5, vitaminB6: 0.28, folate: 19,
            vitaminE: 2.9, copper: 0.2, manganese: 0.45,
        },
        servings: [{ label: '1 portion', grams: 200 }],
    },
    {
        slug: 'couscous-de-manioc',
        name: 'Couscous de manioc (gari réhydraté)',
        category: 'tubercules',
        n: {
            energy: 145, protein: 0.6, carbs: 34, fat: 0.3, fiber: 1, water: 63,
            calcium: 8, iron: 0.5, potassium: 90, sodium: 3,
        },
        servings: [{ label: '1 bol', grams: 180 }],
    },
    {
        slug: 'fruit-a-pain-cuit',
        name: 'Fruit à pain, cuit',
        category: 'tubercules',
        n: {
            energy: 100, protein: 1, carbs: 26, fat: 0.2, fiber: 4.5, water: 72,
            calcium: 15, iron: 0.5, magnesium: 22, phosphorus: 28, potassium: 440,
            vitaminC: 20, thiamin: 0.1, niacin: 0.8,
        },
        servings: [{ label: '1 portion', grams: 200 }],
    },

    /* ------------------------------------------------------------------ */
    /* LÉGUMINEUSES                                                        */
    /* ------------------------------------------------------------------ */
    {
        slug: 'niebe-cuit',
        name: 'Niébé (haricot à œil noir), cuit',
        category: 'legumineuses',
        n: {
            energy: 116, protein: 7.7, carbs: 20.8, fat: 0.5, fiber: 6.5, water: 70.4,
            calcium: 24, iron: 2.5, magnesium: 53, phosphorus: 156, potassium: 278,
            zinc: 1.3, sodium: 4, thiamin: 0.2, riboflavin: 0.06, niacin: 0.5,
            vitaminB6: 0.1, folate: 128, copper: 0.3, manganese: 0.5,
        },
        servings: [{ label: '1 bol', grams: 200 }],
    },
    {
        slug: 'haricots-rouges-cuits',
        name: 'Haricots rouges, cuits',
        category: 'legumineuses',
        n: {
            energy: 127, protein: 8.7, carbs: 22.8, fat: 0.5, fiber: 6.4, water: 66.9,
            calcium: 28, iron: 2.9, magnesium: 45, phosphorus: 142, potassium: 403,
            zinc: 1.1, sodium: 2, thiamin: 0.16, riboflavin: 0.06, niacin: 0.6,
            vitaminB6: 0.12, folate: 130, copper: 0.2, manganese: 0.5,
        },
        servings: [{ label: '1 bol', grams: 200 }],
    },
    {
        slug: 'lentilles-cuites',
        name: 'Lentilles, cuites',
        category: 'legumineuses',
        n: {
            energy: 116, protein: 9, carbs: 20.1, fat: 0.4, fiber: 7.9, water: 69.6,
            calcium: 19, iron: 3.3, magnesium: 36, phosphorus: 180, potassium: 369,
            zinc: 1.3, sodium: 2, thiamin: 0.17, riboflavin: 0.07, niacin: 1.1,
            vitaminB6: 0.18, folate: 181, copper: 0.25, manganese: 0.5,
        },
        servings: [{ label: '1 bol', grams: 200 }],
    },
    {
        slug: 'pois-chiches-cuits',
        name: 'Pois chiches, cuits',
        category: 'legumineuses',
        n: {
            energy: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, sugars: 4.8,
            water: 60.2, calcium: 49, iron: 2.9, magnesium: 48, phosphorus: 168,
            potassium: 291, zinc: 1.5, sodium: 7, thiamin: 0.12, riboflavin: 0.06,
            niacin: 0.5, vitaminB6: 0.14, folate: 172, copper: 0.35, manganese: 1,
        },
        servings: [{ label: '1 bol', grams: 200 }],
    },
    {
        slug: 'voandzou-cuit',
        name: 'Voandzou (pois bambara), cuit',
        category: 'legumineuses',
        n: {
            energy: 130, protein: 6.5, carbs: 21, fat: 2.3, fiber: 4, water: 68,
            calcium: 30, iron: 1.5, magnesium: 55, potassium: 350, sodium: 5,
        },
        servings: [{ label: '1 bol', grams: 200 }],
    },
    {
        slug: 'soja-cuit',
        name: 'Soja, grain cuit',
        category: 'legumineuses',
        n: {
            energy: 172, protein: 18.2, carbs: 8.4, fat: 9, fiber: 6, sugars: 3,
            water: 62.5, calcium: 102, iron: 5.1, magnesium: 86, phosphorus: 245,
            potassium: 515, zinc: 1.2, sodium: 1, thiamin: 0.16, riboflavin: 0.29,
            niacin: 0.4, vitaminB6: 0.23, folate: 54, copper: 0.4, manganese: 0.8,
            selenium: 7.3, vitaminK: 19.2,
        },
        servings: [{ label: '1 bol', grams: 180 }],
    },
    {
        slug: 'nere-fermente',
        name: 'Néré fermenté (soumbala)',
        category: 'legumineuses',
        n: {
            energy: 340, protein: 34, carbs: 24, fat: 13, fiber: 6.5,
            calcium: 280, iron: 8.5,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 15 }],
    },
    {
        slug: 'pois-casses-cuits',
        name: 'Pois cassés, cuits',
        category: 'legumineuses',
        n: {
            energy: 118, protein: 8.3, carbs: 21.1, fat: 0.4, fiber: 8.3, water: 69.5,
            calcium: 14, iron: 1.3, magnesium: 33, phosphorus: 99, potassium: 362,
            zinc: 1, sodium: 2, thiamin: 0.19, riboflavin: 0.06, niacin: 0.9,
            folate: 65,
        },
        servings: [{ label: '1 bol', grams: 200 }],
    },

    /* ------------------------------------------------------------------ */
    /* LÉGUMES                                                             */
    /* ------------------------------------------------------------------ */
    {
        slug: 'tomate',
        name: 'Tomate, fraîche',
        category: 'legumes',
        n: {
            energy: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugars: 2.6,
            water: 94.5, calcium: 10, iron: 0.3, magnesium: 11, phosphorus: 24,
            potassium: 237, zinc: 0.2, sodium: 5, vitaminC: 14, vitaminA: 42,
            thiamin: 0.04, riboflavin: 0.02, niacin: 0.6, vitaminB6: 0.08,
            folate: 15, vitaminE: 0.5, vitaminK: 7.9,
        },
        servings: [{ label: '1 tomate moyenne', grams: 120 }],
    },
    {
        slug: 'oignon',
        name: 'Oignon, frais',
        category: 'legumes',
        n: {
            energy: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sugars: 4.2,
            water: 89.1, calcium: 23, iron: 0.2, magnesium: 10, phosphorus: 29,
            potassium: 146, zinc: 0.2, sodium: 4, vitaminC: 7.4, thiamin: 0.05,
            riboflavin: 0.03, niacin: 0.1, vitaminB6: 0.12, folate: 19,
        },
        servings: [{ label: '1 oignon moyen', grams: 100 }],
    },
    {
        slug: 'gombo',
        name: 'Gombo (okra), frais',
        category: 'legumes',
        n: {
            energy: 33, protein: 1.9, carbs: 7.5, fat: 0.2, fiber: 3.2, sugars: 1.5,
            water: 89.6, calcium: 82, iron: 0.6, magnesium: 57, phosphorus: 61,
            potassium: 299, zinc: 0.6, sodium: 7, vitaminC: 23, vitaminA: 36,
            thiamin: 0.2, riboflavin: 0.06, niacin: 1, vitaminB6: 0.22, folate: 60,
            vitaminK: 31.3,
        },
        servings: [{ label: '1 portion', grams: 150 }],
    },
    {
        slug: 'aubergine',
        name: 'Aubergine, fraîche',
        category: 'legumes',
        n: {
            energy: 25, protein: 1, carbs: 5.9, fat: 0.2, fiber: 3, sugars: 3.5,
            water: 92.1, calcium: 9, iron: 0.2, magnesium: 14, phosphorus: 24,
            potassium: 229, zinc: 0.2, sodium: 2, vitaminC: 2.2, thiamin: 0.04,
            riboflavin: 0.04, niacin: 0.6, vitaminB6: 0.08, folate: 22,
            vitaminK: 3.5,
        },
        servings: [{ label: '1 aubergine moyenne', grams: 250 }],
    },
    {
        slug: 'carotte',
        name: 'Carotte, fraîche',
        category: 'legumes',
        n: {
            energy: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sugars: 4.7,
            water: 88.3, calcium: 33, iron: 0.3, magnesium: 12, phosphorus: 35,
            potassium: 320, zinc: 0.2, sodium: 69, vitaminC: 6, vitaminA: 835,
            thiamin: 0.07, riboflavin: 0.06, niacin: 1, vitaminB6: 0.14, folate: 19,
            vitaminE: 0.7, vitaminK: 13.2,
        },
        servings: [{ label: '1 carotte moyenne', grams: 100 }],
    },
    {
        slug: 'chou',
        name: 'Chou, frais',
        category: 'legumes',
        n: {
            energy: 25, protein: 1.3, carbs: 5.8, fat: 0.1, fiber: 2.5, sugars: 3.2,
            water: 92.2, calcium: 40, iron: 0.5, magnesium: 12, phosphorus: 26,
            potassium: 170, zinc: 0.2, sodium: 18, vitaminC: 37, thiamin: 0.06,
            riboflavin: 0.04, niacin: 0.2, vitaminB6: 0.12, folate: 43, vitaminK: 76,
        },
        servings: [{ label: '1 portion', grams: 150 }],
    },
    {
        slug: 'epinard',
        name: 'Épinard, frais',
        category: 'legumes',
        n: {
            energy: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugars: 0.4,
            water: 91.4, calcium: 99, iron: 2.7, magnesium: 79, phosphorus: 49,
            potassium: 558, zinc: 0.5, copper: 0.13, manganese: 0.9, sodium: 79,
            vitaminC: 28, vitaminA: 469, thiamin: 0.08, riboflavin: 0.19,
            niacin: 0.7, vitaminB6: 0.2, folate: 194, vitaminE: 2, vitaminK: 483,
        },
        servings: [{ label: '1 portion', grams: 150 }],
    },
    {
        slug: 'feuilles-de-manioc',
        name: 'Feuilles de manioc (pondu), cuites',
        category: 'legumes',
        n: {
            energy: 75, protein: 3.7, carbs: 8.5, fat: 1, fiber: 3.2, water: 84,
            calcium: 160, iron: 2.5, magnesium: 60, phosphorus: 55, potassium: 400,
            zinc: 0.6, sodium: 15, vitaminC: 30,
        },
        servings: [{ label: '1 portion', grams: 200 }],
    },
    {
        slug: 'feuilles-de-patate-douce',
        name: 'Feuilles de patate douce, cuites',
        category: 'legumes',
        n: {
            energy: 35, protein: 2.1, carbs: 7.4, fat: 0.4, fiber: 4.5, water: 88,
            calcium: 65, iron: 0.8, magnesium: 59, phosphorus: 68, potassium: 430,
            zinc: 0.2, sodium: 5, vitaminC: 9, folate: 66,
        },
        servings: [{ label: '1 portion', grams: 200 }],
    },
    {
        slug: 'folon',
        name: 'Folon (morelle noire), feuilles cuites',
        category: 'legumes',
        n: {
            energy: 55, protein: 3.6, carbs: 6, fat: 1, fiber: 2.5, water: 87,
            calcium: 180, iron: 3, magnesium: 55, potassium: 450, sodium: 10,
            vitaminC: 30,
        },
        servings: [{ label: '1 portion', grams: 200 }],
    },
    {
        slug: 'ndole',
        name: 'Ndolé (feuilles de vernonia), cuit',
        category: 'legumes',
        n: {
            energy: 50, protein: 4, carbs: 5.5, fat: 0.8, fiber: 3.5, water: 87,
            calcium: 150, iron: 3, potassium: 400, vitaminC: 25,
        },
        servings: [{ label: '1 portion', grams: 200 }],
    },
    {
        slug: 'poivron',
        name: 'Poivron, frais',
        category: 'legumes',
        n: {
            energy: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, sugars: 4.2,
            water: 92.2, calcium: 7, iron: 0.4, magnesium: 12, phosphorus: 26,
            potassium: 211, zinc: 0.3, sodium: 4, vitaminC: 128, vitaminA: 157,
            thiamin: 0.05, riboflavin: 0.09, niacin: 1, vitaminB6: 0.29, folate: 46,
            vitaminE: 1.6, vitaminK: 4.9,
        },
        servings: [{ label: '1 poivron moyen', grams: 150 }],
    },
    {
        slug: 'concombre',
        name: 'Concombre, frais',
        category: 'legumes',
        n: {
            energy: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, sugars: 1.7,
            water: 95.2, calcium: 16, iron: 0.3, magnesium: 13, phosphorus: 24,
            potassium: 147, zinc: 0.2, sodium: 2, vitaminC: 2.8, vitaminA: 5,
            thiamin: 0.03, riboflavin: 0.03, niacin: 0.1, vitaminB6: 0.04,
            folate: 7, vitaminK: 16.4,
        },
        servings: [{ label: '1/2 concombre', grams: 150 }],
    },
    {
        slug: 'courgette',
        name: 'Courgette, fraîche',
        category: 'legumes',
        n: {
            energy: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, sugars: 2.5,
            water: 94.8, calcium: 16, iron: 0.4, magnesium: 18, phosphorus: 38,
            potassium: 261, zinc: 0.3, sodium: 8, vitaminC: 18, vitaminA: 10,
            thiamin: 0.05, riboflavin: 0.09, niacin: 0.5, vitaminB6: 0.16,
            folate: 24, vitaminK: 4.3,
        },
        servings: [{ label: '1 courgette moyenne', grams: 200 }],
    },
    {
        slug: 'haricot-vert',
        name: 'Haricot vert, frais',
        category: 'legumes',
        n: {
            energy: 31, protein: 1.8, carbs: 7, fat: 0.2, fiber: 2.7, sugars: 3.3,
            water: 90.3, calcium: 37, iron: 1, magnesium: 25, phosphorus: 38,
            potassium: 211, zinc: 0.2, sodium: 6, vitaminC: 12, vitaminA: 35,
            thiamin: 0.08, riboflavin: 0.1, niacin: 0.7, vitaminB6: 0.14,
            folate: 33, vitaminK: 43,
        },
        servings: [{ label: '1 portion', grams: 200 }],
    },
    {
        slug: 'ail',
        name: 'Ail, frais',
        category: 'legumes',
        n: {
            energy: 149, protein: 6.4, carbs: 33.1, fat: 0.5, fiber: 2.1, sugars: 1,
            water: 58.6, calcium: 181, iron: 1.7, magnesium: 25, phosphorus: 153,
            potassium: 401, zinc: 1.2, sodium: 17, vitaminC: 31, thiamin: 0.2,
            riboflavin: 0.11, niacin: 0.7, vitaminB6: 1.2, folate: 3, selenium: 14.2,
        },
        servings: [{ label: '1 gousse', grams: 3 }],
    },
    {
        slug: 'gingembre',
        name: 'Gingembre, frais',
        category: 'legumes',
        n: {
            energy: 80, protein: 1.8, carbs: 17.8, fat: 0.8, fiber: 2, sugars: 1.7,
            water: 78.9, calcium: 16, iron: 0.6, magnesium: 43, phosphorus: 34,
            potassium: 415, zinc: 0.3, sodium: 13, vitaminC: 5, thiamin: 0.03,
            riboflavin: 0.03, niacin: 0.8, vitaminB6: 0.16, folate: 11,
        },
        servings: [{ label: '1 morceau', grams: 10 }],
    },
    {
        slug: 'piment',
        name: 'Piment fort, frais',
        category: 'legumes',
        n: {
            energy: 40, protein: 1.9, carbs: 8.8, fat: 0.4, fiber: 1.5, sugars: 5.3,
            water: 88, calcium: 14, iron: 1, magnesium: 23, phosphorus: 43,
            potassium: 322, zinc: 0.3, sodium: 9, vitaminC: 144, vitaminA: 48,
            thiamin: 0.07, riboflavin: 0.09, niacin: 1.2, vitaminB6: 0.5,
            folate: 23, vitaminK: 14,
        },
        servings: [{ label: '1 piment', grams: 15 }],
    },
    {
        slug: 'laitue',
        name: 'Laitue, fraîche',
        category: 'legumes',
        n: {
            energy: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, sugars: 0.8,
            water: 95, calcium: 36, iron: 0.9, magnesium: 13, phosphorus: 29,
            potassium: 194, zinc: 0.2, sodium: 28, vitaminC: 9.2, vitaminA: 370,
            thiamin: 0.07, riboflavin: 0.08, niacin: 0.4, vitaminB6: 0.09,
            folate: 38, vitaminK: 126,
        },
        servings: [{ label: '1 portion', grams: 80 }],
    },

    /* ------------------------------------------------------------------ */
    /* FRUITS                                                              */
    /* ------------------------------------------------------------------ */
    {
        slug: 'banane-douce',
        name: 'Banane douce, fraîche',
        category: 'fruits',
        n: {
            energy: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugars: 12.2,
            water: 74.9, calcium: 5, iron: 0.3, magnesium: 27, phosphorus: 22,
            potassium: 358, zinc: 0.2, sodium: 1, vitaminC: 8.7, vitaminA: 3,
            thiamin: 0.03, riboflavin: 0.07, niacin: 0.7, vitaminB6: 0.37,
            folate: 20,
        },
        servings: [{ label: '1 banane moyenne', grams: 120 }],
    },
    {
        slug: 'mangue',
        name: 'Mangue, fraîche',
        category: 'fruits',
        n: {
            energy: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, sugars: 13.7,
            water: 83.5, calcium: 11, iron: 0.2, magnesium: 10, phosphorus: 14,
            potassium: 168, zinc: 0.1, sodium: 1, vitaminC: 36, vitaminA: 54,
            thiamin: 0.03, riboflavin: 0.04, niacin: 0.7, vitaminB6: 0.12,
            folate: 43, vitaminE: 0.9, vitaminK: 4.2,
        },
        servings: [{ label: '1 mangue moyenne', grams: 200 }],
    },
    {
        slug: 'papaye',
        name: 'Papaye, fraîche',
        category: 'fruits',
        n: {
            energy: 43, protein: 0.5, carbs: 10.8, fat: 0.3, fiber: 1.7, sugars: 7.8,
            water: 88.1, calcium: 20, iron: 0.3, magnesium: 21, phosphorus: 10,
            potassium: 182, zinc: 0.1, sodium: 8, vitaminC: 61, vitaminA: 47,
            thiamin: 0.02, riboflavin: 0.03, niacin: 0.4, vitaminB6: 0.04,
            folate: 37, vitaminE: 0.3, vitaminK: 2.6,
        },
        servings: [{ label: '1 tranche', grams: 150 }],
    },
    {
        slug: 'ananas',
        name: 'Ananas, frais',
        category: 'fruits',
        n: {
            energy: 50, protein: 0.5, carbs: 13.1, fat: 0.1, fiber: 1.4, sugars: 9.9,
            water: 86, calcium: 13, iron: 0.3, magnesium: 12, phosphorus: 8,
            potassium: 109, zinc: 0.1, sodium: 1, vitaminC: 48, thiamin: 0.08,
            riboflavin: 0.03, niacin: 0.5, vitaminB6: 0.11, folate: 18,
        },
        servings: [{ label: '1 tranche', grams: 100 }],
    },
    {
        slug: 'orange',
        name: 'Orange, fraîche',
        category: 'fruits',
        n: {
            energy: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, sugars: 9.4,
            water: 86.8, calcium: 40, iron: 0.1, magnesium: 10, phosphorus: 14,
            potassium: 181, zinc: 0.1, vitaminC: 53, vitaminA: 11, thiamin: 0.09,
            riboflavin: 0.04, niacin: 0.3, vitaminB6: 0.06, folate: 30,
        },
        servings: [{ label: '1 orange moyenne', grams: 150 }],
    },
    {
        slug: 'mandarine',
        name: 'Mandarine, fraîche',
        category: 'fruits',
        n: {
            energy: 53, protein: 0.8, carbs: 13.3, fat: 0.3, fiber: 1.8, sugars: 10.6,
            water: 85.2, calcium: 37, iron: 0.2, magnesium: 12, phosphorus: 20,
            potassium: 166, zinc: 0.1, sodium: 2, vitaminC: 27, vitaminA: 34,
            thiamin: 0.06, riboflavin: 0.04, niacin: 0.4, vitaminB6: 0.08,
            folate: 16,
        },
        servings: [{ label: '1 mandarine', grams: 80 }],
    },
    {
        slug: 'citron',
        name: 'Citron, frais',
        category: 'fruits',
        n: {
            energy: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8, sugars: 2.5,
            water: 89, calcium: 26, iron: 0.6, magnesium: 8, phosphorus: 16,
            potassium: 138, zinc: 0.1, sodium: 2, vitaminC: 53, thiamin: 0.04,
            riboflavin: 0.02, niacin: 0.1, vitaminB6: 0.08, folate: 11,
        },
        servings: [{ label: '1 citron', grams: 60 }],
    },
    {
        slug: 'avocat',
        name: 'Avocat, frais',
        category: 'fruits',
        n: {
            energy: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, sugars: 0.7,
            water: 73.2, calcium: 12, iron: 0.6, magnesium: 29, phosphorus: 52,
            potassium: 485, zinc: 0.6, sodium: 7, vitaminC: 10, vitaminA: 7,
            thiamin: 0.07, riboflavin: 0.13, niacin: 1.7, vitaminB6: 0.26,
            folate: 81, vitaminE: 2.1, vitaminK: 21, saturatedFat: 2.1,
            monounsaturatedFat: 9.8, polyunsaturatedFat: 1.8,
        },
        servings: [{ label: '1/2 avocat', grams: 100 }],
    },
    {
        slug: 'goyave',
        name: 'Goyave, fraîche',
        category: 'fruits',
        n: {
            energy: 68, protein: 2.6, carbs: 14.3, fat: 1, fiber: 5.4, sugars: 8.9,
            water: 80.8, calcium: 18, iron: 0.3, magnesium: 22, phosphorus: 40,
            potassium: 417, zinc: 0.2, sodium: 2, vitaminC: 228, vitaminA: 31,
            thiamin: 0.07, riboflavin: 0.04, niacin: 1.1, vitaminB6: 0.11,
            folate: 49,
        },
        servings: [{ label: '1 goyave', grams: 100 }],
    },
    {
        slug: 'pasteque',
        name: 'Pastèque, fraîche',
        category: 'fruits',
        n: {
            energy: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, sugars: 6.2,
            water: 91.4, calcium: 7, iron: 0.2, magnesium: 10, phosphorus: 11,
            potassium: 112, zinc: 0.1, sodium: 1, vitaminC: 8.1, vitaminA: 28,
            thiamin: 0.03, riboflavin: 0.02, niacin: 0.2, vitaminB6: 0.05,
            folate: 3,
        },
        servings: [{ label: '1 tranche', grams: 200 }],
    },
    {
        slug: 'pomme',
        name: 'Pomme, fraîche',
        category: 'fruits',
        n: {
            energy: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugars: 10.4,
            water: 85.6, calcium: 6, iron: 0.1, magnesium: 5, phosphorus: 11,
            potassium: 107, zinc: 0.04, sodium: 1, vitaminC: 4.6, vitaminA: 3,
            thiamin: 0.02, riboflavin: 0.03, niacin: 0.1, vitaminB6: 0.04,
            folate: 3, vitaminK: 2.2,
        },
        servings: [{ label: '1 pomme moyenne', grams: 150 }],
    },
    {
        slug: 'safou',
        name: 'Safou (prune africaine), cuit',
        category: 'fruits',
        n: {
            energy: 220, protein: 3, carbs: 14, fat: 18.5, fiber: 3, water: 62,
            calcium: 30, potassium: 400, magnesium: 25,
        },
        servings: [{ label: '1 safou', grams: 40 }],
    },
    {
        slug: 'corossol',
        name: 'Corossol, frais',
        category: 'fruits',
        n: {
            energy: 66, protein: 1, carbs: 16.8, fat: 0.3, fiber: 3.3, sugars: 13.5,
            water: 81.2, calcium: 14, iron: 0.6, magnesium: 21, phosphorus: 27,
            potassium: 278, zinc: 0.1, sodium: 14, vitaminC: 21, thiamin: 0.07,
            riboflavin: 0.05, niacin: 0.9, vitaminB6: 0.06, folate: 14,
        },
        servings: [{ label: '1 portion', grams: 150 }],
    },
    {
        slug: 'fruit-du-baobab',
        name: 'Pain de singe (pulpe de baobab), séché',
        category: 'fruits',
        n: {
            energy: 230, protein: 2.3, carbs: 76.6, fat: 0.3, fiber: 44.2,
            sugars: 25.7, water: 12, calcium: 290, iron: 4, magnesium: 145,
            potassium: 2300, sodium: 10, vitaminC: 200,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 15 }],
    },
    {
        slug: 'ditakh',
        name: 'Ditakh (Detarium senegalense), pulpe fraîche',
        category: 'fruits',
        n: {
            energy: 90, protein: 0.8, carbs: 21, fat: 0.4, fiber: 3.5, water: 76,
        },
        servings: [{ label: '1 fruit', grams: 40 }],
    },

    /* ------------------------------------------------------------------ */
    /* VIANDES                                                             */
    /* ------------------------------------------------------------------ */
    {
        slug: 'poulet-cuisse-cuite',
        name: 'Poulet, cuisse, cuit (sans peau)',
        category: 'viandes',
        n: {
            energy: 179, protein: 24.8, carbs: 0, fat: 8.2, water: 65, calcium: 9,
            iron: 1, magnesium: 22, phosphorus: 195, potassium: 238, zinc: 2.1,
            sodium: 86, cholesterol: 123, selenium: 24, niacin: 5.5,
            vitaminB6: 0.34, vitaminB12: 0.5, saturatedFat: 2.2,
            monounsaturatedFat: 3, polyunsaturatedFat: 1.9,
        },
        servings: [{ label: '1 cuisse', grams: 130 }],
    },
    {
        slug: 'poulet-poitrine-cuite',
        name: 'Poulet, poitrine, cuit (sans peau)',
        category: 'viandes',
        n: {
            energy: 165, protein: 31, carbs: 0, fat: 3.6, water: 65, calcium: 15,
            iron: 1, magnesium: 29, phosphorus: 228, potassium: 256, zinc: 1,
            sodium: 74, cholesterol: 85, selenium: 28, niacin: 13.7,
            vitaminB6: 0.6, vitaminB12: 0.3, saturatedFat: 1,
            monounsaturatedFat: 1.2, polyunsaturatedFat: 0.8,
        },
        servings: [{ label: '1 filet', grams: 150 }],
    },
    {
        slug: 'boeuf-maigre-cuit',
        name: 'Bœuf maigre, cuit',
        category: 'viandes',
        n: {
            energy: 190, protein: 28.5, carbs: 0, fat: 8, water: 62, calcium: 12,
            iron: 2.6, magnesium: 22, phosphorus: 210, potassium: 330, zinc: 5,
            sodium: 55, cholesterol: 85, selenium: 28, niacin: 5.5,
            vitaminB6: 0.45, vitaminB12: 2.4, saturatedFat: 3,
            monounsaturatedFat: 3.2, polyunsaturatedFat: 0.3,
        },
        servings: [{ label: '1 steak', grams: 130 }],
    },
    {
        slug: 'chevre-cuite',
        name: 'Viande de chèvre, cuite',
        category: 'viandes',
        n: {
            energy: 143, protein: 27.1, carbs: 0, fat: 3, water: 68, calcium: 17,
            iron: 3.2, magnesium: 30, phosphorus: 201, potassium: 405, zinc: 4.5,
            sodium: 86, cholesterol: 86, selenium: 21, thiamin: 0.4,
            riboflavin: 0.4, niacin: 3.9, vitaminB12: 1.2, saturatedFat: 0.9,
            monounsaturatedFat: 1.1, polyunsaturatedFat: 0.5,
        },
        servings: [{ label: '1 portion', grams: 150 }],
    },
    {
        slug: 'porc-cuit',
        name: 'Porc, cuit',
        category: 'viandes',
        n: {
            energy: 230, protein: 27.5, carbs: 0, fat: 13, water: 58, calcium: 20,
            iron: 0.9, magnesium: 25, phosphorus: 230, potassium: 380, zinc: 2.5,
            sodium: 60, cholesterol: 85, selenium: 35, thiamin: 0.7,
            riboflavin: 0.3, niacin: 6, vitaminB6: 0.5, vitaminB12: 0.7,
            saturatedFat: 4.5, monounsaturatedFat: 5.8, polyunsaturatedFat: 1.4,
        },
        servings: [{ label: '1 portion', grams: 150 }],
    },
    {
        slug: 'foie-de-boeuf-cuit',
        name: 'Foie de bœuf, cuit',
        category: 'viandes',
        n: {
            energy: 191, protein: 29, carbs: 5.1, fat: 5.3, water: 58, calcium: 6,
            iron: 6.5, magnesium: 21, phosphorus: 497, potassium: 352, zinc: 5.3,
            copper: 14.6, sodium: 69, cholesterol: 396, selenium: 36,
            vitaminA: 9442, thiamin: 0.19, riboflavin: 3.4, niacin: 17.5,
            vitaminB6: 1, folate: 253, vitaminB12: 70.6, vitaminC: 1.3,
            saturatedFat: 2, monounsaturatedFat: 1, polyunsaturatedFat: 1,
        },
        servings: [{ label: '1 portion', grams: 100 }],
    },
    {
        slug: 'mouton-cuit',
        name: 'Mouton (agneau), cuit',
        category: 'viandes',
        n: {
            energy: 195, protein: 27.5, carbs: 0, fat: 9, water: 60, calcium: 10,
            iron: 2, magnesium: 24, phosphorus: 200, potassium: 320, zinc: 4.5,
            sodium: 65, cholesterol: 90, selenium: 25, niacin: 6,
            vitaminB12: 2.5, saturatedFat: 3.5, monounsaturatedFat: 3.5,
            polyunsaturatedFat: 0.7,
        },
        servings: [{ label: '1 portion', grams: 150 }],
    },

    /* ------------------------------------------------------------------ */
    /* POISSONS ET FRUITS DE MER                                           */
    /* ------------------------------------------------------------------ */
    {
        slug: 'tilapia-cuit',
        name: 'Tilapia, cuit',
        category: 'poissons',
        n: {
            energy: 128, protein: 26.2, carbs: 0, fat: 2.7, water: 71, calcium: 14,
            iron: 0.7, magnesium: 34, phosphorus: 204, potassium: 380, zinc: 0.4,
            sodium: 56, cholesterol: 57, selenium: 54, niacin: 4.7,
            vitaminB6: 0.12, vitaminB12: 1.9, saturatedFat: 0.9,
            monounsaturatedFat: 0.9, polyunsaturatedFat: 0.8,
        },
        servings: [{ label: '1 filet', grams: 150 }],
    },
    {
        slug: 'capitaine-cuit',
        name: 'Capitaine (perche du Nil), cuit',
        category: 'poissons',
        n: {
            energy: 105, protein: 21.5, carbs: 0, fat: 1.8, water: 76, calcium: 25,
            iron: 0.5, magnesium: 30, phosphorus: 200, potassium: 350, zinc: 0.5,
            sodium: 60, cholesterol: 60, selenium: 30, vitaminB12: 1.5,
            saturatedFat: 0.5, monounsaturatedFat: 0.5, polyunsaturatedFat: 0.5,
        },
        servings: [{ label: '1 filet', grams: 150 }],
    },
    {
        slug: 'maquereau-cuit',
        name: 'Maquereau, cuit',
        category: 'poissons',
        n: {
            energy: 262, protein: 23.9, carbs: 0, fat: 17.8, water: 60, calcium: 15,
            iron: 1.6, magnesium: 97, phosphorus: 278, potassium: 401, zinc: 0.9,
            sodium: 83, cholesterol: 75, selenium: 52, niacin: 6.9,
            vitaminB6: 0.46, vitaminB12: 19, vitaminD: 25.2, saturatedFat: 4.2,
            monounsaturatedFat: 7, polyunsaturatedFat: 4.3, omega3: 2.5,
        },
        servings: [{ label: '1 filet', grams: 150 }],
    },
    {
        slug: 'sardine-huile-boite',
        name: "Sardine à l'huile (conserve, égouttée)",
        category: 'poissons',
        n: {
            energy: 208, protein: 24.6, carbs: 0, fat: 11.5, water: 59,
            calcium: 382, iron: 2.9, magnesium: 39, phosphorus: 490,
            potassium: 397, zinc: 1.3, sodium: 505, cholesterol: 142,
            selenium: 53, niacin: 5.3, vitaminB12: 8.9, vitaminD: 4.8,
            saturatedFat: 1.5, monounsaturatedFat: 3.9, polyunsaturatedFat: 5.1,
            omega3: 1.5,
        },
        servings: [{ label: '1 boîte (85 g égoutté)', grams: 85 }],
    },
    {
        slug: 'thon-boite-naturel',
        name: 'Thon en conserve au naturel (égoutté)',
        category: 'poissons',
        n: {
            energy: 116, protein: 25.5, carbs: 0, fat: 0.8, water: 73, calcium: 11,
            iron: 0.8, magnesium: 27, phosphorus: 163, potassium: 237, zinc: 0.7,
            sodium: 247, cholesterol: 30, selenium: 65, niacin: 10.6,
            vitaminB6: 0.32, vitaminB12: 2.2, saturatedFat: 0.2,
            monounsaturatedFat: 0.1, polyunsaturatedFat: 0.3,
        },
        servings: [{ label: '1 boîte (110 g égoutté)', grams: 110 }],
    },
    {
        slug: 'crevettes-cuites',
        name: 'Crevettes, cuites',
        category: 'poissons',
        n: {
            energy: 99, protein: 24, carbs: 0.2, fat: 0.3, water: 75, calcium: 70,
            iron: 0.5, magnesium: 39, phosphorus: 237, potassium: 259, zinc: 1.6,
            sodium: 111, cholesterol: 189, selenium: 38, niacin: 2.6,
            vitaminB12: 1.1, omega3: 0.3,
        },
        servings: [{ label: '1 portion', grams: 100 }],
    },
    {
        slug: 'poisson-fume',
        name: 'Poisson fumé et séché (moyenne)',
        category: 'poissons',
        n: {
            energy: 250, protein: 45, carbs: 0, fat: 8, water: 30, calcium: 200,
            iron: 2, magnesium: 60, phosphorus: 550, potassium: 600, zinc: 2,
            sodium: 700, cholesterol: 80,
        },
        servings: [{ label: '1 morceau', grams: 50 }],
    },
    {
        slug: 'poisson-chat-cuit',
        name: 'Poisson-chat (silure), cuit',
        category: 'poissons',
        n: {
            energy: 150, protein: 18.5, carbs: 0, fat: 7.5, water: 72, calcium: 12,
            iron: 0.6, magnesium: 25, phosphorus: 220, potassium: 320, zinc: 0.6,
            sodium: 60, cholesterol: 70, selenium: 15, vitaminB12: 2,
            saturatedFat: 1.7, monounsaturatedFat: 3.2, polyunsaturatedFat: 1.6,
        },
        servings: [{ label: '1 portion', grams: 150 }],
    },

    /* ------------------------------------------------------------------ */
    /* ŒUFS                                                                */
    /* ------------------------------------------------------------------ */
    {
        slug: 'oeuf-de-poule-entier-cuit',
        name: 'Œuf de poule entier, cuit',
        category: 'oeufs',
        n: {
            energy: 155, protein: 12.6, carbs: 1.1, fat: 10.6, water: 74.6,
            calcium: 50, iron: 1.2, magnesium: 10, phosphorus: 172, potassium: 126,
            zinc: 1.1, sodium: 124, cholesterol: 373, selenium: 31, vitaminA: 149,
            thiamin: 0.07, riboflavin: 0.51, niacin: 0.1, vitaminB6: 0.12,
            folate: 44, vitaminB12: 1.1, vitaminD: 2.2, vitaminE: 1, choline: 294,
            saturatedFat: 3.3, monounsaturatedFat: 4.1, polyunsaturatedFat: 1.4,
        },
        servings: [{ label: '1 œuf', grams: 50 }],
    },
    {
        slug: 'oeuf-dur',
        name: 'Œuf dur',
        category: 'oeufs',
        n: {
            energy: 155, protein: 12.6, carbs: 1.1, fat: 10.6, water: 74.6,
            calcium: 50, iron: 1.2, magnesium: 10, phosphorus: 172, potassium: 126,
            zinc: 1.1, sodium: 124, cholesterol: 373, selenium: 31, vitaminA: 149,
            riboflavin: 0.51, vitaminB12: 1.1, vitaminD: 2.2, folate: 44,
            choline: 294, saturatedFat: 3.3,
        },
        servings: [{ label: '1 œuf moyen', grams: 50 }],
    },
    {
        slug: 'jaune-doeuf-cuit',
        name: "Jaune d'œuf, cuit",
        category: 'oeufs',
        n: {
            energy: 350, protein: 17, carbs: 3.6, fat: 30, water: 50, calcium: 140,
            iron: 3, magnesium: 6, phosphorus: 420, potassium: 115, zinc: 2.5,
            sodium: 50, cholesterol: 1100, selenium: 60, vitaminA: 400,
            thiamin: 0.2, riboflavin: 0.55, niacin: 0.03, vitaminB6: 0.4,
            folate: 150, vitaminB12: 2, vitaminD: 5.5, choline: 880,
            saturatedFat: 10, monounsaturatedFat: 12, polyunsaturatedFat: 4.5,
        },
        servings: [{ label: "1 jaune d'œuf", grams: 17 }],
    },
    {
        slug: 'blanc-doeuf-cuit',
        name: "Blanc d'œuf, cuit",
        category: 'oeufs',
        n: {
            energy: 52, protein: 10.9, carbs: 0.7, fat: 0.2, water: 87.3, calcium: 6,
            iron: 0.1, magnesium: 10, phosphorus: 13, potassium: 139, zinc: 0.03,
            sodium: 166, selenium: 18, riboflavin: 0.42, niacin: 0.1, folate: 4,
            vitaminB12: 0.1, choline: 1.1,
        },
        servings: [{ label: "1 blanc d'œuf", grams: 33 }],
    },

    /* ------------------------------------------------------------------ */
    /* LAITIERS                                                            */
    /* ------------------------------------------------------------------ */
    {
        slug: 'lait-entier',
        name: 'Lait entier',
        category: 'laitiers',
        n: {
            energy: 61, protein: 3.2, carbs: 4.8, fat: 3.3, sugars: 5.1, water: 88.1,
            calcium: 113, iron: 0.03, magnesium: 10, phosphorus: 84,
            potassium: 132, zinc: 0.4, sodium: 43, cholesterol: 10, selenium: 3.7,
            vitaminA: 46, thiamin: 0.05, riboflavin: 0.17, niacin: 0.1,
            vitaminB6: 0.04, folate: 5, vitaminB12: 0.45, vitaminD: 1.3,
            saturatedFat: 1.9, monounsaturatedFat: 0.8, polyunsaturatedFat: 0.2,
        },
        servings: [{ label: '1 verre', grams: 200 }, { label: '1 bol', grams: 250 }],
    },
    {
        slug: 'lait-demi-ecreme',
        name: 'Lait demi-écrémé',
        category: 'laitiers',
        n: {
            energy: 50, protein: 3.3, carbs: 4.8, fat: 2, sugars: 5.1, water: 89.2,
            calcium: 120, magnesium: 11, phosphorus: 92, potassium: 150, zinc: 0.4,
            sodium: 44, cholesterol: 8, selenium: 2.5, vitaminA: 58,
            riboflavin: 0.19, vitaminB12: 0.53, vitaminD: 1.3, saturatedFat: 1.3,
            monounsaturatedFat: 0.6, polyunsaturatedFat: 0.1,
        },
        servings: [{ label: '1 verre', grams: 200 }, { label: '1 bol', grams: 250 }],
    },
    {
        slug: 'lait-en-poudre',
        name: 'Lait en poudre entier',
        category: 'laitiers',
        n: {
            energy: 496, protein: 26.3, carbs: 38.4, fat: 26.7, sugars: 38.4,
            water: 2.5, calcium: 912, iron: 0.5, magnesium: 85, phosphorus: 776,
            potassium: 1330, zinc: 3.3, sodium: 371, cholesterol: 97, selenium: 27,
            vitaminA: 260, thiamin: 0.28, riboflavin: 1.2, niacin: 0.6,
            vitaminB6: 0.3, folate: 37, vitaminB12: 3.3, vitaminC: 8.6,
            saturatedFat: 16.7,
        },
        servings: [
            { label: '1 cuillère à soupe', grams: 10 },
            { label: '1 sachet', grams: 25 },
        ],
    },
    {
        slug: 'yaourt-nature',
        name: 'Yaourt nature (au lait entier)',
        category: 'laitiers',
        n: {
            energy: 61, protein: 3.5, carbs: 4.7, fat: 3.3, sugars: 4.7, water: 87.9,
            calcium: 121, magnesium: 12, phosphorus: 95, potassium: 155, zinc: 0.6,
            sodium: 46, cholesterol: 13, selenium: 2.2, vitaminA: 27,
            riboflavin: 0.14, vitaminB12: 0.37, saturatedFat: 2.1,
        },
        servings: [{ label: '1 pot', grams: 125 }],
    },
    {
        slug: 'yaourt-sucre',
        name: 'Yaourt sucré (aromatisé)',
        category: 'laitiers',
        n: {
            energy: 97, protein: 3.8, carbs: 15, fat: 2, sugars: 14.5, water: 78,
            calcium: 140, magnesium: 12, phosphorus: 100, potassium: 190,
            zinc: 0.5, sodium: 58, cholesterol: 8, riboflavin: 0.16,
            vitaminB12: 0.4,
        },
        servings: [{ label: '1 pot', grams: 125 }],
    },
    {
        slug: 'fromage-emmental',
        name: 'Fromage type emmental',
        category: 'laitiers',
        n: {
            energy: 382, protein: 28.5, carbs: 0.5, fat: 29.5, water: 36,
            calcium: 950, iron: 0.2, magnesium: 35, phosphorus: 580, potassium: 90,
            zinc: 4.2, sodium: 470, cholesterol: 95, selenium: 16, vitaminA: 250,
            riboflavin: 0.3, vitaminB12: 1.5, saturatedFat: 17.5,
        },
        servings: [{ label: '1 part', grams: 30 }],
    },
    {
        slug: 'lait-caille',
        name: 'Lait caillé',
        category: 'laitiers',
        n: {
            energy: 60, protein: 3.3, carbs: 4.5, fat: 3, water: 88, calcium: 120,
            phosphorus: 95, potassium: 150, zinc: 0.4, sodium: 45,
            riboflavin: 0.15, vitaminB12: 0.35, saturatedFat: 1.9,
        },
        servings: [{ label: '1 bol', grams: 200 }],
    },

    /* ------------------------------------------------------------------ */
    /* MATIÈRES GRASSES                                                    */
    /* ------------------------------------------------------------------ */
    {
        slug: 'huile-de-palme-rouge',
        name: 'Huile de palme rouge',
        category: 'matieres-grasses',
        n: {
            energy: 884, protein: 0, carbs: 0, fat: 100, water: 0,
            saturatedFat: 49.3, monounsaturatedFat: 37, polyunsaturatedFat: 9.3,
            vitaminE: 15.9, vitaminK: 8,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 13 }],
    },
    {
        slug: 'huile-d-arachide',
        name: "Huile d'arachide",
        category: 'matieres-grasses',
        n: {
            energy: 884, protein: 0, carbs: 0, fat: 100, water: 0,
            saturatedFat: 16.9, monounsaturatedFat: 46.2, polyunsaturatedFat: 32,
            vitaminE: 15.7, vitaminK: 4.2,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 13 }],
    },
    {
        slug: 'huile-de-tournesol',
        name: 'Huile de tournesol',
        category: 'matieres-grasses',
        n: {
            energy: 884, protein: 0, carbs: 0, fat: 100, water: 0,
            saturatedFat: 10.3, monounsaturatedFat: 19.5,
            polyunsaturatedFat: 65.7, vitaminE: 41.1, vitaminK: 5.4,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 13 }],
    },
    {
        slug: 'huile-d-olive',
        name: "Huile d'olive",
        category: 'matieres-grasses',
        n: {
            energy: 884, protein: 0, carbs: 0, fat: 100, water: 0,
            saturatedFat: 13.8, monounsaturatedFat: 73, polyunsaturatedFat: 10.5,
            vitaminE: 14.4, vitaminK: 60.2,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 13 }],
    },
    {
        slug: 'beurre',
        name: 'Beurre',
        category: 'matieres-grasses',
        n: {
            energy: 717, protein: 0.9, carbs: 0.1, fat: 81.1, water: 15.9,
            saturatedFat: 51.4, monounsaturatedFat: 21, polyunsaturatedFat: 3,
            transFat: 3.3, cholesterol: 215, calcium: 24, potassium: 24,
            sodium: 11, vitaminA: 684, vitaminD: 1.5, vitaminE: 2.3,
        },
        servings: [
            { label: '1 noix', grams: 10 },
            { label: '1 cuillère à soupe', grams: 15 },
        ],
    },
    {
        slug: 'margarine',
        name: 'Margarine (80 % de matière grasse)',
        category: 'matieres-grasses',
        n: {
            energy: 717, protein: 0.2, carbs: 0.7, fat: 80.5, water: 16.5,
            saturatedFat: 15.2, monounsaturatedFat: 38.9,
            polyunsaturatedFat: 24.3, sodium: 751, calcium: 3, potassium: 18,
            vitaminA: 819, vitaminD: 1.5, vitaminE: 9,
        },
        servings: [{ label: '1 noix', grams: 10 }],
    },
    {
        slug: 'lait-de-coco',
        name: 'Lait de coco',
        category: 'matieres-grasses',
        n: {
            energy: 230, protein: 2.3, carbs: 5.5, fat: 23.8, fiber: 2.2,
            sugars: 3.3, water: 67.6, calcium: 16, iron: 1.6, magnesium: 37,
            phosphorus: 100, potassium: 263, zinc: 0.7, sodium: 15,
            vitaminC: 2.8, saturatedFat: 21.1, monounsaturatedFat: 1,
            polyunsaturatedFat: 0.3,
        },
        servings: [{ label: '1 tasse', grams: 240 }],
    },

    /* ------------------------------------------------------------------ */
    /* OLÉAGINEUX                                                          */
    /* ------------------------------------------------------------------ */
    {
        slug: 'arachide-grillee',
        name: 'Arachide grillée',
        category: 'oleagineux',
        n: {
            energy: 587, protein: 24.4, carbs: 21.3, fat: 49.7, fiber: 8,
            sugars: 4.2, water: 1.7, calcium: 54, iron: 2.3, magnesium: 176,
            phosphorus: 358, potassium: 658, zinc: 2.8, copper: 0.6,
            manganese: 1.4, selenium: 4.4, sodium: 6, niacin: 13.5,
            vitaminB6: 0.3, folate: 97, vitaminE: 6.9, saturatedFat: 6.9,
            monounsaturatedFat: 24.6, polyunsaturatedFat: 15.6,
        },
        servings: [{ label: '1 poignée', grams: 30 }],
    },
    {
        slug: 'pate-d-arachide-nature',
        name: "Pâte d'arachide nature",
        category: 'oleagineux',
        n: {
            energy: 588, protein: 25.1, carbs: 19.6, fat: 49.9, fiber: 6,
            sugars: 9.2, water: 1.8, calcium: 43, iron: 1.9, magnesium: 168,
            phosphorus: 335, potassium: 649, zinc: 2.5, sodium: 17, niacin: 13.7,
            vitaminB6: 0.44, folate: 87, vitaminE: 9.1, saturatedFat: 10.3,
            monounsaturatedFat: 24.4, polyunsaturatedFat: 13.7,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 16 }],
    },
    {
        slug: 'noix-de-cajou',
        name: 'Noix de cajou grillées',
        category: 'oleagineux',
        n: {
            energy: 574, protein: 15.3, carbs: 32.7, fat: 46.4, fiber: 3,
            sugars: 5.9, water: 1.7, calcium: 37, iron: 6.7, magnesium: 292,
            phosphorus: 593, potassium: 660, zinc: 5.8, copper: 2.2,
            manganese: 0.8, selenium: 20, sodium: 12, thiamin: 0.2,
            riboflavin: 0.2, niacin: 1.4, vitaminB6: 0.32, folate: 25,
            vitaminE: 0.9, vitaminK: 34.7, saturatedFat: 9.2,
            monounsaturatedFat: 27.3, polyunsaturatedFat: 7.8,
        },
        servings: [{ label: '1 poignée', grams: 30 }],
    },
    {
        slug: 'noix-de-coco-fraiche',
        name: 'Noix de coco fraîche (chair)',
        category: 'oleagineux',
        n: {
            energy: 354, protein: 3.3, carbs: 15.2, fat: 33.5, fiber: 9,
            sugars: 6.2, water: 47, calcium: 14, iron: 2.4, magnesium: 32,
            phosphorus: 113, potassium: 356, zinc: 1.1, sodium: 20,
            vitaminC: 3.3, thiamin: 0.07, riboflavin: 0.02, niacin: 0.5,
            vitaminB6: 0.05, folate: 26, saturatedFat: 29.7,
            monounsaturatedFat: 1.4, polyunsaturatedFat: 0.4,
        },
        servings: [{ label: '1 morceau', grams: 40 }],
    },
    {
        slug: 'sesame',
        name: 'Sésame (graines entières grillées)',
        category: 'oleagineux',
        n: {
            energy: 573, protein: 17, carbs: 23.5, fat: 49.7, fiber: 11.8,
            sugars: 0.3, water: 3, calcium: 989, iron: 14.6, magnesium: 356,
            phosphorus: 629, potassium: 468, zinc: 7.8, copper: 4.1,
            manganese: 2.5, selenium: 34.4, sodium: 11, thiamin: 0.79,
            riboflavin: 0.25, niacin: 4.6, vitaminB6: 0.79, folate: 97,
            saturatedFat: 7, monounsaturatedFat: 18.8, polyunsaturatedFat: 21.8,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 10 }],
    },
    {
        slug: 'amandes',
        name: 'Amandes',
        category: 'oleagineux',
        n: {
            energy: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5,
            sugars: 4.4, water: 4.4, calcium: 269, iron: 3.7, magnesium: 270,
            phosphorus: 481, potassium: 733, zinc: 3.1, copper: 1,
            manganese: 2.2, selenium: 4.1, sodium: 1, thiamin: 0.21,
            riboflavin: 1.14, niacin: 3.6, vitaminB6: 0.14, folate: 44,
            vitaminE: 25.6, saturatedFat: 3.8, monounsaturatedFat: 31.6,
            polyunsaturatedFat: 12.3,
        },
        servings: [{ label: '1 poignée', grams: 30 }],
    },

    /* ------------------------------------------------------------------ */
    /* BOISSONS (valeurs pour 100 ml)                                      */
    /* ------------------------------------------------------------------ */
    {
        slug: 'eau',
        name: 'Eau',
        category: 'boissons',
        basis: 'ml',
        n: {
            energy: 0, protein: 0, carbs: 0, fat: 0, water: 100, sodium: 2,
        },
        servings: [
            { label: '1 verre', grams: 200 },
            { label: '1 bouteille', grams: 500 },
        ],
    },
    {
        slug: 'jus-d-orange',
        name: "Jus d'orange (pressé)",
        category: 'boissons',
        basis: 'ml',
        n: {
            energy: 45, protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2,
            sugars: 8.4, water: 88.3, calcium: 11, iron: 0.2, magnesium: 11,
            phosphorus: 17, potassium: 200, zinc: 0.1, sodium: 1, vitaminC: 50,
            thiamin: 0.09, riboflavin: 0.03, niacin: 0.4, vitaminB6: 0.04,
            folate: 30,
        },
        servings: [{ label: '1 verre', grams: 200 }],
    },
    {
        slug: 'soda-cola',
        name: 'Soda cola',
        category: 'boissons',
        basis: 'ml',
        n: {
            energy: 41, protein: 0, carbs: 10.6, fat: 0, sugars: 10.6,
            water: 89.4, sodium: 4, potassium: 2, phosphorus: 11, caffeine: 8,
        },
        servings: [
            { label: '1 canette', grams: 330 },
            { label: '1 verre', grams: 250 },
        ],
    },
    {
        slug: 'biere',
        name: 'Bière (lager)',
        category: 'boissons',
        basis: 'ml',
        n: {
            energy: 43, protein: 0.5, carbs: 3.6, fat: 0, alcohol: 3.9,
            water: 92, sodium: 4, potassium: 27, calcium: 4, magnesium: 6,
            phosphorus: 14,
        },
        servings: [
            { label: '1 canette', grams: 330 },
            { label: '1 bouteille', grams: 650 },
        ],
    },
    {
        slug: 'vin-rouge',
        name: 'Vin rouge',
        category: 'boissons',
        basis: 'ml',
        n: {
            energy: 85, protein: 0.1, carbs: 2.6, fat: 0, alcohol: 10.6,
            water: 86.5, sodium: 4, potassium: 127, calcium: 8, iron: 0.5,
            magnesium: 12, phosphorus: 23,
        },
        servings: [{ label: '1 verre', grams: 125 }],
    },
    {
        slug: 'cafe-noir',
        name: 'Café noir (infusé, sans sucre)',
        category: 'boissons',
        basis: 'ml',
        n: {
            energy: 1, protein: 0.1, carbs: 0, fat: 0, water: 99.4, caffeine: 40,
            potassium: 49, sodium: 2, magnesium: 3, niacin: 0.2,
        },
        servings: [{ label: '1 tasse', grams: 100 }],
    },
    {
        slug: 'the-infuse',
        name: 'Thé infusé (sans sucre)',
        category: 'boissons',
        basis: 'ml',
        n: {
            energy: 1, protein: 0, carbs: 0.3, fat: 0, water: 99.7, caffeine: 11,
            sodium: 3, potassium: 37, magnesium: 3,
        },
        servings: [{ label: '1 tasse', grams: 200 }],
    },
    {
        slug: 'jus-de-bissap',
        name: 'Jus de bissap (hibiscus, sucré)',
        category: 'boissons',
        basis: 'ml',
        n: {
            energy: 40, protein: 0.1, carbs: 10, fat: 0, sugars: 9.5, water: 89.5,
        },
        servings: [{ label: '1 verre', grams: 250 }],
    },
    {
        slug: 'jus-de-gingembre',
        name: 'Jus de gingembre (sucré)',
        category: 'boissons',
        basis: 'ml',
        n: {
            energy: 45, protein: 0.2, carbs: 11, fat: 0.1, sugars: 10.5, water: 88,
        },
        servings: [{ label: '1 verre', grams: 250 }],
    },
    {
        slug: 'eau-de-coco',
        name: 'Eau de coco',
        category: 'boissons',
        basis: 'ml',
        n: {
            energy: 19, protein: 0.7, carbs: 3.7, fat: 0.2, fiber: 1.1,
            sugars: 2.6, water: 95, calcium: 24, iron: 0.3, magnesium: 25,
            phosphorus: 20, potassium: 250, zinc: 0.1, sodium: 105,
            vitaminC: 2.4,
        },
        servings: [{ label: '1 verre', grams: 250 }],
    },

    /* ------------------------------------------------------------------ */
    /* CONDIMENTS                                                          */
    /* ------------------------------------------------------------------ */
    {
        slug: 'sucre-blanc',
        name: 'Sucre blanc',
        category: 'condiments',
        n: {
            energy: 387, protein: 0, carbs: 100, fat: 0, sugars: 99.8,
            addedSugars: 99.8, water: 0, calcium: 1, iron: 0.05, potassium: 2,
            sodium: 1,
        },
        servings: [
            { label: '1 cuillère à café', grams: 5 },
            { label: '1 morceau', grams: 6 },
        ],
    },
    {
        slug: 'miel',
        name: 'Miel',
        category: 'condiments',
        n: {
            energy: 304, protein: 0.3, carbs: 82.4, fat: 0, sugars: 82.1,
            water: 17.1, calcium: 6, iron: 0.4, magnesium: 2, phosphorus: 4,
            potassium: 52, zinc: 0.2, sodium: 4, vitaminC: 0.5, riboflavin: 0.04,
            niacin: 0.1, vitaminB6: 0.02, folate: 2,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 20 }],
    },
    {
        slug: 'sel',
        name: 'Sel de cuisine',
        category: 'condiments',
        n: {
            energy: 0, protein: 0, carbs: 0, fat: 0, water: 0.2, sodium: 38758,
            calcium: 24, iron: 0.3, potassium: 8, magnesium: 1,
        },
        servings: [
            { label: '1 pincée', grams: 1 },
            { label: '1 cuillère à café', grams: 5 },
        ],
    },
    {
        slug: 'cube-bouillon',
        name: 'Cube bouillon',
        category: 'condiments',
        n: {
            energy: 250, protein: 8, carbs: 18, fat: 16, water: 5, sodium: 22000,
        },
        servings: [{ label: '1 cube', grams: 4 }],
    },
    {
        slug: 'tomate-concentree',
        name: 'Concentré de tomate (double concentré)',
        category: 'condiments',
        n: {
            energy: 82, protein: 4.3, carbs: 18.9, fat: 0.5, fiber: 4.1,
            sugars: 12.2, water: 73.5, calcium: 36, iron: 3, magnesium: 42,
            phosphorus: 83, potassium: 1014, zinc: 0.6, sodium: 59,
            vitaminC: 22, vitaminA: 76, thiamin: 0.06, riboflavin: 0.15,
            niacin: 3.1, vitaminB6: 0.22, folate: 12,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 15 }],
    },
    {
        slug: 'piment-en-poudre',
        name: 'Piment rouge en poudre (cayenne)',
        category: 'condiments',
        n: {
            energy: 318, protein: 12, carbs: 56.6, fat: 17.3, fiber: 27.2,
            sugars: 10.3, water: 8, calcium: 148, iron: 7.8, magnesium: 152,
            phosphorus: 293, potassium: 2014, zinc: 2.5, sodium: 30,
            vitaminC: 76, vitaminA: 2081, thiamin: 0.33, riboflavin: 0.92,
            niacin: 8.7, vitaminB6: 2.4, folate: 106, vitaminE: 29.8,
            vitaminK: 80.3, saturatedFat: 3.3, monounsaturatedFat: 2.8,
            polyunsaturatedFat: 8.4,
        },
        servings: [{ label: '1 pincée', grams: 1 }],
    },
    {
        slug: 'ketchup',
        name: 'Ketchup',
        category: 'condiments',
        n: {
            energy: 101, protein: 1, carbs: 25.8, fat: 0.1, fiber: 0.3,
            sugars: 21.8, water: 68.5, calcium: 15, iron: 0.4, magnesium: 13,
            phosphorus: 26, potassium: 382, zinc: 0.2, sodium: 907,
            vitaminC: 4.1, vitaminA: 26, niacin: 1.4, folate: 9,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 15 }],
    },
    {
        slug: 'mayonnaise',
        name: 'Mayonnaise',
        category: 'condiments',
        n: {
            energy: 680, protein: 1, carbs: 0.6, fat: 74.9, water: 21.6,
            saturatedFat: 11.7, monounsaturatedFat: 16.7,
            polyunsaturatedFat: 44.2, cholesterol: 42, sodium: 635,
            potassium: 20, calcium: 8, iron: 0.2, vitaminE: 3.3, vitaminA: 16,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 15 }],
    },
    {
        slug: 'moutarde',
        name: 'Moutarde',
        category: 'condiments',
        n: {
            energy: 66, protein: 4.4, carbs: 5.8, fat: 3.3, fiber: 3.3,
            sugars: 0.9, water: 83.7, calcium: 58, iron: 1.5, magnesium: 48,
            phosphorus: 106, potassium: 138, zinc: 0.6, sodium: 1135,
            thiamin: 0.18, riboflavin: 0.07, niacin: 0.6, folate: 7,
            vitaminC: 0.3,
        },
        servings: [{ label: '1 cuillère à café', grams: 5 }],
    },
    {
        slug: 'sauce-soja',
        name: 'Sauce soja',
        category: 'condiments',
        n: {
            energy: 53, protein: 8.1, carbs: 4.9, fat: 0.6, fiber: 0.8,
            sugars: 0.4, water: 71.6, calcium: 33, iron: 1.5, magnesium: 74,
            phosphorus: 166, potassium: 435, zinc: 0.9, sodium: 5493,
            niacin: 2.2, folate: 14,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 15 }],
    },
    {
        slug: 'vinaigre',
        name: 'Vinaigre',
        category: 'condiments',
        n: {
            energy: 21, protein: 0, carbs: 0.9, fat: 0, sugars: 0.4, water: 93.9,
            calcium: 7, iron: 0.2, magnesium: 5, phosphorus: 8, potassium: 73,
            zinc: 0.04, sodium: 5,
        },
        servings: [{ label: '1 cuillère à soupe', grams: 15 }],
    },
    {
        slug: 'poivre-noir',
        name: 'Poivre noir moulu',
        category: 'condiments',
        n: {
            energy: 251, protein: 10.4, carbs: 64, fat: 3.3, fiber: 25.3,
            sugars: 0.6, water: 12.5, calcium: 443, iron: 9.7, magnesium: 171,
            phosphorus: 158, potassium: 1329, zinc: 1.2, sodium: 20,
            vitaminC: 21, thiamin: 0.11, riboflavin: 0.18, niacin: 1.1,
            vitaminB6: 0.29, folate: 17,
        },
        servings: [{ label: '1 pincée', grams: 0.5 }],
    },

    /* ------------------------------------------------------------------ */
    /* PLATS PRÉPARÉS (moyennes approchées, micronutriments omis)          */
    /* ------------------------------------------------------------------ */
    {
        slug: 'riz-au-gras-thieboudienne',
        name: 'Riz au gras (thieboudienne, approximation)',
        category: 'plats-prepares',
        n: { energy: 165, protein: 7.5, carbs: 20, fat: 5.5, fiber: 1.2 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
    {
        slug: 'sauce-d-arachide',
        name: "Sauce d'arachide",
        category: 'plats-prepares',
        n: { energy: 190, protein: 7.5, carbs: 8, fat: 14, fiber: 2 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
    {
        slug: 'mafe-de-boeuf',
        name: 'Mafé de bœuf',
        category: 'plats-prepares',
        n: { energy: 175, protein: 9, carbs: 9, fat: 11, fiber: 2.2 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
    {
        slug: 'ndole-au-poisson',
        name: 'Ndolé au poisson',
        category: 'plats-prepares',
        n: { energy: 170, protein: 9, carbs: 6, fat: 12.5, fiber: 3 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
    {
        slug: 'yassa-poulet',
        name: 'Yassa poulet',
        category: 'plats-prepares',
        n: { energy: 140, protein: 10, carbs: 9, fat: 7, fiber: 1 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
    {
        slug: 'poulet-dg',
        name: 'Poulet DG',
        category: 'plats-prepares',
        n: { energy: 190, protein: 9, carbs: 14, fat: 11, fiber: 1.8 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
    {
        slug: 'erou',
        name: 'Erou (feuilles de manioc)',
        category: 'plats-prepares',
        n: { energy: 180, protein: 6.5, carbs: 5, fat: 15, fiber: 4 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
    {
        slug: 'okok',
        name: "Okok (feuilles de manioc à l'arachide)",
        category: 'plats-prepares',
        n: { energy: 200, protein: 7, carbs: 6, fat: 17, fiber: 4.5 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
    {
        slug: 'foutou-banane',
        name: 'Foutou de banane',
        category: 'plats-prepares',
        n: { energy: 155, protein: 1.6, carbs: 36, fat: 0.4, fiber: 2.5 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
    {
        slug: 'kedjenou-de-poulet',
        name: 'Kedjenou de poulet',
        category: 'plats-prepares',
        n: { energy: 120, protein: 12, carbs: 4, fat: 6, fiber: 0.8 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
    {
        slug: 'sauce-graine',
        name: 'Sauce graine (palmiste)',
        category: 'plats-prepares',
        n: { energy: 200, protein: 5, carbs: 6, fat: 17, fiber: 3 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
    {
        slug: 'attieke-poisson',
        name: 'Attiéké au poisson grillé',
        category: 'plats-prepares',
        n: { energy: 145, protein: 8, carbs: 22, fat: 2.5, fiber: 1.5 },
        servings: [{ label: '1 portion', grams: 350 }],
    },
];
