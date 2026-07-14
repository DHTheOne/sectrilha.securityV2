import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

test('runtime dependencies exclude removed cloud, chat and analytics SDKs', () => {
  const dependencyNames = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ]);

  for (const removedPackage of ['firebase', '@google/genai', 'express', 'vite', 'motion']) {
    assert.equal(dependencyNames.has(removedPackage), false, `${removedPackage} must not be installed`);
  }
});
