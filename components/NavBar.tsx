import React, { useState } from 'react';
import { Icons } from './Icons';
import { AppView } from '../types';

interface NavBarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  t: any;
}

export const NavBar: React.FC<NavBarProps> = ({ currentView, onChangeView, t }) => {
  const [hoveredItem, setHoveredItem] = useState<AppView | null>(null);

  const navItems = [
    { id: AppView.DASHBOARD, icon: Icons.Home, label: t.navHome, info: t.navHomeInfo },
    { id: AppView.PANTRY, icon: Icons.Money, label: t.navCosts, info: t.navCostsInfo },
    { id: AppView.SHOPPING, icon: Icons.Package, label: t.navShopping, info: t.navShoppingInfo },
    { id: AppView.SUMMARY, icon: Icons.PieChart, label: t.navSummary, info: t.navSummaryInfo },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 pb-safe pt-2 px-6 shadow-2xl z-50 h-[80px] transition-colors duration-300 no-print">
      <div className="flex justify-around items-center h-full pb-2">
        {navItems.map((item) => {
           // Helper to determine if active
           let isActive = currentView === item.id;
           // Keep 'Inicio' active if we are diving into a recipe from the dashboard or settings
           if (item.id === AppView.DASHBOARD && (currentView === AppView.COST_ANALYSIS)) {
             isActive = true;
           }

           const isHovered = hoveredItem === item.id;

           return (
            <div key={item.id} className="relative flex flex-col items-center justify-center">
              {/* Informational Tooltip */}
              {isHovered && (
                <div className="absolute -top-12 bg-amber-950 text-white text-[10px] font-bold py-1 px-3 rounded-lg shadow-lg whitespace-nowrap z-50 animate-bounce">
                  {item.info}
                  <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-950 rotate-45"></div>
                </div>
              )}
              
              <button
                onClick={() => onChangeView(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onTouchStart={() => setHoveredItem(item.id)}
                onTouchEnd={() => setHoveredItem(null)}
                className={`flex flex-col items-center justify-center w-20 transition-colors duration-200 ${
                  isActive ? 'text-amber-600' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                }`}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};