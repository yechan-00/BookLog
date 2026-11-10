import { existsSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');

/** Lets the Node test runner import the app's `@/` paths. */
export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith('@/')) {
    return nextResolve(specifier, context);
  }

  const base = resolvePath(root, specifier.slice(2));
  const file = [`${base}.ts`, `${base}.tsx`, base].find((candidate) => existsSync(candidate));
  return nextResolve(pathToFileURL(file ?? base).href, context);
}
