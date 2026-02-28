import React, { useState, useEffect, useRef } from 'react';
import { AppView, Recipe, PantryItem, Order, Sale } from './types';
import { Dashboard } from './components/Dashboard';
import { CostAnalysis } from './components/CostAnalysis';
import { Pantry } from './components/Pantry';
import { Summary } from './components/Summary';
import { Shopping } from './components/Shopping';
import { Orders } from './components/Orders';
import { Sidebar } from './components/Sidebar';
import { Logo } from './components/Logo';
import { Header } from './components/Header';
import { TRANSLATIONS, Language } from './utils/translations';
import { normalizeKey, calculateIngredientCost } from './utils/units';
import { PRESET_RECIPES } from './utils/presets';

// Componente Splash Screen Actualizado
const SplashScreen = ({ subtitle }: { subtitle: string }) => (
  <div className="fixed inset-0 bg-[#FDFBF7] flex flex-col items-center justify-center z-[100] px-6">
    <div className="relative flex flex-col items-center">
       {/* Círculo decorativo de fondo */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-100 rounded-full blur-2xl opacity-60"></div>
       
       {/* Logo Vectorial (Solo Icono) */}
       <div className="relative z-10 animate-pulse mb-6">
         <Logo className="w-40 h-40" showText={false} />
       </div>

       {/* Texto debajo, centrado y responsivo */}
       <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex items-baseline text-5xl mb-3">
            <span className="font-extrabold text-[#5D2E1F] tracking-tight">Horne</span>
            <span className="font-extrabold text-[#D98E28] tracking-tight">Fin</span>
          </div>
          <span className="text-xs sm:text-sm uppercase tracking-[0.25em] text-stone-500 font-bold">
            {subtitle}
          </span>
       </div>
    </div>
    
    {/* Barra de carga */}
    <div className="w-56 h-1.5 bg-stone-200 rounded-full overflow-hidden mt-12 relative z-10">
      <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 animate-loading rounded-full"></div>
    </div>
  </div>
);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('ES');
  const [initialEditMode, setInitialEditMode] = useState(false);
  
  const [pantry, setPantry] = useState<Record<string, PantryItem>>({});
  const [baseRecipes, setBaseRecipes] = useState<any[]>(PRESET_RECIPES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Ref para rastrear la vista actual sin disparar efectos
  const currentViewRef = useRef(currentView);
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  // Simular carga inicial para el splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Cargar datos del LocalStorage al iniciar
  useEffect(() => {
    const savedData = localStorage.getItem('hornefin_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed.recipes)) setRecipes(parsed.recipes);
        if (parsed.pantry && typeof parsed.pantry === 'object') setPantry(parsed.pantry);
        if (Array.isArray(parsed.baseRecipes)) setBaseRecipes(parsed.baseRecipes);
        if (parsed.darkMode !== undefined) setDarkMode(!!parsed.darkMode);
        
        if (parsed.language === 'ES' || parsed.language === 'EN' || parsed.language === 'PT') {
            setLanguage(parsed.language);
        } else {
            setLanguage('ES');
        }

        if (Array.isArray(parsed.orders)) setOrders(parsed.orders);
        if (Array.isArray(parsed.sales)) setSales(parsed.sales);
        if (parsed.isSidebarCollapsed !== undefined) setIsSidebarCollapsed(!!parsed.isSidebarCollapsed);
      } catch (e) {
        console.error("Error loading local data", e);
        // Fallback defaults are already set in useState
      }
    }
  }, []);

  // Guardar datos en LocalStorage cada vez que cambien
  useEffect(() => {
    try {
      const data = {
        recipes,
        pantry,
        baseRecipes,
        darkMode,
        language,
        orders,
        sales,
        isSidebarCollapsed
      };
      localStorage.setItem('hornefin_data', JSON.stringify(data));
    } catch (e) {
      console.error("Error saving to localStorage (quota exceeded?)", e);
    }
  }, [recipes, pantry, baseRecipes, darkMode, language, orders, sales, isSidebarCollapsed]);

  // Manejo del botón Atrás (History API)
  useEffect(() => {
    try {
      // Empujamos un estado inicial UNA VEZ al montar para "atrapar" el botón atrás
      window.history.pushState({ view: 'app' }, '', window.location.href);

      const handlePopState = (event: PopStateEvent) => {
        // Usamos el ref para saber dónde estamos sin depender del estado que reiniciaría el efecto
        if (currentViewRef.current !== AppView.DASHBOARD) {
          // Si no estamos en Dashboard, volvemos a Dashboard
          setCurrentView(AppView.DASHBOARD);
          // Restauramos el estado "trap" para el siguiente back
          window.history.pushState({ view: 'app' }, '', window.location.href);
        } else {
          // Estamos en Dashboard, preguntamos si salir
          const shouldExit = window.confirm(TRANSLATIONS[language].confirmExit);
          if (!shouldExit) {
            // Si cancela, restauramos el estado "trap"
            window.history.pushState({ view: 'app' }, '', window.location.href);
          }
          // Si acepta, no hacemos pushState, permitiendo que el navegador retroceda (salir)
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    } catch (e) {
      console.error("History API error", e);
    }
  }, [language]); // Solo recreamos si cambia el idioma (para el mensaje de confirmación)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Helper to calculate cost and profit for a sale
  const calculateSaleFinancials = (recipeId: string | undefined, quantity: number) => {
      let cost = 0;
      let profit = 0;
      let amount = 0;

      if (recipeId && Array.isArray(recipes)) {
          const recipe = recipes.find(r => r.id === recipeId);
          if (recipe) {
              const productionCost = recipe.ingredients.reduce((sum, ing) => {
                  const key = normalizeKey(ing.name);
                  const pantryItem = pantry[key];
                  let itemCost = 0;
                  if (pantryItem) {
                      itemCost = calculateIngredientCost(ing.quantity, ing.unit, pantryItem.price, pantryItem.quantity, pantryItem.unit);
                  } else if (ing.purchasePrice && ing.purchaseUnitQuantity) {
                      itemCost = calculateIngredientCost(ing.quantity, ing.unit, ing.purchasePrice, ing.purchaseUnitQuantity, ing.unit);
                  }
                  return sum + itemCost;
              }, 0) + (recipe.otherExpenses || 0);

              cost = productionCost * quantity;
              
              const margin = recipe.profitMargin || 0;
              const unitPrice = margin < 100 ? (productionCost / (1 - (margin / 100))) : productionCost;
              amount = unitPrice * quantity;
              profit = amount - cost;
          }
      }
      return { cost, profit, amount };
  };

  // Notificaciones de Pedidos y Lógica de Facturación Automática
  useEffect(() => {
    // Solicitar permiso
    try {
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission().catch(e => console.log("Notification permission denied/error", e));
      }
    } catch (e) {
      console.error("Notification API error", e);
    }

    const checkOrders = () => {
      try {
        const now = Date.now();
        const newSales: Sale[] = [];
        let ordersUpdated = false;
        
        const updatedOrders = orders.map(order => {
          // 2. Recurring Orders Logic
          if (order.isRecurring && order.status !== 'CANCELLED' && order.recurringDays && order.deliveryTime) {
              const [hours, minutes] = order.deliveryTime.split(':').map(Number);
              const today = new Date();
              const currentDay = today.getDay(); // 0-6
              
              // Check if today is a delivery day
              if (order.recurringDays.includes(currentDay)) {
                  const deliveryTimeToday = new Date();
                  deliveryTimeToday.setHours(hours, minutes, 0, 0);
                  
                  // If delivery time has passed today
                  if (now >= deliveryTimeToday.getTime()) {
                      // Check if we already processed this today
                      const lastDelivery = order.lastDeliveryDate ? new Date(order.lastDeliveryDate) : null;
                      const isProcessedToday = lastDelivery && 
                                            lastDelivery.getDate() === today.getDate() && 
                                            lastDelivery.getMonth() === today.getMonth() && 
                                            lastDelivery.getFullYear() === today.getFullYear();

                      if (!isProcessedToday) {
                          // Request Confirmation Logic
                          const key = `recur_confirm_${order.id}_${today.toDateString()}`;
                          try {
                            if (!localStorage.getItem(key)) {
                                if ("Notification" in window && Notification.permission === "granted") {
                                    try {
                                      const n = new Notification(TRANSLATIONS[language].confirmDelivery, {
                                          body: `${order.product} - ${order.customerName}`,
                                          icon: '/icon.png',
                                          requireInteraction: true
                                      });
                                      n.onclick = () => {
                                          window.focus();
                                      };
                                    } catch (notifErr) {
                                      console.error("Error creating notification", notifErr);
                                    }
                                }
                                localStorage.setItem(key, 'true');
                            }
                          } catch (storageErr) {
                            console.error("Storage error in recurring check", storageErr);
                          }
                      }
                  }
              }
          }

          return order;
        });

        if (ordersUpdated) {
            setOrders(updatedOrders);
            setSales(prev => [...prev, ...newSales]);
        }
        
        // ... Existing Notification Logic ...
        orders.forEach(order => {
          if (order.status !== 'PENDING') return;

          let targetTime = order.deliveryDate;
          
          if (order.isRecurring && order.recurringDays && order.deliveryTime) {
              const [hours, minutes] = order.deliveryTime.split(':').map(Number);
              const today = new Date();
              const currentDay = today.getDay();
              
              let daysUntil = -1;
              for(let i=0; i<7; i++) {
                  const checkDay = (currentDay + i) % 7;
                  if (order.recurringDays.includes(checkDay)) {
                      if (i === 0) {
                          const orderDate = new Date();
                          orderDate.setHours(hours, minutes, 0, 0);
                          if (orderDate.getTime() > now) {
                              daysUntil = 0;
                              break;
                          }
                      } else {
                          daysUntil = i;
                          break;
                      }
                  }
              }
              
              if (daysUntil !== -1) {
                  const nextDate = new Date();
                  nextDate.setDate(nextDate.getDate() + daysUntil);
                  nextDate.setHours(hours, minutes, 0, 0);
                  targetTime = nextDate.getTime();
              } else {
                  return;
              }
          }

          const diff = targetTime - now;
          const hoursDiff = diff / (1000 * 60 * 60);
          const thresholds = [24, 12, 6];
          
          thresholds.forEach(h => {
              // Trigger notification if we just passed the threshold (e.g., between 23.9 and 24.0 hours left)
              // or if we are within the threshold and haven't notified yet.
              if (hoursDiff > 0 && hoursDiff <= h) {
                  const key = `notif_${order.id}_${h}_${new Date().getDate()}`;
                  try {
                    if (!localStorage.getItem(key)) {
                        if ("Notification" in window && Notification.permission === "granted") {
                            try {
                              new Notification(`Pedido Próximo: ${order.customerName}`, {
                                  body: `Faltan aprox. ${h} horas para entregar ${order.quantity}x ${order.product}`,
                                  icon: '/icon.png'
                              });
                            } catch (nErr) {
                              console.error("Notification creation error", nErr);
                            }
                        }
                        localStorage.setItem(key, 'true');
                    }
                  } catch (sErr) {
                    console.error("Storage error in notif check", sErr);
                  }
              }
          });
        });
      } catch (err) {
        console.error("Error in checkOrders loop", err);
      }
    };

    const interval = setInterval(checkOrders, 60 * 1000); // Check every minute
    checkOrders(); // Run immediately

    return () => clearInterval(interval);
  }, [orders, recipes, pantry, language]); // Added dependencies for calculation

  const handleConfirmRecurringDelivery = (order: Order) => {
      const now = Date.now();
      const financials = calculateSaleFinancials(order.recipeId, order.quantity);
      
      const newSale: Sale = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          orderId: order.id,
          recipeId: order.recipeId,
          recipeName: order.product,
          quantity: order.quantity,
          amount: financials.amount,
          cost: financials.cost,
          profit: financials.profit,
          date: now,
          type: 'RECURRING'
      };

      setSales([newSale, ...sales]);
      
      // Update order lastDeliveryDate
      const updatedOrders = orders.map(o => o.id === order.id ? { ...o, lastDeliveryDate: now } : o);
      setOrders(updatedOrders);
  };

  const handleAddRecipe = (newRecipe: Recipe) => {
    setRecipes([newRecipe, ...recipes]);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    if (!recipe.hasPricesConfigured) {
        setInitialEditMode(true);
    } else {
        setInitialEditMode(false);
    }
    setCurrentView(AppView.COST_ANALYSIS);
  };

  const handleUpdateRecipe = (updatedRecipe: Recipe) => {
    // Find original recipe to get the name before update (in case name changed)
    const originalRecipe = recipes.find(r => r.id === updatedRecipe.id);
    const originalName = originalRecipe ? originalRecipe.name : updatedRecipe.name;

    // Move updated recipe to the top of the list
    const otherRecipes = recipes.filter(r => r.id !== updatedRecipe.id);
    setRecipes([updatedRecipe, ...otherRecipes]);
    
    if (selectedRecipe && selectedRecipe.id === updatedRecipe.id) {
       setSelectedRecipe(updatedRecipe);
    }

    // Update Base Recipes if it exists there (Sync logic)
    const baseIndex = baseRecipes.findIndex(r => r.name === originalName);
    if (baseIndex !== -1) {
        const updatedBaseRecipe = {
            name: updatedRecipe.name,
            ingredients: updatedRecipe.ingredients.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
            notes: updatedRecipe.notes
        };
        // Remove old entry and add updated one to the top
        const otherBaseRecipes = baseRecipes.filter((_, index) => index !== baseIndex);
        setBaseRecipes([updatedBaseRecipe, ...otherBaseRecipes]);
    }
  };

  const handleDuplicateRecipe = (recipe: Recipe, multiplier: number = 1) => {
    const suffix = multiplier === 2 ? ' (Doble)' : multiplier === 0.5 ? ' (Mitad)' : ' (Copia)';
    const newIngredients = recipe.ingredients.map(ing => ({
      ...ing,
      quantity: ing.quantity * multiplier
    }));
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      name: `${recipe.name}${suffix}`,
      ingredients: newIngredients,
      createdAt: Date.now(),
      hasPricesConfigured: false // Reset prices configuration status for the copy
    };
    setRecipes([newRecipe, ...recipes]);
  };

  const handleDeleteRecipe = (id: string) => {
    const updatedRecipes = recipes.filter(r => r.id !== id);
    setRecipes(updatedRecipes);
    if (selectedRecipe && selectedRecipe.id === id) {
      setSelectedRecipe(null);
      setCurrentView(AppView.DASHBOARD);
    }
  };

  const handleUpdatePantry = (items: PantryItem[]) => {
    const newPantry = { ...pantry };
    items.forEach(item => {
      newPantry[normalizeKey(item.name)] = item;
    });
    setPantry(newPantry);
  };

  const handleAddToBase = (recipe: Recipe) => {
    const newBaseRecipe = {
      name: recipe.name,
      ingredients: recipe.ingredients.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
      notes: recipe.notes
    };
    // Check if already exists
    const index = baseRecipes.findIndex(r => r.name === newBaseRecipe.name);
    
    if (index !== -1) {
        // If exists, update and move to top
        const otherBase = baseRecipes.filter((_, i) => i !== index);
        setBaseRecipes([newBaseRecipe, ...otherBase]);
        alert(TRANSLATIONS[language].recipeAddedToBase); 
    } else {
        // Add to top
        setBaseRecipes([newBaseRecipe, ...baseRecipes]);
        alert(TRANSLATIONS[language].recipeAddedToBase);
    }
  };

  const handleUpdateBaseFromURL = async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/PeJotaCuba/HorneFin/refs/heads/main/base.json');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (Array.isArray(data)) {
        setBaseRecipes(data);
        alert(TRANSLATIONS[language].baseUpdated);
      }
    } catch (error) {
      console.error('Error updating base:', error);
      alert(TRANSLATIONS[language].baseUpdateError);
    }
  };

  const handleDownloadBackup = () => {
    const data = {
      timestamp: new Date().toISOString(),
      recipes,
      pantry,
      darkMode,
      language,
      orders,
      sales,
      isSidebarCollapsed
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HorneFin_DB_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRestoreBackup = (data: any) => {
      if (data.recipes) setRecipes(data.recipes);
      if (data.pantry) setPantry(data.pantry);
      if (data.orders) setOrders(data.orders);
      if (data.sales) setSales(data.sales);
      if (data.isSidebarCollapsed !== undefined) setIsSidebarCollapsed(data.isSidebarCollapsed);
  };

  const handleAddOrder = (order: Order) => {
    setOrders([order, ...orders]);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    const originalOrder = orders.find(o => o.id === updatedOrder.id);
    
    // If status changed to COMPLETED and it's a one-time order, generate a sale
    if (originalOrder && originalOrder.status !== 'COMPLETED' && updatedOrder.status === 'COMPLETED' && !updatedOrder.isRecurring) {
        const financials = calculateSaleFinancials(updatedOrder.recipeId, updatedOrder.quantity);
        const newSale: Sale = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            orderId: updatedOrder.id,
            recipeId: updatedOrder.recipeId,
            recipeName: updatedOrder.product,
            quantity: updatedOrder.quantity,
            amount: financials.amount,
            cost: financials.cost,
            profit: financials.profit,
            date: Date.now(),
            type: 'ONE_TIME'
        };
        setSales(prev => [newSale, ...prev]);
    }

    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleDeleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  const t = TRANSLATIONS[language];

  if (loading) return <SplashScreen subtitle={t.logoSubtitle} />;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-stone-950' : 'bg-[#FAFAF9]'}`}>
      
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView}
        onChangeView={setCurrentView}
        t={t}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 min-h-screen flex flex-col ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        
        {/* GLOBAL HEADER - Persistent */}
        <Header 
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
          language={language}
          setLanguage={setLanguage}
          onDownloadBackup={handleDownloadBackup}
          onRestoreBackup={handleRestoreBackup}
          isCompact={currentView !== AppView.DASHBOARD}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          t={t}
        />

        {/* Views Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto">
          {currentView === AppView.DASHBOARD && (
            <Dashboard 
              recipes={recipes} 
              onAddRecipe={handleAddRecipe}
              onUpdateRecipe={handleUpdateRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              onSelectRecipe={handleSelectRecipe}
              onDuplicateRecipe={handleDuplicateRecipe}
              baseRecipes={baseRecipes}
              onAddToBase={handleAddToBase}
              onUpdateBaseFromURL={handleUpdateBaseFromURL}
              t={t}
            />
          )}

          {currentView === AppView.ORDERS && (
            <Orders 
              orders={orders}
              recipes={recipes}
              onAddOrder={handleAddOrder}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
              onConfirmRecurring={handleConfirmRecurringDelivery}
              t={t}
            />
          )}

          {currentView === AppView.PANTRY && (
            <Pantry 
              recipes={recipes} 
              pantry={pantry} 
              onUpdatePantry={handleUpdatePantry} 
              t={t}
            />
          )}

          {currentView === AppView.SUMMARY && (
            <Summary 
               recipes={recipes} 
               pantry={pantry} 
               orders={orders}
               sales={sales}
               t={t}
            />
          )}
          
          {currentView === AppView.SHOPPING && (
            <Shopping 
               recipes={recipes} 
               pantry={pantry}
               orders={orders}
               t={t} 
            />
          )}

          {currentView === AppView.COST_ANALYSIS && selectedRecipe && (
            <CostAnalysis 
              recipe={selectedRecipe}
              pantry={pantry}
              onUpdatePantry={handleUpdatePantry}
              onUpdateRecipe={handleUpdateRecipe}
              onBack={() => setCurrentView(AppView.DASHBOARD)}
              initialEditMode={initialEditMode}
              t={t}
            />
          )}
        </main>
      </div>
    </div>
  );
}