import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from './Icons';
import { Recipe, PantryItem, Order, Sale, Debt, UnsoldProduct, DailyArchiveRecord, HistoryRecord } from '../types';
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
  dailyArchives: DailyArchiveRecord[];
  onSaveDailyArchive: (record: DailyArchiveRecord) => void;
  onConsolidateArchives: (archiveIds: string[], historyRecord: HistoryRecord) => void;
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
  dailyArchives,
  onSaveDailyArchive,
  onConsolidateArchives,
  t 
}) => {
  const [activeTab, setActiveTab] = useState<'OPERATIVA' | 'ARCHIVO'>('OPERATIVA');
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
  const [newDebtQty, setNewDebtQty] = useState('');
  const [newDebtUnitPrice, setNewDebtUnitPrice] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');

  // Productos State
  const [newUnsoldRecipeId, setNewUnsoldRecipeId] = useState('');
  const [newUnsoldQty, setNewUnsoldQty] = useState('');
  const [newUnsoldUnitPrice, setNewUnsoldUnitPrice] = useState('');
  const [newUnsoldAmount, setNewUnsoldAmount] = useState('');
  const [newUnsoldIsBatch, setNewUnsoldIsBatch] = useState(false);

  useEffect(() => {
    localStorage.setItem('summary_selected_recipes', JSON.stringify(selectedRecipes));
  }, [selectedRecipes]);

  const getRecipeSuggestedPrice = (recipe: Recipe) => {
    const totalCost = calculateRecipeCost(recipe);
    const costPerItem = recipe.mode === 'BATCH' ? (totalCost / (recipe.batchSize || 1)) : totalCost;
    const margin = recipe.profitMargin || 25;
    return margin < 100 ? costPerItem / (1 - (margin / 100)) : costPerItem;
  };

  // Auto-calculate debt/unsold amount when recipe, batch mode, or qty changes
  useEffect(() => {
    if (newDebtRecipeId) {
      const recipe = recipes.find(r => r.id === newDebtRecipeId);
      if (recipe) {
        const price = getRecipeSuggestedPrice(recipe);
        const unitPrice = newDebtIsBatch ? price * (recipe.batchSize || 1) : price;
        setNewDebtUnitPrice(unitPrice.toFixed(2));
      }
    } else {
      setNewDebtUnitPrice('');
    }
  }, [newDebtRecipeId, newDebtIsBatch, recipes, pantry]);

  useEffect(() => {
    const unitPrice = parseFloat(newDebtUnitPrice) || 0;
    const qty = parseFloat(newDebtQty) || 0;
    setNewDebtAmount((unitPrice * qty).toFixed(2));
  }, [newDebtUnitPrice, newDebtQty]);

  useEffect(() => {
    if (newUnsoldRecipeId) {
      const recipe = recipes.find(r => r.id === newUnsoldRecipeId);
      if (recipe) {
        const price = getRecipeSuggestedPrice(recipe);
        const unitPrice = newUnsoldIsBatch ? price * (recipe.batchSize || 1) : price;
        setNewUnsoldUnitPrice(unitPrice.toFixed(2));
      }
    } else {
      setNewUnsoldUnitPrice('');
    }
  }, [newUnsoldRecipeId, newUnsoldIsBatch, recipes, pantry]);

  useEffect(() => {
    const unitPrice = parseFloat(newUnsoldUnitPrice) || 0;
    const qty = parseFloat(newUnsoldQty) || 0;
    setNewUnsoldAmount((unitPrice * qty).toFixed(2));
  }, [newUnsoldUnitPrice, newUnsoldQty]);

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
      const debt: Debt = {
        id: Date.now().toString(),
        debtorName: newDebtName,
        product: recipes.find(r => r.id === newDebtRecipeId)?.name || '',
        recipeId: newDebtRecipeId,
        quantity: parseFloat(newDebtQty) || 0,
        unitPrice: parseFloat(newDebtUnitPrice) || 0,
        amount: parseFloat(newDebtAmount),
        date: Date.now(),
        isBatch: newDebtIsBatch
      };
      onUpdateDebts([debt, ...debts]);
      setNewDebtName('');
      setNewDebtRecipeId('');
      setNewDebtQty('');
      setNewDebtUnitPrice('');
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
      const unitPrice = parseFloat(newUnsoldUnitPrice) || 0;
      const qty = parseInt(newUnsoldQty, 10) || 0;
      const amount = parseFloat(newUnsoldAmount) || (unitPrice * qty);

      const prod: UnsoldProduct = {
        id: Date.now().toString(),
        name: recipe ? recipe.name : '',
        recipeId: newUnsoldRecipeId,
        quantity: qty,
        unitPrice: unitPrice,
        amount: amount,
        date: Date.now(),
        isBatch: newUnsoldIsBatch
      };
      onUpdateUnsoldProducts([prod, ...unsoldProducts]);
      setNewUnsoldRecipeId('');
      setNewUnsoldQty('');
      setNewUnsoldUnitPrice('');
      setNewUnsoldAmount('');
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
    const totalUnsoldValue = unsoldProducts.reduce((sum, p) => sum + p.amount, 0);

    const pieData = Object.entries(ingredientCosts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    return {
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalRevenue - totalCost,
      totalDebts,
      totalUnsold,
      totalUnsoldValue,
      pieData
    };
  }, [recipes, selectedRecipes, pantry, sales, debts, unsoldProducts, linkOrdersToSales]);

  const handleSaveData = () => {
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

    // 2. Save Daily Archive Record
    const record: DailyArchiveRecord = {
      id: Date.now().toString(),
      date: new Date(summaryDate).getTime(),
      dateLabel: summaryDate,
      revenue: financials.revenue,
      cost: financials.cost,
      profit: financials.profit,
      totalDebts: financials.totalDebts,
      totalUnsoldValue: unsoldProducts.reduce((sum, p) => sum + p.amount, 0),
      salesCount: Object.keys(selectedRecipes).length + (linkOrdersToSales ? sales.filter(s => new Date(s.date).toISOString().split('T')[0] === summaryDate).length : 0),
      debtsCount: debts.length,
      unsoldQty: unsoldProducts.reduce((sum, p) => sum + p.quantity, 0),
      ingredientsNeeded,
      consolidated: false
    };
    
    onSaveDailyArchive(record);
    
    alert('Datos guardados en el Archivo Diario.');
    
    // 3. Clear current data
    setSelectedRecipes({});
    onUpdateDebts([]);
    onUpdateUnsoldProducts([]);
  };

  const handleConsolidateArchive = () => {
    const pendingArchives = dailyArchives.filter(a => !a.consolidated);
    if (pendingArchives.length === 0) {
      alert('No hay registros pendientes para consolidar.');
      return;
    }

    // 1. Sum up all ingredients needed
    const totalIngredientsNeeded: Record<string, { name: string, quantity: number }> = {};
    pendingArchives.forEach(archive => {
      Object.entries(archive.ingredientsNeeded).forEach(([key, needed]) => {
        if (totalIngredientsNeeded[key]) {
          totalIngredientsNeeded[key].quantity += needed.quantity;
        } else {
          totalIngredientsNeeded[key] = { name: needed.name, quantity: needed.quantity };
        }
      });
    });

    // 2. Check stock sufficiency
    const insufficientStock: string[] = [];
    Object.entries(totalIngredientsNeeded).forEach(([key, needed]) => {
      const currentStock = inventoryStock[key] || 0;
      if (currentStock < needed.quantity) {
        insufficientStock.push(`${needed.name} (Faltan: ${(needed.quantity - currentStock).toFixed(2)})`);
      }
    });

    if (insufficientStock.length > 0) {
      const msg = t.insufficientStockMsg ? t.insufficientStockMsg.replace('{stock}', insufficientStock.join('\n')) : `Stock Insuficiente para consolidar la producción:\n\n${insufficientStock.join('\n')}\n\nPor favor, actualiza el stock en la sección de Inventario antes de consolidar.`;
      alert(msg);
      return; // Prevent consolidation
    }

    // 3. Deduct stock
    const newStock = { ...inventoryStock };
    Object.entries(totalIngredientsNeeded).forEach(([key, needed]) => {
      if (newStock[key] !== undefined) {
        newStock[key] -= needed.quantity;
        if (newStock[key] < 0) newStock[key] = 0; 
      }
    });
    onUpdateInventoryStock(newStock);

    // 4. Create History Record
    const historyRecord: HistoryRecord = {
      id: Date.now().toString(),
      date: Date.now(),
      periodLabel: `Consolidado (${pendingArchives.length} días)`,
      revenue: pendingArchives.reduce((sum, a) => sum + a.revenue, 0),
      cost: pendingArchives.reduce((sum, a) => sum + a.cost, 0),
      profit: pendingArchives.reduce((sum, a) => sum + a.profit, 0),
      totalDebts: pendingArchives.reduce((sum, a) => sum + a.totalDebts, 0),
      totalUnsoldValue: pendingArchives.reduce((sum, a) => sum + a.totalUnsoldValue, 0),
      salesCount: pendingArchives.reduce((sum, a) => sum + a.salesCount, 0),
      debtsCount: pendingArchives.reduce((sum, a) => sum + a.debtsCount, 0),
      unsoldQty: pendingArchives.reduce((sum, a) => sum + a.unsoldQty, 0)
    };

    onConsolidateArchives(pendingArchives.map(a => a.id), historyRecord);
    alert('Datos consolidados y guardados en Evolución. El stock ha sido actualizado.');
  };

  const handleDownloadArchiveDocx = (archive: DailyArchiveRecord) => {
    const content = `
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          <h1>Reporte Diario - HorneFin</h1>
          <p><strong>Fecha:</strong> ${archive.dateLabel}</p>
          <hr/>
          <h2>Resumen Financiero</h2>
          <ul>
            <li><strong>Ingresos Brutos:</strong> $${archive.revenue.toFixed(2)}</li>
            <li><strong>Costos de Producción:</strong> $${archive.cost.toFixed(2)}</li>
            <li><strong>Ganancia Neta:</strong> $${archive.profit.toFixed(2)}</li>
            <li><strong>Total Deudas:</strong> $${archive.totalDebts.toFixed(2)}</li>
            <li><strong>Valor Productos Pendientes:</strong> $${archive.totalUnsoldValue.toFixed(2)}</li>
          </ul>
          <hr/>
          <h2>Detalles Operativos</h2>
          <ul>
            <li><strong>Ventas (Cantidad):</strong> ${archive.salesCount}</li>
            <li><strong>Deudas (Cantidad):</strong> ${archive.debtsCount}</li>
            <li><strong>Productos Pendientes (Cantidad):</strong> ${archive.unsoldQty}</li>
          </ul>
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Diario_${archive.dateLabel.replace(/\//g, '-')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareArchiveWhatsApp = (archive: DailyArchiveRecord) => {
    const text = `*Reporte Diario - HorneFin* 📊\n*Fecha:* ${archive.dateLabel}\n\n` +
      `*Ingresos Brutos:* $${archive.revenue.toFixed(2)}\n` +
      `*Costos de Producción:* $${archive.cost.toFixed(2)}\n` +
      `*Ganancia Neta:* $${archive.profit.toFixed(2)}\n` +
      `*Deudas:* $${archive.totalDebts.toFixed(2)}\n` +
      `*Productos Pendientes:* $${archive.totalUnsoldValue.toFixed(2)}\n\n` +
      `Generado por HorneFin.`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="pb-8 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-6 shadow-sm border-b border-stone-100 dark:border-stone-800 sticky top-0 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span className="bg-indigo-600 text-white p-1.5 rounded-lg"><Icons.PieChart size={24} /></span>
          {t.finances || 'Finanzas'}
        </h1>
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            <button 
                onClick={() => setActiveTab('OPERATIVA')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'OPERATIVA' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                Operativa Actual
            </button>
            <button 
                onClick={() => setActiveTab('ARCHIVO')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ARCHIVO' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                Archivo Diario
            </button>
        </div>
        {activeTab === 'OPERATIVA' && (
          <input 
            type="date" 
            value={summaryDate}
            onChange={(e) => setSummaryDate(e.target.value)}
            className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm font-medium"
          />
        )}
      </div>

      <div className="p-4 space-y-6">
        {activeTab === 'OPERATIVA' ? (
          <>
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
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="number" 
                  placeholder={t.qty || "Cant."} 
                  className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                  value={newDebtQty}
                  onChange={e => setNewDebtQty(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder={t.unitPrice || "Precio U."} 
                  className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                  value={newDebtUnitPrice}
                  onChange={e => setNewDebtUnitPrice(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder={t.amount || "Monto"} 
                  className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                  value={newDebtAmount}
                  onChange={e => setNewDebtAmount(e.target.value)}
                />
              </div>
              <button 
                onClick={addDebt}
                disabled={!newDebtName || !newDebtRecipeId || !newDebtAmount}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                <Icons.Plus size={16} /> {t.add || 'Añadir'}
              </button>
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
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="number" 
                  placeholder={t.qty || "Cant."} 
                  className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                  value={newUnsoldQty}
                  onChange={e => setNewUnsoldQty(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder={t.unitPrice || "Precio U."} 
                  className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                  value={newUnsoldUnitPrice}
                  onChange={e => setNewUnsoldUnitPrice(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder={t.amount || "Monto"} 
                  className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white text-sm"
                  value={newUnsoldAmount}
                  onChange={e => setNewUnsoldAmount(e.target.value)}
                />
              </div>
              <button 
                onClick={addUnsoldProduct}
                disabled={!newUnsoldRecipeId || !newUnsoldQty}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                <Icons.Plus size={16} /> {t.add || 'Añadir'}
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto max-h-48">
              {unsoldProducts.map(prod => (
                <div key={prod.id} className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 grid grid-cols-4 gap-2 items-center">
                  <span className="font-medium text-stone-700 dark:text-stone-300 text-xs truncate">{prod.name}</span>
                  <input type="number" className="p-1 bg-white dark:bg-stone-700 rounded border border-stone-200 dark:border-stone-600 dark:text-white text-xs text-center" value={prod.quantity} onChange={e => onUpdateUnsoldProducts(unsoldProducts.map(p => p.id === prod.id ? {...p, quantity: parseInt(e.target.value) || 0, amount: (parseInt(e.target.value) || 0) * p.unitPrice} : p))} />
                  <input type="number" className="p-1 bg-white dark:bg-stone-700 rounded border border-stone-200 dark:border-stone-600 dark:text-white text-xs text-center" value={prod.unitPrice} onChange={e => onUpdateUnsoldProducts(unsoldProducts.map(p => p.id === prod.id ? {...p, unitPrice: parseFloat(e.target.value) || 0, amount: p.quantity * (parseFloat(e.target.value) || 0)} : p))} />
                  <div className="flex items-center justify-between gap-1">
                    <input type="number" className="p-1 bg-white dark:bg-stone-700 rounded border border-stone-200 dark:border-stone-600 dark:text-white text-xs text-center w-full" value={prod.amount} onChange={e => onUpdateUnsoldProducts(unsoldProducts.map(p => p.id === prod.id ? {...p, amount: parseFloat(e.target.value) || 0} : p))} />
                    <button onClick={() => removeUnsoldProduct(prod.id)} className="text-stone-400 hover:text-red-500"><Icons.Close size={14} /></button>
                  </div>
                </div>
              ))}
              {unsoldProducts.length === 0 && (
                <p className="text-center text-stone-400 text-xs py-4">{t.noPendingProducts || 'No hay productos pendientes.'}</p>
              )}
            </div>
          </div>

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
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                  {financials.totalUnsold} {t.units || 'unid.'} 
                  <span className="block text-sm font-medium opacity-80">${financials.totalUnsoldValue.toFixed(2)}</span>
                </p>
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

            <div className="mt-6">
              <button 
                onClick={handleSaveData}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Icons.Save size={20} />
                Guardar Datos en Archivo Diario
              </button>
            </div>

          </div>
        </div>
        </>
        ) : (
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-900 dark:text-white">Archivo Diario Pendiente</h2>
              <button 
                onClick={handleConsolidateArchive}
                disabled={dailyArchives.filter(a => !a.consolidated).length === 0}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Icons.Check size={20} />
                Guardar y Consolidar
              </button>
            </div>

            {dailyArchives.filter(a => !a.consolidated).length > 0 ? (
              <div className="space-y-4">
                {dailyArchives.filter(a => !a.consolidated).map(archive => (
                  <div key={archive.id} className="p-5 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-stone-900 dark:text-white">{archive.dateLabel}</h3>
                      <p className="text-sm text-stone-500 mb-3">
                        Ventas: {archive.salesCount} | Deudas: {archive.debtsCount} | Pendientes: {archive.unsoldQty}
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDownloadArchiveDocx(archive)}
                          className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          title="Descargar Docx"
                        >
                          <Icons.Download size={16} />
                        </button>
                        <button 
                          onClick={() => handleShareArchiveWhatsApp(archive)}
                          className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                          title="Compartir por WhatsApp"
                        >
                          <Icons.Share size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase">Ingresos</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">${archive.revenue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase">Costos</p>
                        <p className="font-bold text-red-600 dark:text-red-400">${archive.cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase">Ganancia</p>
                        <p className="font-bold text-indigo-600 dark:text-indigo-400">${archive.profit.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 opacity-50">
                <Icons.PieChart size={48} className="mx-auto mb-4 text-stone-300" />
                <p className="text-stone-400 font-medium">No hay registros pendientes en el archivo diario.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
