import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  deleteUser,
  onIdTokenChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { apiUrl } from '../lib/api.ts';
import {
  ensureSupabaseUserProfile,
  fetchSupabaseUserProgress,
  isSupabaseConfigured,
  supabase,
  upsertSupabaseChapterProgress,
} from '../lib/supabase.ts';
import type {
  BadgeItem,
  ChapterProgress,
  PredictionMetrics,
  UserProfile,
} from '../types/learning.ts';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  progress: ChapterProgress[];
  badges: BadgeItem[];
  overallPrediction: PredictionMetrics | null;
  loading: boolean;
  signingIn: boolean;
  authError: string | null;
  idToken: string | null;
  getFreshIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  updateLocalProgress: (prog: ChapterProgress, newXp: number, newBadges?: BadgeItem[]) => void;
  applyXpAndBadges: (newXp: number, newBadges?: BadgeItem[]) => void;
  setProfileState: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  authProviderMode: 'firebase' | 'supabase';
  /** Connecté à Google mais âge minimum pas encore confirmé : aucun compte tant que ce n'est pas fait */
  ageRequired: boolean;
  confirmAge: (birthYear: number, birthMonth: number) => Promise<'ok' | 'under_age' | 'error'>;
  deleteAccount: () => Promise<boolean>;
}

/** Préférences et données locales d'Euleria sur cet appareil (effacées avec le compte). */
function clearLocalEuleriaData() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('euleria')) localStorage.removeItem(key);
    }
  } catch {
    // stockage indisponible
  }
}

