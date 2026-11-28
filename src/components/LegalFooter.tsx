import React from 'react';

// Pied de page présent sur chaque écran (audit 2.1, 2.2, 2.6) : liens vers les pages légales
export const LegalFooter: React.FC = () => (
  <footer className="border-t border-slate-200 dark:border-slate-800 mt-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
      <p>Euleria 3D · projet éducatif sans publicité · compte à partir de 15 ans</p>
      <nav aria-label="Pages légales" className="flex flex-wrap gap-x-4 gap-y-2">
        <a href="/mentions-legales.html" className="hover:text-slate-900 dark:hover:text-white underline-offset-2 hover:underline">
          Mentions légales
        </a>
        <a href="/confidentialite.html" className="hover:text-slate-900 dark:hover:text-white underline-offset-2 hover:underline">
          Confidentialité
        </a>
        <a href="/cookies.html" className="hover:text-slate-900 dark:hover:text-white underline-offset-2 hover:underline">
          Cookies et stockage
        </a>
      </nav>
    </div>
  </footer>
);
