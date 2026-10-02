import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveApiOrigin, resolveHttpApiBase } from './api-base.ts';

test('HTTP client uses the Nest /api/v1 prefix', () => {
  assert.equal(resolveHttpApiBase('http://localhost:3001'), 'http://localhost:3001/api/v1');
  assert.equal(resolveHttpApiBase('http://localhost:3001/'), 'http://localhost:3001/api/v1');
  assert.equal(
    `${resolveHttpApiBase('http://localhost:3001')}/auth/login`,
    'http://localhost:3001/api/v1/auth/login',
  );
});

test('an env URL that already includes a version prefix is not doubled', () => {
  assert.equal(
    resolveHttpApiBase('https://api.example.com/api/v1'),
    'https://api.example.com/api/v1',
  );
  assert.equal(
    resolveHttpApiBase('https://api.example.com/api/v2'),
    'https://api.example.com/api/v2',
  );
});

test('websocket origin stays on the host, even if the env URL includes /api/v1', () => {
  assert.equal(resolveApiOrigin('http://localhost:3001'), 'http://localhost:3001');
  assert.equal(resolveApiOrigin('http://localhost:3001/api/v1'), 'http://localhost:3001');
});
