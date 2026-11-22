import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { parseLang } from './i18n/core.ts';
import { detectLang, I18nProvider, loadDict } from './i18n/I18nProvider.tsx';
import { setApiLang } from './lib/api.ts';
import { startDomTranslation } from './i18n/domTranslate.ts';

const urlLang = new URLSearchParams(window.location.search).get('lang');
const lang = urlLang ? parseLang(urlLang) : detectLang();
document.documentElement.lang = lang;
setApiLang(lang);

// Le dictionnaire est chargé avant le premier rendu : pas de flash de texte français
loadDict(lang)
  .catch(() => ({}))
  .then((dict) => {
    // Interface entière (textes en dur des composants) traduite à l'affichage
    if (lang !== 'fr') startDomTranslation(dict);
    createRoot(document.getElementById('root')!).render(
      <I18nProvider lang={lang} dict={dict}>
        <App />
      </I18nProvider>
    );
  });
