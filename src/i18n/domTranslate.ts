import { makeTextTranslator, type Dict, type Lang } from './core.ts';

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'NOSCRIPT']);

/**
 * Traduit en place tous les textes d'interface affichés (nœuds texte + attributs visibles).
 * Le texte est modifié sur le nœud existant (jamais remplacé) : React garde ses références intactes.
 * Le MutationObserver s'exécute avant l'affichage : aucun flash de français.
 * Exclure une zone (messages saisis par les élèves…) : attribut translate="no".
 */
export function startDomTranslation(dict: Dict, lang: Lang, root: Node = document.body) {
  const translate = makeTextTranslator(dict, lang);
  const skip = (el: Element | null) =>
    !el || SKIP_TAGS.has(el.tagName) || !!el.closest('[translate="no"],[contenteditable="true"]');

  const doText = (node: Text) => {
    const value = node.nodeValue;
    if (!value || !/\p{L}/u.test(value) || skip(node.parentElement)) return;
    const tr = translate(value);
    if (tr == null) return;
    // conserve les espaces de bord (« Bienvenue, » suivi d'un <strong>)
    const out = value.match(/^\s*/)![0] + tr + value.match(/\s*$/)![0];
    if (out !== value) node.nodeValue = out;
  };
  const doAttrs = (el: Element) => {
    if (el.closest('[translate="no"]')) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      const tr = v ? translate(v) : null;
      if (tr && tr !== v) el.setAttribute(a, tr);
    }
  };
  const doTree = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) return doText(n as Text);
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    doAttrs(n as Element);
    const walker = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let cur = walker.nextNode(); cur; cur = walker.nextNode()) {
      if (cur.nodeType === Node.TEXT_NODE) doText(cur as Text);
      else doAttrs(cur as Element);
    }
  };

  doTree(root);
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') doText(r.target as Text);
      else if (r.type === 'attributes') doAttrs(r.target as Element);
      else r.addedNodes.forEach(doTree);
    }
  }).observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  // Libellé hors DOM : titre de l'onglet
  const title = translate(document.title);
  if (title) document.title = title;
}
