import React, { useState, useEffect } from 'react';
import { AppView, Recipe, PantryItem } from './types';
import { Dashboard } from './components/Dashboard';
import { CostAnalysis } from './components/CostAnalysis';
import { Pantry } from './components/Pantry';
import { Summary } from './components/Summary';
import { NavBar } from './components/NavBar';
import { TRANSLATIONS, Language } from './utils/translations';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('ES');
  
  const [pantry, setPantry] = useState<Record<string, PantryItem>>({});

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
      newPantry[item.name.toLowerCase()] = item;
    });
    setPantry(newPantry);
  };

  const handleDownloadBackup = () => {
    const data = {
      timestamp: new Date().toISOString(),
      recipes,
      pantry
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HorneFin_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const t = TRANSLATIONS[language];

  return (
    <div className={`max-w-md mx-auto min-h-screen relative shadow-2xl overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'bg-stone-950' : 'bg-stone-50'}`}>
      
      {/* Views Container - Add padding bottom so navbar doesn't cover content */}
      <div className="h-full">
        {currentView === AppView.DASHBOARD && (
          <Dashboard 
            recipes={recipes} 
            onAddRecipe={handleAddRecipe}
            onUpdateRecipe={handleUpdateRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onSelectRecipe={handleSelectRecipe}
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

        {currentView === AppView.COST_ANALYSIS && selectedRecipe && (
          <CostAnalysis 
            recipe={selectedRecipe}
            pantry={pantry}
            onUpdatePantry={handleUpdatePantry}
            onUpdateRecipe={handleUpdateRecipe}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
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