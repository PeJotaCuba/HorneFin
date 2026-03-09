import React from 'react';
import { Icons } from './Icons';
import { AppView } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  t: any;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  t, 
  isOpen, 
  onClose, 
  isCollapsed, 
  toggleCollapse 
}) => {
  const navItems = [
    { id: AppView.DASHBOARD, icon: Icons.Home, label: t.navHome },
    { id: AppView.ORDERS, icon: Icons.Orders, label: t.navOrders },
    { id: AppView.PANTRY, icon: Icons.Money, label: t.navCosts },
    { id: AppView.SHOPPING, icon: Icons.Package, label: t.navShopping },
    { id: AppView.SUMMARY, icon: Icons.PieChart, label: t.navSummary },
    { id: AppView.EVOLUTION, icon: Icons.Up, label: t.navEvolution || 'Evolución' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 transition-colors duration-300">
      {/* Header / Logo Area */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} border-b border-stone-100 dark:border-stone-800`}>
        {!isCollapsed && (
             <div className="flex items-center gap-2">
                 <Logo className="h-8 w-8" showText={false} />
                 <span className="font-extrabold text-stone-800 dark:text-white text-lg tracking-tight">HorneFin</span>
             </div>
        )}
        {isCollapsed && <Logo className="h-8 w-8" showText={false} />}
        
        {/* Desktop Collapse Button */}
        <button 
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
            {isCollapsed ? <Icons.ChevronRight size={20} /> : <Icons.ChevronLeft size={20} />}
        </button>

        {/* Mobile Close Button */}
        <button 
            onClick={onClose}
            className="md:hidden p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
        >
            <Icons.Close size={24} />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
        {navItems.map((item) => {
          let isActive = currentView === item.id;
          if (item.id === AppView.DASHBOARD && (currentView === AppView.COST_ANALYSIS)) {
            isActive = true;
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id);
                // On mobile, close sidebar after selection
                if (window.innerWidth < 768) onClose();
              }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-4'} py-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' 
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
              />
              
              {!isCollapsed && (
                <span className={`ml-3 text-sm font-medium ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              )}

              {/* Active Indicator Strip */}
              {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Info (Optional placeholder) */}
      <div className={`p-4 border-t border-stone-100 dark:border-stone-800 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-xs">
                  HF
              </div>
              {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-800 dark:text-white truncate">Usuario</p>
                      <p className="text-xs text-stone-400 truncate">Pro Version</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
            onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isCollapsed ? 'md:w-20' : 'md:w-64'}
            w-64
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
