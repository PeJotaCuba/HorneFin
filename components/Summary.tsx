import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from './Icons';
import { Recipe, PantryItem, Order, Sale, Debt, UnsoldProduct } from '../types';
import { calculateIngredientCost, normalizeKey } from '../utils/units';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SummaryProps {
  recipes: Recipe[];
  pantry: Record<string, PantryItem>;
  orders?: Order[];
  sales?: Sale[];
  debts: Debt[];
  onUpdateDebts: (debts: Debt[]) => void;
  unsoldProducts: UnsoldProduct[];
  onUpdateUnsoldProducts: (products: UnsoldProduct[]) => void;
  linkOrdersToSales: boolean;
  onUpdateLinkOrdersToSales: (link: boolean) => void;
  inventoryStock: Record<string, number>;
  onUpdateInventoryStock: (stock: Record<string, number>) => void;
  onSaveHistory: (record: any) => void;
  t: any;
}

const PIE_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#6B7280'];

export const Summary: React.FC<SummaryProps> = ({ 
  recipes, 
  pantry, 
  orders = [], 
  sales = [], 
  debts,
  onUpdateDebts,
  unsoldProducts,
  onUpdateUnsoldProducts,
  linkOrdersToSales,
  onUpdateLinkOrdersToSales,
  inventoryStock,
  onUpdateInventoryStock,
  onSaveHistory,
  t 
}) => {
  // Ventas (Producción diaria) State
  const [selectedRecipes, setSelectedRecipes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('summary_selected_recipes');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedRecipeToAdd, setSelectedRecipeToAdd] = useState('');
  
  // Date State
  const [summaryDate, setSummaryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Deudas State
  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtRecipeId, setNewDebtRecipeId] = useState('');
  const [newDebtIsBatch, setNewDebtIsBatch] = useState(false);
  const [newDebtAmount, setNewDebtAmount] = useState('');

  // Productos State
  const [newUnsoldRecipeId, setNewUnsoldRecipeId] = useState('');
  const [newUnsoldQty, setNewUnsoldQty] = useState('');
  const [newUnsoldIsBatch, setNewUnsoldIsBatch] = useState(false);

  useEffect(() => {
    localStorage.setItem('summary_selected_recipes', JSON.stringify(selectedRecipes));
  }, [selectedRecipes]);

  // Auto-calculate debt amount when recipe or batch mode changes
  useEffect(() => {
    if (newDebtRecipeId) {
      const recipe = recipes.find(r => r.id === newDebtRecipeId);
      if (recipe) {
        const cost = calculateRecipeCost(recipe);
        const margin = recipe.profitMargin || 0;
        const price = margin < 100 ? cost / (1 - (margin / 100)) : cost;
        const finalPrice = newDebtIsBatch ? price * (recipe.batchSize || 1) : price;
        setNewDebtAmount(finalPrice.toFixed(2));
      }
    } else {
      setNewDebtAmount('');
    }
  }, [newDebtRecipeId, newDebtIsBatch, recipes, pantry]);

  const calculateRecipeCost = (recipe: Recipe) => {
    return recipe.ingredients.reduce((sum, ing) => {
      const key = normalizeKey(ing.name);
      const pantryItem = pantry[key];
      let itemCost = 0;
      if (pantryItem) {
          itemCost = calculateIngredientCost(ing.quantity, ing.unit, pantryItem.price, pantryItem.quantity, pantryItem.unit);
      } else if (ing.purchasePrice && ing.purchaseUnitQuantity) {
          itemCost = calculateIngredientCost(ing.quantity, ing.unit, ing.purchasePrice, ing.purchaseUnitQuantity, ing.unit);
      }
      if (isNaN(itemCost) || !isFinite(itemCost)) itemCost = 0;
      return sum + itemCost;
    }, 0) + (recipe.otherExpenses || 0);
  };

  const addRecipe = () => {
    if (selectedRecipeToAdd && !selectedRecipes[selectedRecipeToAdd]) {
      setSelectedRecipes(prev => ({ ...prev, [selectedRecipeToAdd]: 1 }));
      setSelectedRecipeToAdd('');
    }
  };

  const removeRecipe = (id: string) => {
    setSelectedRecipes(prev => {
      const newSelected = { ...prev };
      delete newSelected[id];
      return newSelected;
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedRecipes(prev => {
      const current = prev[id] || 0;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [id]: newQty };
    });
  };

  const addDebt = () => {
    if (newDebtName && newDebtRecipeId && newDebtAmount) {
      const recipe = recipes.find(r => r.id === newDebtRecipeId);
      const debt: Debt = {
        id: Date.now().toString(),
        debtorName: newDebtName,
        product: recipe ? recipe.name : '',
        recipeId: newDebtRecipeId,
        amount: parseFloat(newDebtAmount),
        date: Date.now(),
        isBatch: newDebtIsBatch
      };
      onUpdateDebts([debt, ...debts]);
      setNewDebtName('');
      setNewDebtRecipeId('');
      setNewDebtAmount('');
      setNewDebtIsBatch(false);
    }
  };

  const removeDebt = (id: string) => {
    onUpdateDebts(debts.filter(d => d.id !== id));
  };

  const addUnsoldProduct = () => {
    if (newUnsoldRecipeId && newUnsoldQty) {
      const recipe = recipes.find(r => r.id === newUnsoldRecipeId);
      let totalValue = 0;
      if (recipe) {
        const cost = calculateRecipeCost(recipe);
        const margin = recipe.profitMargin || 0;
        const price = margin < 100 ? cost / (1 - (margin / 100)) : cost;
        const finalPrice = newUnsoldIsBatch ? price * (recipe.batchSize || 1) : price;
        totalValue = finalPrice * parseInt(newUnsoldQty, 10);
      }

      const prod: UnsoldProduct = {
        id: Date.now().toString(),
        name: recipe ? recipe.name : '',
        recipeId: newUnsoldRecipeId,
        quantity: parseInt(newUnsoldQty, 10),
        totalValue,
        date: Date.now(),
        isBatch: newUnsoldIsBatch
      };
      onUpdateUnsoldProducts([prod, ...unsoldProducts]);
      setNewUnsoldRecipeId('');
      setNewUnsoldQty('');
      setNewUnsoldIsBatch(false);
    }
  };

  const removeUnsoldProduct = (id: string) => {
    onUpdateUnsoldProducts(unsoldProducts.filter(p => p.id !== id));
  };

  const financials = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    const ingredientCosts: Record<string, number> = {
      'Harina': 0,
      'Azúcar': 0,
      'Huevo': 0,
      'Aceite': 0,
      'Leche': 0,
      'Otros': 0
    };

    const categorizeIngredient = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('harina') || lower.includes('flour')) return 'Harina';
      if (lower.includes('azúcar') || lower.includes('azucar') || lower.includes('sugar')) return 'Azúcar';
      if (lower.includes('huevo') || lower.includes('egg')) return 'Huevo';
      if (lower.includes('aceite') || lower.includes('oil')) return 'Aceite';
      if (lower.includes('leche') || lower.includes('milk')) return 'Leche';
      return 'Otros';
    };

    const processRecipe = (recipe: Recipe, count: number) => {
      const cost = recipe.ingredients.reduce((sum, ing) => {
        const key = normalizeKey(ing.name);
        const pantryItem = pantry[key];
        let itemCost = 0;
        
        if (pantryItem) {
            itemCost = calculateIngredientCost(ing.quantity, ing.unit, pantryItem.price, pantryItem.quantity, pantryItem.unit);
        } else if (ing.purchasePrice && ing.purchaseUnitQuantity) {
            itemCost = calculateIngredientCost(ing.quantity, ing.unit, ing.purchasePrice, ing.purchaseUnitQuantity, ing.unit);
        }

        if (isNaN(itemCost) || !isFinite(itemCost)) itemCost = 0;
        
        const totalItemCost = itemCost * count;
        const category = categorizeIngredient(ing.name);
        ingredientCosts[category] += totalItemCost;
        
        return sum + itemCost;
      }, 0) + (recipe.otherExpenses || 0);
      
      const productionCost = cost * count;
      const margin = recipe.profitMargin || 0;
      const revenue = margin < 100 ? productionCost / (1 - (margin / 100)) : productionCost;
      
      totalRevenue += revenue;
      totalCost += productionCost;
    };

    // 1. Process Manual Ventas
    Object.entries(selectedRecipes).forEach(([recipeId, count]) => {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe && recipe.ingredients) {
        processRecipe(recipe, count);
      }
    });

    // 2. Process Linked Sales
    if (linkOrdersToSales) {
      const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        return saleDate === summaryDate;
      });

      filteredSales.forEach(sale => {
        totalRevenue += sale.amount;
        totalCost += sale.cost;
        
        if (sale.recipeId) {
          const recipe = recipes.find(r => r.id === sale.recipeId);
          if (recipe) {
            recipe.ingredients.forEach(ing => {
              const key = normalizeKey(ing.name);
              const pantryItem = pantry[key];
              let itemCost = 0;
              if (pantryItem) {
                  itemCost = calculateIngredientCost(ing.quantity, ing.unit, pantryItem.price, pantryItem.quantity, pantryItem.unit);
              } else if (ing.purchasePrice && ing.purchaseUnitQuantity) {
                  itemCost = calculateIngredientCost(ing.quantity, ing.unit, ing.purchasePrice, ing.purchaseUnitQuantity, ing.unit);
              }
              if (isNaN(itemCost) || !isFinite(itemCost)) itemCost = 0;
              const totalItemCost = itemCost * sale.quantity;
              const category = categorizeIngredient(ing.name);
              ingredientCosts[category] += totalItemCost;
            });
          }
        }
      });
    }

    const totalDebts = debts.reduce((sum, d) => sum + d.amount, 0);
    const totalUnsold = unsoldProducts.reduce((sum, p) => sum + p.quantity, 0);

    const pieData = Object.entries(ingredientCosts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    return {
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalRevenue - totalCost,
      totalDebts,
      totalUnsold,
      pieData
    };
  }, [recipes, selectedRecipes, pantry, sales, debts, unsoldProducts, linkOrdersToSales]);

  const handleConsolidate = () => {
    // 1. Calculate required ingredients
    const ingredientsNeeded: Record<string, { name: string, quantity: number }> = {};

    const addIngredients = (recipe: Recipe, count: number) => {
      recipe.ingredients.forEach(ing => {
        const key = normalizeKey(ing.name);
        if (ingredientsNeeded[key]) {
          ingredientsNeeded[key].quantity += ing.quantity * count;
        } else {
          ingredientsNeeded[key] = { name: ing.name, quantity: ing.quantity * count };
        }
      });
    };

    // Manual Sales
    Object.entries(selectedRecipes).forEach(([recipeId, count]) => {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) addIngredients(recipe, count);
    });

    // Linked Sales
    if (linkOrdersToSales) {
      const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        return saleDate === summaryDate;
      });
      filteredSales.forEach(sale => {
        if (sale.recipeId) {
          const recipe = recipes.find(r => r.id === sale.recipeId);
          if (recipe) addIngredients(recipe, sale.quantity);
        }
      });
    }

    // 2. Check stock sufficiency
    const insufficientStock: string[] = [];
    Object.entries(ingredientsNeeded).forEach(([key, needed]) => {
      const currentStock = inventoryStock[key] || 0;
      if (currentStock < needed.quantity) {
        insufficientStock.push(`${needed.name} (Faltan: ${(needed.quantity - currentStock).toFixed(2)})`);
      }
    });

    if (insufficientStock.length > 0) {
      const msg = t.insufficientStockMsg ? t.insufficientStockMsg.replace('{stock}', insufficientStock.join('\n')) : `Stock Insuficiente para consolidar la producción:\n\n${insufficientStock.join('\n')}\n\nPor favor, actualiza el stock en la sección de Inventario antes de guardar.`;
      alert(msg);
      return; // Prevent consolidation
    }

    // 3. Deduct stock
    const newStock = { ...inventoryStock };
    Object.entries(ingredientsNeeded).forEach(([key, needed]) => {
      if (newStock[key] !== undefined) {
        newStock[key] -= needed.quantity;
        // Prevent negative just in case, though we already checked
        if (newStock[key] < 0) newStock[key] = 0; 
      }
    });
    onUpdateInventoryStock(newStock);

    // 4. Save History Record
    const record = {
      id: Date.now().toString(),
      date: new Date(summaryDate).getTime(),
      periodLabel: summaryDate,
      revenue: financials.revenue,
      cost: financials.cost,
      profit: financials.profit,
      totalDebts: financials.totalDebts,
      totalUnsoldValue: unsoldProducts.reduce((sum, p) => sum + (p.totalValue || 0), 0),
      salesCount: Object.keys(selectedRecipes).length + (linkOrdersToSales ? sales.filter(s => new Date(s.date).toISOString().split('T')[0] === summaryDate).length : 0),
      debtsCount: debts.length,
      unsoldQty: unsoldProducts.reduce((sum, p) => sum + p.quantity, 0)
    };
    onSaveHistory(record);
    
    alert(t.dataConsolidated || 'Datos consolidados y guardados en Evolución. El stock ha sido actualizado.');
    
    // 5. Clear current data
    setSelectedRecipes({});
    onUpdateDebts([]);
    onUpdateUnsoldProducts([]);
  };

  return (
    <div className="pb-8 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-6 shadow-sm border-b border-stone-100 dark:border-stone-800 sticky top-0 z-20 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span className="bg-indigo-600 text-white p-1.5 rounded-lg"><Icons.PieChart size={24} /></span>
          {t.finances || 'Finanzas'}
        </h1>
        <input 
          type="date" 
          value={summaryDate}
          onChange={(e) => setSummaryDate(e.target.value)}
          className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm font-medium"
        />
      </div>

      <div className="p-4 space-y-6">
        
        {/* Panel Superior: 3 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna 1: Ventas */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-stone-800 dark:text-white">{t.sales || 'Ventas'}</h2>
              <label className="flex items-center cursor-pointer gap-2">
                <span className="text-xs text-stone-500 font-medium">{t.linkOrders || 'Vincular Pedidos'}</span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={linkOrdersToSales}
                    onChange={(e) => onUpdateLinkOrdersToSales(e.target.checked)}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${linkOrdersToSales ? 'bg-indigo-500' : 'bg-stone-300 dark:bg-stone-700'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${linkOrdersToSales ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>
            
            <div className="flex gap-2 mb-4">
              <select 
                className="flex-1 p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                value={selectedRecipeToAdd}
                onChange={e => setSelectedRecipeToAdd(e.target.value)}
              >
                <option value="">{t.selectProduct || 'Seleccionar producto...'}</option>
                {recipes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <button 
                onClick={addRecipe}
                disabled={!selectedRecipeToAdd}
                className="px-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 text-sm"
              >
                {t.add || 'Añadir'}
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto max-h-60">
              {Object.entries(selectedRecipes).map(([recipeId, count]) => {
                  const recipe = recipes.find(r => r.id === recipeId);
                  if (!recipe) return null;
                  return (
                    <div key={recipe.id} className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex justify-between items-center gap-2">
                      <span className="font-medium text-stone-700 dark:text-stone-300 truncate flex-1 text-sm">
                          {recipe.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => updateQuantity(recipe.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-stone-700 rounded-full shadow-sm text-stone-600">-</button>
                          <span className="font-bold text-sm w-6 text-center dark:text-white">{count}</span>
                          <button onClick={() => updateQuantity(recipe.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-stone-700 rounded-full shadow-sm text-stone-600">+</button>
                          <button onClick={() => removeRecipe(recipe.id)} className="ml-1 text-red-400 hover:text-red-500 p-1"><Icons.Close size={16} /></button>
                      </div>
                    </div>
                  );
              })}
              {Object.keys(selectedRecipes).length === 0 && (
                <p className="text-center text-stone-400 text-xs py-4">{t.noManualSales || 'No hay ventas manuales registradas.'}</p>
              )}
            </div>
          </div>

          {/* Columna 2: Deudas */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col">
            <h2 className="font-bold text-stone-800 dark:text-white mb-4">{t.debts || 'Deudas'}</h2>
            
            <div className="flex flex-col gap-2 mb-4">
              <input 
                type="text" 
                placeholder={t.debtorName || "Nombre del deudor"} 
                className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                value={newDebtName}
                onChange={e => setNewDebtName(e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <select 
                  className="flex-1 p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                  value={newDebtRecipeId}
                  onChange={e => setNewDebtRecipeId(e.target.value)}
                >
                  <option value="">{t.selectProduct || 'Seleccionar producto...'}</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                {newDebtRecipeId && recipes.find(r => r.id === newDebtRecipeId)?.mode === 'BATCH' && (
                   <label className="flex items-center gap-1 text-xs text-stone-500 cursor-pointer">
                     <input type="checkbox" checked={newDebtIsBatch} onChange={e => setNewDebtIsBatch(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                     {t.batch || 'Lote'}
                   </label>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder={t.amount || "Monto"} 
                  className="flex-1 p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                  value={newDebtAmount}
                  onChange={e => setNewDebtAmount(e.target.value)}
                />
                <button 
                  onClick={addDebt}
                  disabled={!newDebtName || !newDebtRecipeId || !newDebtAmount}
                  className="px-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 text-sm flex items-center justify-center"
                >
                  <Icons.Plus size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto max-h-40">
              {debts.map(debt => (
                <div key={debt.id} className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-stone-700 dark:text-stone-300 text-sm">{debt.debtorName}</span>
                    <span className="text-xs text-stone-500">{debt.product} {debt.isBatch ? `(${t.batch || 'Lote'})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-500 text-sm">${debt.amount.toFixed(2)}</span>
                    <button onClick={() => removeDebt(debt.id)} className="text-stone-400 hover:text-red-500"><Icons.Close size={16} /></button>
                  </div>
                </div>
              ))}
              {debts.length === 0 && (
                <p className="text-center text-stone-400 text-xs py-4">{t.noDebts || 'No hay deudas registradas.'}</p>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
              <span className="text-xs font-bold text-stone-400 uppercase">{t.totalDebts || 'Total Deudas'}</span>
              <span className="font-bold text-red-500">${financials.totalDebts.toFixed(2)}</span>
            </div>
          </div>

          {/* Columna 3: Productos */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col">
            <h2 className="font-bold text-stone-800 dark:text-white mb-4">{t.pendingProducts || 'Productos Pendientes'}</h2>
            
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2 items-center">
                <select 
                  className="flex-1 p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                  value={newUnsoldRecipeId}
                  onChange={e => setNewUnsoldRecipeId(e.target.value)}
                >
                  <option value="">{t.selectProduct || 'Seleccionar producto...'}</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                {newUnsoldRecipeId && recipes.find(r => r.id === newUnsoldRecipeId)?.mode === 'BATCH' && (
                   <label className="flex items-center gap-1 text-xs text-stone-500 cursor-pointer">
                     <input type="checkbox" checked={newUnsoldIsBatch} onChange={e => setNewUnsoldIsBatch(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                     {t.batch || 'Lote'}
                   </label>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder={t.qty || "Cant."} 
                  className="flex-1 p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                  value={newUnsoldQty}
                  onChange={e => setNewUnsoldQty(e.target.value)}
                />
                <button 
                  onClick={addUnsoldProduct}
                  disabled={!newUnsoldRecipeId || !newUnsoldQty}
                  className="px-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 text-sm flex items-center justify-center"
                >
                  <Icons.Plus size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto max-h-48">
              {unsoldProducts.map(prod => (
                <div key={prod.id} className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex justify-between items-center">
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-stone-700 dark:text-stone-300 text-sm truncate">{prod.name} {prod.isBatch ? `(${t.batch || 'Lote'})` : ''}</span>
                    <span className="text-xs text-stone-500">{t.qty || 'Cant:'} {prod.quantity}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-stone-600 dark:text-stone-400 text-sm">${(prod.totalValue || 0).toFixed(2)}</span>
                    <button onClick={() => removeUnsoldProduct(prod.id)} className="text-stone-400 hover:text-red-500"><Icons.Close size={16} /></button>
                  </div>
                </div>
              ))}
              {unsoldProducts.length === 0 && (
                <p className="text-center text-stone-400 text-xs py-4">{t.noPendingProducts || 'No hay productos pendientes.'}</p>
              )}
            </div>
          </div>

        </div>

        <div className="flex justify-end mt-4">
          <button 
            onClick={handleConsolidate}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
          >
            <Icons.Save size={20} />
            {t.saveConsolidate || 'Guardar / Consolidar'}
          </button>
        </div>

        {/* Panel Inferior: Dashboard de Balance */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 animate-in slide-in-from-bottom-4">
          <h2 className="font-bold text-stone-800 dark:text-white text-lg mb-6">{t.generalBalance || 'Balance General'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Métricas Principales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-700">
                <p className="text-xs font-bold text-stone-400 uppercase mb-1">{t.grossRevenue || 'Ingresos Brutos'}</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-white">${financials.revenue.toFixed(2)}</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-700">
                <p className="text-xs font-bold text-stone-400 uppercase mb-1">{t.totalCosts || 'Costos Totales'}</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-white">${financials.cost.toFixed(2)}</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 col-span-2">
                <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase mb-1">{t.netProfit || 'Ganancia Neta'}</p>
                <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-300">${financials.profit.toFixed(2)}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-800">
                <p className="text-xs font-bold text-red-500 dark:text-red-400 uppercase mb-1">{t.accountsReceivable || 'Cuentas por Cobrar'}</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-300">${financials.totalDebts.toFixed(2)}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">{t.pendingSales || 'Pendientes Venta'}</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{financials.totalUnsold} {t.units || 'unid.'}</p>
              </div>
            </div>

            {/* Gráfico Circular */}
            <div className="flex flex-col h-full min-h-[250px]">
              <h3 className="text-xs font-bold text-stone-400 uppercase text-center mb-2">{t.rawMaterialUse || 'Uso de Materia Prima'}</h3>
              {financials.pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financials.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {financials.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-1 flex items-center justify-center text-stone-400 text-sm bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
                  {t.noDataForChart || 'No hay datos suficientes para el gráfico'}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
