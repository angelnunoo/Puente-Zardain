import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const source = readFileSync(new URL('./interfaces.ts', import.meta.url), 'utf8');

test('shared interfaces module parses', () => {
  const isolated = source.replace(/import\s*\{[\s\S]*?\}\s*from '\.\/enums';\r?\n/, '');
  const dir = mkdtempSync(path.join(tmpdir(), 'interfaces-'));
  const file = path.join(dir, 'interfaces.ts');
  writeFileSync(file, isolated);

  const result = spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      '--input-type=module',
      '-e',
      `await import(${JSON.stringify(pathToFileURL(file).href)})`,
    ],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
});

test('public schedule response names a schedule window type', () => {
  assert.match(source, /export interface ScheduleWindow \{/);
  assert.match(source, /windows: ScheduleWindow\[\]/);
  assert.doesNotMatch(source, /\}\r?\n {2}updatedAt: string;\r?\n\}/);
});
