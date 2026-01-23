export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  purchasePrice?: number;
  purchaseUnitQuantity?: number;
  cost?: number;
}

export interface PantryItem {
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export type ProductionMode = 'SINGLE' | 'BATCH';

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  imageUrl: string;
  createdAt: number;
  mode: ProductionMode;
  batchSize: number;
  notes?: string;
  otherExpenses?: number;
  totalCost?: number;
  suggestedPrice?: number;
  profitMargin?: number;
  hasPricesConfigured?: boolean;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PANTRY = 'PANTRY',
  SUMMARY = 'SUMMARY',
  COST_ANALYSIS = 'COST_ANALYSIS',
  SHOPPING = 'SHOPPING'
}