import React, { useState, useEffect } from 'react';
import { AppView, Recipe, PantryItem } from './types';
import { Dashboard } from './components/Dashboard';
import { CostAnalysis } from './components/CostAnalysis';
import { Pantry } from './components/Pantry';
import { Summary } from './components/Summary';
import { Shopping } from './components/Shopping';
import { NavBar } from './components/NavBar';
import { Logo } from './components/Logo';
import { Header } from './components/Header';
import { TRANSLATIONS, Language } from './utils/translations';
import { normalizeKey } from './utils/units';

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
        if (parsed.darkMode !== undefined) setDarkMode(parsed.darkMode);
        if (parsed.language) setLanguage(parsed.language);
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
      darkMode,
      language
    };
    localStorage.setItem('hornefin_data', JSON.stringify(data));
  }, [recipes, pantry, darkMode, language]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
    const updatedRecipes = recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r);
    setRecipes(updatedRecipes);
    if (selectedRecipe && selectedRecipe.id === updatedRecipe.id) {
       setSelectedRecipe(updatedRecipe);
    }
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

  const handleDownloadBackup = () => {
    const data = {
      timestamp: new Date().toISOString(),
      recipes,
      pantry,
      darkMode,
      language
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
  };

  const t = TRANSLATIONS[language];

  if (loading) return <SplashScreen subtitle={t.logoSubtitle} />;

  return (
    <div className={`max-w-md mx-auto min-h-screen relative shadow-2xl overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'bg-stone-950' : 'bg-[#FAFAF9]'}`}>
      
      {/* GLOBAL HEADER - Persistent */}
      <Header 
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        language={language}
        setLanguage={setLanguage}
        onDownloadBackup={handleDownloadBackup}
        onRestoreBackup={handleRestoreBackup}
        isCompact={currentView !== AppView.DASHBOARD}
        t={t}
      />

      {/* Views Container */}
      <div className="h-full">
        {currentView === AppView.DASHBOARD && (
          <Dashboard 
            recipes={recipes} 
            onAddRecipe={handleAddRecipe}
            onUpdateRecipe={handleUpdateRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onSelectRecipe={handleSelectRecipe}
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
             t={t}
          />
        )}
        
        {currentView === AppView.SHOPPING && (
          <Shopping 
             recipes={recipes} 
             pantry={pantry}
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
      </div>

      {/* Persistent NavBar */}
      <NavBar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        t={t}
      />
    </div>
  );
}