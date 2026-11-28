import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

/** Clé Supabase qui ne doit jamais partir dans le navigateur (elle contourne la RLS). */
function isSupabaseSecretKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  const payload = key.split('.')[1]; // ancienne clé JWT « service_role »
  if (!payload) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role === 'service_role';
  } catch {
    return false;
  }
}

export default defineConfig(({mode}) => {
  // Garde-fou : une clé secrète mise par erreur dans VITE_SUPABASE_ANON_KEY n'est jamais intégrée au bundle
  const supabaseKey = (loadEnv(mode, process.cwd(), 'VITE_').VITE_SUPABASE_ANON_KEY || '').trim();
  const secretKeyLeak = isSupabaseSecretKey(supabaseKey);
  if (secretKeyLeak) {
    console.warn(
      '\n⚠️  VITE_SUPABASE_ANON_KEY contient une clé SECRÈTE Supabase : elle est retirée du bundle.\n' +
        '    Mettez la clé publique (sb_publishable_…) ou supprimez la variable, puis révoquez la clé secrète.\n'
    );
  }
  return {
    define: secretKeyLeak ? {'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('')} : {},
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // Nouvelle version : l'élève voit « Mise à jour disponible » et recharge quand il veut (audit 3.9)
        registerType: 'prompt',
        injectRegister: false, // enregistrement fait dans src/components/UpdatePrompt.tsx
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'Euleria 3D — Plateforme de Révisions & WebGL',
          short_name: 'Euleria 3D',
          description:
            'Plateforme interactive de révisions (6ᵉ à Terminale) avec modèles 3D WebGL, flashcards SM-2, quiz dynamiques et examens blancs.',
          theme_color: '#4f46e5',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          // Hors ligne, seule l'adresse de l'app est servie depuis le cache : une page inconnue garde sa vraie 404
          navigateFallbackAllowlist: [/^\/(index\.html)?$/],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /\/api\/curriculum$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'euleria-curriculum-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(import.meta.dirname, 'dist');
          const srcAssets = path.resolve(import.meta.dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor-three',
                test: /node_modules\/three/,
              },
              {
                name: 'vendor-firebase',
                test: /node_modules\/(@?firebase)/,
              },
              {
                name: 'vendor-supabase',
                test: /node_modules\/@supabase/,
              },
              {
                name: 'curriculum-data',
                test: /src\/db\/(curriculumData|physicsChemistryData|svtData|historyGeographyData|frenchPhilosophyData|englishLv1Data)/,
              },
            ],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
