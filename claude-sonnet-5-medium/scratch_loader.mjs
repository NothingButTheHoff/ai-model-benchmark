import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !specifier.endsWith('.js') && !specifier.endsWith('.mjs') && !specifier.endsWith('.jsx')) {
    const base = fileURLToPath(new URL(specifier, context.parentURL));
    if (existsSync(`${base}.js`)) {
      return nextResolve(`${specifier}.js`, context);
    }
  }
  return nextResolve(specifier, context);
}
