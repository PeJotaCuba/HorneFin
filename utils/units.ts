// Simple conversion map to grams or ml
const CONVERSION_RATES: Record<string, number> = {
  'g': 1,
  'kg': 1000,
  'lb': 453.59,
  'oz': 28.35,
  'ml': 1,
  'l': 1000,
  'lt': 1000,
  'litro': 1000,
  'unidad': 1,
  'u': 1,
  'pza': 1,
  'cda': 15, // Tablespoon approx
  'cdita': 5, // Teaspoon approx
  'taza': 240 // Cup approx
};

export const normalizeUnit = (unit: string): string => {
  return unit.toLowerCase().replace(/s$/, ''); // Remove trailing s
};

export const calculateIngredientCost = (
  recipeQty: number,
  recipeUnit: string,
  purchasePrice: number,
  purchaseQty: number,
  purchaseUnit: string
): number => {
  const rUnit = normalizeUnit(recipeUnit);
  const pUnit = normalizeUnit(purchaseUnit);

  // If units are the same
  if (rUnit === pUnit) {
    return (recipeQty / purchaseQty) * purchasePrice;
  }

  // Convert both to base unit (g or ml) if possible
  const rFactor = CONVERSION_RATES[rUnit];
  const pFactor = CONVERSION_RATES[pUnit];

  if (rFactor && pFactor) {
    const totalRecipeBase = recipeQty * rFactor;
    const totalPurchaseBase = purchaseQty * pFactor;
    return (totalRecipeBase / totalPurchaseBase) * purchasePrice;
  }

  // Fallback if conversion fails (return 0 or handle error visually)
  console.warn(`Cannot convert ${rUnit} to ${pUnit}`);
  return 0;
};