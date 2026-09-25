import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const menuDir = path.dirname(fileURLToPath(import.meta.url));
const pagePath = path.join(menuDir, 'page.tsx');

test('menu page imports the existing menu section', () => {
  const source = fs.readFileSync(pagePath, 'utf8');
  const match = source.match(/import MenuSectionFixed from '([^']+)'/);
  assert.ok(match, 'menu page must import MenuSectionFixed');

  const resolved = path.resolve(menuDir, match[1]);
  const candidates = [resolved, `${resolved}.tsx`, `${resolved}.ts`];
  assert.ok(
    candidates.some((candidate) => fs.existsSync(candidate)),
    `Menu page import '${match[1]}' does not resolve to a file`,
  );
});
