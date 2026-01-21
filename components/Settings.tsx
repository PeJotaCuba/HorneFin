import React from 'react';
import { Icons } from './Icons';
import { Recipe, PantryItem } from '../types';

interface SettingsProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  recipes: Recipe[];
  pantry: Record<string, PantryItem>;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ darkMode, toggleDarkMode, recipes, pantry, onBack }) => {
  
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

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-safe">
      <div className="bg-white dark:bg-stone-900 p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition">
           <Icons.Back className="text-stone-600 dark:text-stone-400" />
        </button>
        <h1 className="font-bold text-lg">Ajustes</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Appearance */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 overflow-hidden">
           <div className="p-4 border-b border-stone-100 dark:border-stone-800 font-bold text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wider">
             Apariencia
           </div>
           <div 
             onClick={toggleDarkMode}
             className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition"
           >
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${darkMode ? 'bg-stone-800 text-yellow-400' : 'bg-orange-100 text-orange-500'}`}>
                    {darkMode ? <Icons.Moon size={20} /> : <Icons.Sun size={20} />}
                 </div>
                 <div>
                    <p className="font-medium text-stone-900 dark:text-white">Modo Oscuro</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Cambiar tema de la aplicación</p>
                 </div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-rose-500' : 'bg-stone-200'}`}>
                 <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
           </div>
        </section>

        {/* Data Management */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 overflow-hidden">
           <div className="p-4 border-b border-stone-100 dark:border-stone-800 font-bold text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wider">
             Datos
           </div>
           <div 
             onClick={handleDownloadBackup}
             className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition group"
           >
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400">
                    <Icons.Download size={20} />
                 </div>
                 <div>
                    <p className="font-medium text-stone-900 dark:text-white">Descargar Respaldo</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Guardar recetas y precios (JSON)</p>
                 </div>
              </div>
           </div>
        </section>

        <div className="text-center text-xs text-stone-400 mt-10">
           HorneFin v1.0.0
        </div>

      </div>
    </div>
  );
};