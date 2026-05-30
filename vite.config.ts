import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


/** Injects Referly merchant id at build time from `VITE_REFERLY_SITE_ID` (see `.env.production.example`). */
function referlyInitInject() {
  return {
    name: 'referly-init-inject',
    transformIndexHtml(html: string) {
      const id = process.env.VITE_REFERLY_SITE_ID?.trim();
      if (!id) return html;
      return html.replace(
        /window\.referly\(\s*['"]init['"]\s*,\s*['"][^'"]*['"]\s*\)/,
        `window.referly('init', ${JSON.stringify(id)})`,
      );
    },
  };
}

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

/** Vercel waits for Node to exit; Vite/Tailwind can leave handles open and hit the 45m build cap. */
function forceExitAfterBuild() {
  return {
    name: 'force-exit-after-build',
    apply: 'build' as const,
    closeBundle() {
      setTimeout(() => process.exit(0), 0)
    },
  }
}

export default defineConfig({
  plugins: [
    referlyInitInject(),
    figmaAssetResolver(),
    forceExitAfterBuild(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'router';
          if (id.includes('/recharts/') || id.includes('/d3-')) return 'charts';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('zustand')) return 'state';
          if (id.includes('sonner') || id.includes('@radix-ui')) return 'ui';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react';
          return 'vendor';
        },
      },
    },
  },
})
