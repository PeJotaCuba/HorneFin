import React, { useState, useEffect, useRef } from 'react';
import { AppView, Recipe, PantryItem, Order } from './types';
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
import { normalizeKey } from './utils/units';
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
        if (parsed.recipes) setRecipes(parsed.recipes);
        if (parsed.pantry) setPantry(parsed.pantry);
        if (parsed.baseRecipes) setBaseRecipes(parsed.baseRecipes);
        if (parsed.darkMode !== undefined) setDarkMode(parsed.darkMode);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.isSidebarCollapsed !== undefined) setIsSidebarCollapsed(parsed.isSidebarCollapsed);
      } catch (e) {
        console.error("Error loading local data", e);
      }
    }
  }, []);

  // Guardar datos en LocalStorage cada vez que cambien
  useEffect(() => {
    const data = {
      recipes,
      pantry,
      baseRecipes,
      darkMode,
      language,
      orders,
      isSidebarCollapsed
    };
    localStorage.setItem('hornefin_data', JSON.stringify(data));
  }, [recipes, pantry, baseRecipes, darkMode, language, orders, isSidebarCollapsed]);

  // Manejo del botón Atrás (History API)
  useEffect(() => {
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
  }, [language]); // Solo recreamos si cambia el idioma (para el mensaje de confirmación)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Notificaciones de Pedidos
  useEffect(() => {
    // Solicitar permiso
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const checkNotifications = () => {
      const now = Date.now();
      
      orders.forEach(order => {
        if (order.status !== 'PENDING') return;

        let targetTime = order.deliveryDate;
        
        // Si es recurrente, calculamos la próxima ocurrencia
        if (order.isRecurring && order.recurringDays && order.deliveryTime) {
            const [hours, minutes] = order.deliveryTime.split(':').map(Number);
            const today = new Date();
            const currentDay = today.getDay(); // 0-6
            
            // Buscar el próximo día válido
            let daysUntil = -1;
            for(let i=0; i<7; i++) {
                const checkDay = (currentDay + i) % 7;
                if (order.recurringDays.includes(checkDay)) {
                    // Si es hoy, verificar si la hora ya pasó
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
                return; // No hay próxima ocurrencia cercana
            }
        }

        const diff = targetTime - now;
        const hoursDiff = diff / (1000 * 60 * 60);

        // Check thresholds (approximate with 5 min window)
        const thresholds = [24, 12, 6];
        
        thresholds.forEach(h => {
             if (Math.abs(hoursDiff - h) < 0.1) { // Within 6 minutes
                 // Check if we already notified for this specific threshold/order recently to avoid spam
                 const key = `notif_${order.id}_${h}_${new Date().getDate()}`;
                 if (!localStorage.getItem(key)) {
                     if ("Notification" in window && Notification.permission === "granted") {
                         new Notification(`Pedido Próximo: ${order.customerName}`, {
                             body: `Faltan ${h} horas para entregar ${order.quantity}x ${order.product}`,
                             icon: '/icon.png'
                         });
                     }
                     localStorage.setItem(key, 'true');
                 }
             }
        });
      });
    };

    const interval = setInterval(checkNotifications, 5 * 60 * 1000); // Check every 5 mins
    checkNotifications(); // Run immediately

    return () => clearInterval(interval);
  }, [orders]);

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

  const handleDuplicateRecipe = (recipe: Recipe) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      name: `${recipe.name} (Copia)`,
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
      if (data.isSidebarCollapsed !== undefined) setIsSidebarCollapsed(data.isSidebarCollapsed);
  };

  const handleAddOrder = (order: Order) => {
    setOrders([order, ...orders]);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
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