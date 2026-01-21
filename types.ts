export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  // Cost analysis fields
  purchasePrice?: number;
  purchaseUnitQuantity?: number;
  cost?: number;
}

export interface PantryItem {
  name: string;
  price: number;
  quantity: number; // The quantity bought (e.g., 1)
  unit: string; // The unit bought (e.g., 'kg')
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  imageUrl: string;
  createdAt: number;
  // Financial fields
  laborCost?: number;
  overheadPercentage?: number;
  totalCost?: number;
  suggestedPrice?: number;
  profitMargin?: number;
}

export interface FinancialStats {
  monthlyCosts: number;
  netProfit: number;
  costsTrend: number;
  profitTrend: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',     // Inicio
  PANTRY = 'PANTRY',           // Costos (Precios de Ingredientes)
  SUMMARY = 'SUMMARY',         // Resumen (Estadísticas)
  COST_ANALYSIS = 'COST_ANALYSIS' // Detalle de Receta
}