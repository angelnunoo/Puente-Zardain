import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toOrderPayloadItems } from './order-items.ts';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('toOrderPayloadItems', () => {
  it('strips cart-only fields that AppValidationPipe would reject', () => {
    assert.deepEqual(
      toOrderPayloadItems([
        {
          productId: 'burger-1',
          name: 'Hamburguesa',
          price: 12.5,
          image: '/images/burger.jpg',
          quantity: 2,
          customizations: 'sin cebolla',
        },
        {
          productId: 'fries-1',
          name: 'Patatas',
          price: 4.5,
          quantity: 1,
        },
      ]),
      [
        { productId: 'burger-1', quantity: 2, customizations: 'sin cebolla' },
        { productId: 'fries-1', quantity: 1 },
      ],
    );
  });
});

describe('root layout notifications provider', () => {
  it('wraps the app so checkout and incidents can call useNotifications', () => {
    const layout = readFileSync(join(srcRoot, 'app/layout.tsx'), 'utf8');
    assert.match(layout, /NotificationsProvider/);
    assert.match(
      layout,
      /<NotificationsProvider>[\s\S]*\{children\}[\s\S]*<\/NotificationsProvider>/,
    );
  });
});
