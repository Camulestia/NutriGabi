import { Food } from "@/lib/types";

export const foodDatabase: Food[] = [
  {
    id: "food-rice",
    name: "Arroz cozido",
    category: "Cereais e tubérculos",
    kcalPer100g: 128,
    proteinPer100g: 2.5,
    carbsPer100g: 28.1,
    fatPer100g: 0.3,
    fiberPer100g: 1.6,
    tags: ["carboidrato"],
    commonUnits: { g: 1, colher: 25, concha: 90 }
  },
  {
    id: "food-beans",
    name: "Feijão cozido",
    category: "Leguminosas",
    kcalPer100g: 76,
    proteinPer100g: 4.8,
    carbsPer100g: 13.6,
    fatPer100g: 0.5,
    fiberPer100g: 8.5,
    tags: ["carboidrato", "proteína", "fibra", "leguminosa"],
    commonUnits: { g: 1, concha: 100, colher: 30 }
  },
  {
    id: "food-chicken",
    name: "Frango grelhado",
    category: "Proteínas",
    kcalPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    tags: ["proteína"],
    commonUnits: { g: 1, filé: 120 }
  },
  {
    id: "food-beef",
    name: "Patinho moído",
    category: "Proteínas",
    kcalPer100g: 176,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 8,
    tags: ["proteína", "gordura"],
    commonUnits: { g: 1, porção: 100 }
  },
  {
    id: "food-egg",
    name: "Ovo",
    category: "Proteínas",
    kcalPer100g: 143,
    proteinPer100g: 13,
    carbsPer100g: 0.7,
    fatPer100g: 9.5,
    tags: ["proteína", "gordura"],
    commonUnits: { g: 1, unidade: 50 }
  },
  {
    id: "food-banana",
    name: "Banana",
    category: "Frutas",
    kcalPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 22.8,
    fatPer100g: 0.3,
    fiberPer100g: 2.6,
    tags: ["fruta", "carboidrato", "fibra"],
    commonUnits: { g: 1, unidade: 80 }
  },
  {
    id: "food-oats",
    name: "Aveia",
    category: "Cereais e tubérculos",
    kcalPer100g: 394,
    proteinPer100g: 13.9,
    carbsPer100g: 66.6,
    fatPer100g: 8.5,
    fiberPer100g: 9.1,
    tags: ["carboidrato", "fibra"],
    commonUnits: { g: 1, colher: 15 }
  },
  {
    id: "food-milk",
    name: "Leite",
    category: "Laticínios",
    kcalPer100g: 61,
    proteinPer100g: 3.2,
    carbsPer100g: 4.8,
    fatPer100g: 3.3,
    tags: ["laticínio", "proteína", "carboidrato"],
    commonUnits: { ml: 1, copo: 200 }
  },
  {
    id: "food-yogurt",
    name: "Iogurte natural",
    category: "Laticínios",
    kcalPer100g: 63,
    proteinPer100g: 5.2,
    carbsPer100g: 4.7,
    fatPer100g: 2.2,
    tags: ["laticínio", "proteína"],
    commonUnits: { g: 1, pote: 170 }
  },
  {
    id: "food-bread",
    name: "Pão francês",
    category: "Panificados",
    kcalPer100g: 300,
    proteinPer100g: 8,
    carbsPer100g: 58,
    fatPer100g: 3.1,
    fiberPer100g: 2.3,
    tags: ["carboidrato"],
    commonUnits: { g: 1, unidade: 50 }
  },
  {
    id: "food-sweet-potato",
    name: "Batata doce",
    category: "Cereais e tubérculos",
    kcalPer100g: 86,
    proteinPer100g: 1.6,
    carbsPer100g: 20.1,
    fatPer100g: 0.1,
    fiberPer100g: 3,
    tags: ["carboidrato", "fibra"],
    commonUnits: { g: 1, unidade: 120 }
  },
  {
    id: "food-potato",
    name: "Batata inglesa",
    category: "Cereais e tubérculos",
    kcalPer100g: 77,
    proteinPer100g: 2,
    carbsPer100g: 17.6,
    fatPer100g: 0.1,
    fiberPer100g: 2.2,
    tags: ["carboidrato"],
    commonUnits: { g: 1, unidade: 100 }
  },
  {
    id: "food-cassava",
    name: "Mandioca cozida",
    category: "Cereais e tubérculos",
    kcalPer100g: 125,
    proteinPer100g: 0.6,
    carbsPer100g: 30,
    fatPer100g: 0.3,
    fiberPer100g: 1.8,
    tags: ["carboidrato"],
    commonUnits: { g: 1, pedaço: 80 }
  },
  {
    id: "food-pasta",
    name: "Macarrão cozido",
    category: "Cereais e tubérculos",
    kcalPer100g: 157,
    proteinPer100g: 5.8,
    carbsPer100g: 30.9,
    fatPer100g: 0.9,
    tags: ["carboidrato"],
    commonUnits: { g: 1, prato: 140 }
  },
  {
    id: "food-olive-oil",
    name: "Azeite",
    category: "Gorduras",
    kcalPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 100,
    tags: ["gordura"],
    commonUnits: { g: 1, colher: 8 }
  },
  {
    id: "food-nuts",
    name: "Castanhas",
    category: "Oleaginosas",
    kcalPer100g: 607,
    proteinPer100g: 20,
    carbsPer100g: 20,
    fatPer100g: 54,
    fiberPer100g: 7.8,
    tags: ["gordura", "proteína", "fibra"],
    commonUnits: { g: 1, porção: 30 }
  },
  {
    id: "food-whey",
    name: "Whey protein",
    category: "Suplementos",
    kcalPer100g: 400,
    proteinPer100g: 80,
    carbsPer100g: 10,
    fatPer100g: 7,
    tags: ["proteína"],
    commonUnits: { g: 1, scoop: 30 }
  },
  {
    id: "food-fish",
    name: "Peixe grelhado",
    category: "Proteínas",
    kcalPer100g: 140,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 4,
    tags: ["proteína"],
    commonUnits: { g: 1, filé: 120 }
  },
  {
    id: "food-tofu",
    name: "Tofu",
    category: "Proteínas",
    kcalPer100g: 76,
    proteinPer100g: 8,
    carbsPer100g: 1.9,
    fatPer100g: 4.8,
    tags: ["proteína"],
    commonUnits: { g: 1, fatia: 80 }
  }
];

export function getFoodById(foodId?: string) {
  return foodDatabase.find((food) => food.id === foodId);
}

export function findFoodByName(name: string) {
  return foodDatabase.find((food) => food.name.toLowerCase() === name.trim().toLowerCase());
}
