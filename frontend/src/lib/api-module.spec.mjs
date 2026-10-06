import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

const sourceUrl = new URL('./api.ts', import.meta.url);
const source = readFileSync(sourceUrl, 'utf8');

test('api client loads with one analyticsApi and one zardasApi', () => {
  assert.equal((source.match(/^export const analyticsApi = \{/gm) || []).length, 1);
  assert.equal((source.match(/^export const zardasApi = \{/gm) || []).length, 1);

  const dir = mkdtempSync(join(tmpdir(), 'api-client-'));
  const file = join(dir, 'api.ts');
  writeFileSync(file, source.replace(/^import .*;$/gm, ''));

  const probe = `
    import * as api from ${JSON.stringify(pathToFileURL(file).href)};
    const analytics = Object.keys(api.analyticsApi);
    const zardas = Object.keys(api.zardasApi);
    const required = [
      'getActivitySignals',
      'getPopularProducts',
      'getDashboardMetrics',
      'getSalesReport',
      'getLoyaltyData',
      'getBalance',
      'getHistory',
      'redeemZardas',
    ];
    for (const method of required) {
      if (!analytics.includes(method) && !zardas.includes(method)) {
        throw new Error('missing ' + method);
      }
    }
    console.log('ok');
  `;

  const result = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', probe], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ok/);
});
