import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const checkoutDir = path.dirname(fileURLToPath(import.meta.url));
const pagePath = path.join(checkoutDir, 'page.tsx');

test('checkout page imports PaymentMethod from the shared enums module', () => {
  const source = fs.readFileSync(pagePath, 'utf8');
  const match = source.match(/import \{ PaymentMethod \} from '([^']+)'/);
  assert.ok(match, 'checkout page must import PaymentMethod');

  const resolved = path.resolve(checkoutDir, match[1]);
  const candidates = [resolved, `${resolved}.ts`, `${resolved}.tsx`];
  assert.ok(
    candidates.some((candidate) => fs.existsSync(candidate)),
    `Checkout import '${match[1]}' does not resolve to a file`,
  );
});
