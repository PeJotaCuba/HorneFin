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
  SHOPPING = 'SHOPPING',
  ORDERS = 'ORDERS',
  EVOLUTION = 'EVOLUTION'
}

export interface Order {
  id: string;
  customerName: string;
  phone?: string;
  product: string;
  recipeId?: string; // Link to a recipe for calculations
  quantity: number;
  specifications?: string;
  hasDelivery: boolean;
  deliveryAddress?: string;
  deliveryDate: number; // timestamp (used for one-time orders)
  deliveryTime?: string; // HH:MM (used for recurring)
  isRecurring: boolean;
  recurringDays?: number[]; // 0=Sun, 1=Mon, ...
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: number;
  lastDeliveryDate?: number; // timestamp of last confirmed delivery (for recurring)
}

export interface Debt {
  id: string;
  debtorName: string;
  product: string;
  recipeId?: string;
  amount: number;
  date: number;
  isBatch?: boolean;
}

export interface UnsoldProduct {
  id: string;
  name: string;
  recipeId?: string;
  quantity: number;
  totalValue?: number;
  date: number;
  isBatch?: boolean;
}

export interface Sale {
  id: string;
  orderId?: string;
  recipeId?: string;
  recipeName: string;
  quantity: number;
  amount: number;
  cost: number;
  profit: number;
  date: number;
  type: 'ONE_TIME' | 'RECURRING';
}

export interface HistoryRecord {
  id: string;
  date: number;
  periodLabel: string; // e.g., '2023-10-25', 'Semana 42', 'Octubre 2023'
  revenue: number;
  cost: number;
  profit: number;
  totalDebts: number;
  totalUnsoldValue: number;
  salesCount: number;
  debtsCount: number;
  unsoldQty: number;
}