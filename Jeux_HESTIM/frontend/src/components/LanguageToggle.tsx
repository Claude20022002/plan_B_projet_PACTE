import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'fr';
    const nextLang = currentLang.includes('fr') ? 'en' : 'fr';
    console.log('Changing language from', currentLang, 'to', nextLang);
    i18n.changeLanguage(nextLang);
  };

  const isFrench = (i18n.language || 'fr').includes('fr');

  return (
    <button
      onClick={toggleLanguage}
      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-2 group"
      title={isFrench ? 'Switch to English' : 'Passer au Français'}
    >
      <Languages className="w-5 h-5 text-blue-700 dark:text-blue-400 group-hover:rotate-12 transition-transform" />
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
        {isFrench ? 'EN' : 'FR'}
      </span>
    </button>
  );
};

export default LanguageToggle;