/** Supprime la connexion Google côté Firebase (nouvelle authentification si la session est trop ancienne). */
async function deleteFirebaseAccount() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await deleteUser(user);
  } catch (err: unknown) {
    const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code?: unknown }).code) : '';
    if (code !== 'auth/requires-recent-login') throw err;
    await reauthenticateWithPopup(user, googleAuthProvider);
    await deleteUser(user);
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<ChapterProgress[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [overallPrediction, setOverallPrediction] = useState<PredictionMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [authProviderMode, setAuthProviderMode] = useState<'firebase' | 'supabase'>('firebase');
  const [ageRequired, setAgeRequired] = useState<boolean>(false);

  const tokenRef = useRef<string | null>(null);
  const signInPromiseRef = useRef<Promise<boolean> | null>(null);
  const profileRef = useRef<UserProfile | null>(null);
  profileRef.current = profile;

  const isJwtNearExpiry = (jwt: string | null): boolean => {
    if (!jwt) return true;
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof payload.exp !== 'number') return false;
      return payload.exp * 1000 - Date.now() < 90_000;
    } catch {
      return false;
    }
  };

  const getFreshIdToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    if (!auth.currentUser) {
      return null;
    }
    try {
      const shouldForce = forceRefresh || isJwtNearExpiry(tokenRef.current);
      const token = await auth.currentUser.getIdToken(shouldForce);
      tokenRef.current = token;
      setIdToken(token);
      return token;
    } catch {
      return null;
    }
  }, []);

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const buildHeaders = (token: string | null) => {
        const headers = new Headers(options.headers);
        if (!headers.has('Content-Type') && options.body) {
          headers.set('Content-Type', 'application/json');
        }
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
      };

      const activeToken = auth.currentUser ? await getFreshIdToken(false) : tokenRef.current;
      let response = await fetch(apiUrl(url), { ...options, headers: buildHeaders(activeToken) });

      if (response.status === 401 && auth.currentUser) {
        const refreshedToken = await getFreshIdToken(true);
        if (refreshedToken && refreshedToken !== activeToken) {
          response = await fetch(apiUrl(url), {
            ...options,
            headers: buildHeaders(refreshedToken),
          });
        }
      }

      return response;
    },
    [getFreshIdToken]
  );

  const refreshDashboard = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      setProgress([]);
      setBadges([]);
      setOverallPrediction(null);
      return;
    }
    try {
      const res = await apiFetch('/api/me');
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        if (body?.code === 'age_required') {
          // Connecté à Google mais pas encore de compte : l'écran d'âge s'affiche
          setProfile(null);
          setAgeRequired(true);
          return;
        }
      }
      if (!res.ok) {
        throw new Error('Impossible de synchroniser le profil élève.');
      }
      const data = await res.json();
      setAgeRequired(false);
      setProfile(data.user);
      setProgress(data.progress || []);
      setBadges(data.badges || []);
      setOverallPrediction(data.overallPrediction || null);
      setAuthError(null);
    } catch (err) {
      console.error('Dashboard sync error:', err);
    }
  }, [apiFetch]);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setAuthProviderMode('firebase');
        try {
          const token = await user.getIdToken();
          tokenRef.current = token;
          setIdToken(token);
          await refreshDashboard();
        } catch {
          tokenRef.current = null;
          setIdToken(null);
        }
      } else {
        tokenRef.current = null;
        setIdToken(null);
        if (!isSupabaseConfigured) {
          setProfile(null);
          setProgress([]);
          setBadges([]);
          setOverallPrediction(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [refreshDashboard]);

  // Synchronisation automatique Supabase Auth si configuré (déploiement statique Hostinger / Vercel)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let active = true;

    async function syncSupabaseSession() {
      if (!supabase || auth.currentUser) return;
      const { data } = await supabase.auth.getSession();
      const sbUser = data.session?.user;
      if (!active || !sbUser) return;
      const mapped = await ensureSupabaseUserProfile(sbUser);
      if (!active || !mapped) return;
      setAuthProviderMode('supabase');
      setProfile(mapped);
      const progRows = await fetchSupabaseUserProgress(mapped.id);
      if (active) setProgress(progRows);
      setLoading(false);
    }

    syncSupabaseSession();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active || auth.currentUser) return;
      if (session?.user) {
        const mapped = await ensureSupabaseUserProfile(session.user);
        if (!active || !mapped) return;
        setAuthProviderMode('supabase');
        setProfile(mapped);
        const progRows = await fetchSupabaseUserProgress(mapped.id);
        if (active) setProgress(progRows);
      } else if (authProviderMode === 'supabase') {
        setProfile(null);
        setProgress([]);
        setBadges([]);
        setOverallPrediction(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [authProviderMode]);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    if (auth.currentUser) {
      return true;
    }
    if (signInPromiseRef.current) {
      return signInPromiseRef.current;
    }

    setAuthError(null);
    setSigningIn(true);

    const pending = (async () => {
      try {
        // Si Supabase est configuré et que le backend Express n'est pas actif, utiliser Supabase Auth OAuth
        if (isSupabaseConfigured && supabase) {
          let backendReachable = false;
          try {
            const probe = await fetch(apiUrl('/api/health'));
            backendReachable =
              probe.ok && (probe.headers.get('content-type') || '').includes('application/json');
          } catch {
            backendReachable = false;
          }
          if (!backendReachable) {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: window.location.origin },
            });
            if (error) {
              setAuthError(
                'Connexion Google Supabase indisponible. Vérifiez que le fournisseur Google est activé dans Supabase Auth.'
              );
              return false;
            }
            return true;
          }
        }

        const credential = await signInWithPopup(auth, googleAuthProvider);
        const token = await credential.user.getIdToken();
        tokenRef.current = token;
        setIdToken(token);
        await refreshDashboard();
        return true;
      } catch (err: unknown) {
        const code =
          typeof err === 'object' && err !== null && 'code' in err
            ? String((err as { code?: unknown }).code)
            : '';

        if (
          code === 'auth/cancelled-popup-request' ||
          code === 'auth/popup-closed-by-user'
        ) {
          // Annulation volontaire ou clic concurrent déjà ignoré : aucune erreur bloquante
          return false;
        }

        if (code === 'auth/popup-blocked') {
          setAuthError(
            'La fenêtre de connexion Google a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up pour ce site.'
          );
          return false;
        }

        if (code === 'auth/unauthorized-domain') {
          setAuthError(
            `Le domaine « ${window.location.hostname} » n'est pas encore autorisé dans Firebase Authentication (Console Firebase → Authentication → Settings → Authorized domains).`
          );
          return false;
        }

        console.warn('Google sign-in error:', err);
        setAuthError('La connexion Google a échoué. Veuillez réessayer.');
        return false;
      } finally {
        signInPromiseRef.current = null;
        setSigningIn(false);
      }
    })();

    signInPromiseRef.current = pending;
    return pending;
  }, [refreshDashboard]);

  const logout = useCallback(async () => {
    if (auth.currentUser) {
      await signOut(auth);
    }
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setProfile(null);
    setProgress([]);
    setBadges([]);
    setOverallPrediction(null);
    setAgeRequired(false);
  }, []);

  // Âge minimum : 15 ans ou plus → compte créé ; sinon la connexion Google est effacée (aucun compte)
  const confirmAge = useCallback(
    async (birthYear: number, birthMonth: number): Promise<'ok' | 'under_age' | 'error'> => {
      try {
        const res = await apiFetch('/api/me/age', {
          method: 'POST',
          body: JSON.stringify({ birthYear, birthMonth }),
        });
        if (res.ok) {
          setAgeRequired(false);
          await refreshDashboard();
          return 'ok';
        }
        const body = await res.json().catch(() => ({}));
        if (body?.code === 'under_age') {
          try {
            await deleteFirebaseAccount();
          } catch {
            // échec de suppression Firebase : la déconnexion suffit, aucun compte n'existe côté Euleria
          }
          await logout();
          return 'under_age';
        }
        return 'error';
      } catch {
        return 'error';
      }
    },
    [apiFetch, refreshDashboard, logout]
  );

  // Suppression réelle du compte : données effacées sur le serveur, puis connexion Google, puis données locales
  const deleteAccount = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/me', { method: 'DELETE' });
      if (!res.ok) return false;
      try {
        await deleteFirebaseAccount();
      } catch (err) {
        console.warn('Firebase account deletion failed:', err);
      }
      clearLocalEuleriaData();
      await logout();
      return true;
    } catch {
      return false;
    }
  }, [apiFetch, logout]);

  const updateLocalProgress = useCallback(
    (prog: ChapterProgress, newXp: number, newBadges: BadgeItem[] = []) => {
      setProgress((prev) => {
        const idx = prev.findIndex((p) => p.chapterId === prog.chapterId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = prog;
          return copy;
        }
        return [...prev, prog];
      });
      const currentProfile = profileRef.current;
      const computedXp = newXp > 0 ? newXp : (currentProfile?.xp ?? 0);
      setProfile((prev) => (prev ? { ...prev, xp: computedXp } : prev));
      if (authProviderMode === 'supabase' && currentProfile && isSupabaseConfigured) {
        void upsertSupabaseChapterProgress(currentProfile.id, prog, computedXp);
      }
      if (newBadges.length > 0) {
        const unlockedIds = new Set(newBadges.map((b) => b.id));
        setBadges((prev) =>
          prev.map((b) =>
            unlockedIds.has(b.id)
              ? { ...b, earned: true, awardedAt: new Date().toISOString() }
              : b
          )
        );
      }
    },
    [authProviderMode]
  );

  const applyXpAndBadges = useCallback((newXp: number, newBadges: BadgeItem[] = []) => {
    setProfile((prev) => (prev ? { ...prev, xp: newXp } : prev));
    if (newBadges.length > 0) {
      const unlockedIds = new Set(newBadges.map((b) => b.id));
      setBadges((prev) =>
        prev.map((b) =>
          unlockedIds.has(b.id)
            ? { ...b, earned: true, awardedAt: new Date().toISOString() }
            : b
        )
      );
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        progress,
        badges,
        overallPrediction,
        loading,
        signingIn,
        authError,
        idToken,
        getFreshIdToken,
        signInWithGoogle,
        logout,
        refreshDashboard,
        apiFetch,
        updateLocalProgress,
        applyXpAndBadges,
        setProfileState: setProfile,
        authProviderMode,
        ageRequired,
        confirmAge,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider.');
  }
  return ctx;
}
