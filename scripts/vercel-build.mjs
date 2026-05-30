/**
 * Vercel waits for Node to exit; `vite build` alone can hang after "✓ built".
 */
import { build } from 'vite';

await build();
process.exit(0);
