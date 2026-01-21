import React, { useRef } from 'react';
import { Icons } from './Icons';
import { Logo } from './Logo';
import { Language } from '../utils/translations';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onDownloadBackup: () => void;
  onRestoreBackup: (data: any) => void;
  isCompact?: boolean;
  t: any;
}

export const Header: React.FC<HeaderProps> = ({ 
  darkMode, 
  toggleDarkMode, 
  language, 
  setLanguage, 
  onDownloadBackup, 
  onRestoreBackup,
  isCompact = false,
  t
}) => {
  const backupInputRef = useRef<HTMLInputElement>(null);
  const availableLanguages: Language[] = ['ES', 'EN', 'PT'];

  const toggleLanguage = () => {
    const currentIndex = availableLanguages.indexOf(language);
    const nextIndex = (currentIndex + 1) % availableLanguages.length;
    setLanguage(availableLanguages[nextIndex]);
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onRestoreBackup(json);
        alert(t.restoreSuccess);
      } catch (err) {
        alert(t.restoreError);
      }
    };
    reader.readAsText(file);
    if (backupInputRef.current) backupInputRef.current.value = '';
  };

  return (
    <div className={`bg-white dark:bg-stone-900 shadow-sm sticky top-0 z-50 border-b border-stone-100 dark:border-stone-800 transition-all duration-300 ${isCompact ? 'py-2 px-4' : 'py-4 px-6'}`}>
      <div className="flex justify-between items-center max-w-md mx-auto">
        <div className="flex-shrink-0">
          <Logo 
            className={`transition-all duration-300 ${isCompact ? 'h-10' : 'h-14'} w-auto`} 
            showText={true} 
            subtitle={t.logoSubtitle}
          />
        </div>
        <div className="flex gap-2 items-center">
          
          <button 
            onClick={toggleLanguage}
            className={`rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center justify-center font-bold text-xs ${isCompact ? 'w-8 h-8' : 'w-9 h-9 p-2'}`}
            title={t.language}
          >
             {language}
          </button>

          <button 
            onClick={toggleDarkMode}
            className={`rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center justify-center ${isCompact ? 'w-8 h-8' : 'w-9 h-9 p-2'}`}
            title={t.darkMode}
          >
             {darkMode ? <Icons.Sun size={isCompact ? 16 : 20} /> : <Icons.Moon size={isCompact ? 16 : 20} />}
          </button>
          
          <button 
            onClick={onDownloadBackup}
            className={`rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center justify-center ${isCompact ? 'w-8 h-8' : 'w-9 h-9 p-2'}`}
            title={t.downloadBackup}
          >
             <Icons.Download size={isCompact ? 16 : 20} />
          </button>

          <div className="relative">
             <button 
               onClick={() => backupInputRef.current?.click()}
               className={`rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center justify-center ${isCompact ? 'w-8 h-8' : 'w-9 h-9 p-2'}`}
               title={t.uploadBackup}
             >
               <Icons.UploadDB size={isCompact ? 16 : 20} />
             </button>
             <input 
                ref={backupInputRef}
                type="file" 
                accept=".json"
                className="hidden"
                onChange={handleBackupUpload}
             />
          </div>
        </div>
      </div>
    </div>
  );
};