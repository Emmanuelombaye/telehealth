/**
 * Vercel waits for Node to exit; `vite build` alone can hang after "✓ built".
 * Programmatic build + explicit exit avoids open handles from the CLI.
 */
import { build } from 'vite';

await build();
process.exit(0);
