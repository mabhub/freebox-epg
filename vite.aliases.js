import path from 'node:path';

/**
 * Resolve config aliases shared by Vite (build/dev) and Vitest (tests).
 * Keep this file framework-agnostic so it can be imported by any tool.
 */
const aliases = {
  '@': path.resolve(import.meta.dirname, 'src'),
};

export default aliases;
