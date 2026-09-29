import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./schedule.module.ts', import.meta.url), 'utf8');

test('ScheduleModule registers RestaurantService so Nest can construct ScheduleService', () => {
  assert.match(source, /import \{ RestaurantService \} from '\.\/restaurant\.service'/);
  assert.match(
    source,
    /providers:\s*\[[^\]]*ScheduleService[^\]]*ScheduleRepository[^\]]*RestaurantService[^\]]*\]/,
  );
});
