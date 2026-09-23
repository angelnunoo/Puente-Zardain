import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFetchInit } from './http.ts';

test('authorized JSON requests keep Content-Type and Authorization', () => {
  const body = JSON.stringify({
    items: [{ productId: 'prod-1', quantity: 2 }],
    delivery: false,
    paymentMethod: 'CASH',
  });

  const init = buildFetchInit({
    method: 'POST',
    headers: {
      Authorization: 'Bearer token',
    },
    body,
  });

  const headers = init.headers as Record<string, string>;
  assert.equal(headers['Content-Type'], 'application/json');
  assert.equal(headers.Authorization, 'Bearer token');
  assert.equal(init.method, 'POST');
  assert.equal(init.body, body);
});

test('caller content type still overrides the JSON default', () => {
  const init = buildFetchInit({
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Authorization: 'Bearer token',
    },
    body: 'raw',
  });

  const headers = init.headers as Record<string, string>;
  assert.equal(headers['Content-Type'], 'text/plain');
  assert.equal(headers.Authorization, 'Bearer token');
});
