import test from 'node:test';
import assert from 'node:assert/strict';
import { withThinkingEffort } from '../lib/extra-params.ts';

test('effort is opt-in, merges without losing options, and can return to default', () => {
  assert.equal(withThinkingEffort('', 'reasoning', ''), '');
  const original = { max_tokens: 8192, reasoning: { exclude: true }, provider: { max_price: { completion: 0 } } };
  const low = withThinkingEffort(JSON.stringify(original), 'reasoning', 'low');
  assert.deepEqual(JSON.parse(low), { ...original, reasoning: { exclude: true, effort: 'low' } });
  const high = withThinkingEffort(low, 'reasoning_effort', 'high');
  assert.deepEqual(JSON.parse(high), { ...original, reasoning_effort: 'high' });
  assert.deepEqual(JSON.parse(withThinkingEffort(high, 'reasoning', '')), original);
  for (const invalid of ['null', '[]', 'broken']) assert.throws(() => withThinkingEffort(invalid, 'reasoning', 'low'));
});
