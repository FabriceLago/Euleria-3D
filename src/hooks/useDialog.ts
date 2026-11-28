import { useEffect, useRef } from 'react';

// Fenêtres au clavier (audit 3.7) : à l'ouverture, le focus entre dans la fenêtre ; Tab y reste ;
// Échap ferme (si onClose est fourni) ; à la fermeture, le focus revient là où il était.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialog<T extends HTMLElement = HTMLDivElement>(open: boolean, onClose?: () => void) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const node = ref.current;
    if (!open || !node) return;
    const previous = document.activeElement as HTMLElement | null;
    const items = () => [...(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    items()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCloseRef.current) {
        e.preventDefault();
        e.stopPropagation(); // fenêtre dans une fenêtre : seule la plus proche se ferme
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = items();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      e.stopPropagation();
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // Écoute sur la fenêtre elle-même : le focus y reste (piégé), et la fenêtre la plus interne répond en premier
    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [open]);

  return ref;
}
