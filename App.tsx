import React, { useState, useEffect } from 'react';
import { AppView, Recipe, PantryItem } from './types';
import { Dashboard } from './components/Dashboard';
import { CostAnalysis } from './components/CostAnalysis';
import { Pantry } from './components/Pantry';
import { Summary } from './components/Summary';
import { Guide } from './components/Guide';
import { NavBar } from './components/NavBar';
import { TRANSLATIONS, Language } from './utils/translations';
import { normalizeKey } from './utils/units';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('ES');
  const [initialEditMode, setInitialEditMode] = useState(false);
  
  const [pantry, setPantry] = useState<Record<string, PantryItem>>({});

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
    // Si NO tiene precios configurados, forzamos el modo edición.
    // Si YA tiene precios, mostramos el análisis financiero.
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
      // Usar clave normalizada para evitar duplicados por mayúsculas/espacios
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
      // Optional: restore settings
      // if (data.darkMode !== undefined) setDarkMode(data.darkMode);
  };

  const t = TRANSLATIONS[language];

  return (
    <div className={`max-w-md mx-auto min-h-screen relative shadow-2xl overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'bg-stone-950' : 'bg-stone-50'}`}>
      
      {/* Views Container */}
      <div className="h-full">
        {currentView === AppView.DASHBOARD && (
          <Dashboard 
            recipes={recipes} 
            onAddRecipe={handleAddRecipe}
            onUpdateRecipe={handleUpdateRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onSelectRecipe={handleSelectRecipe}
            onRestoreBackup={handleRestoreBackup}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
            onDownloadBackup={handleDownloadBackup}
            language={language}
            setLanguage={setLanguage}
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
        
        {currentView === AppView.GUIDE && (
          <Guide t={t} />
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