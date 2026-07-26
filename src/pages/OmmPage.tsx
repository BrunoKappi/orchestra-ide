import React, { useEffect } from 'react';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { OmmLayout } from '../features/omm/components/OmmLayout';
import { useObjectModelStore } from '../store/useObjectModelStore';

export const OmmPage: React.FC = () => {
  const { theme } = useObjectModelStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <HeaderNavigation />
      <main className="flex-1 overflow-hidden">
        <OmmLayout />
      </main>
    </div>
  );
};
