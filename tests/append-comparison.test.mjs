import test from 'node:test';
import assert from 'node:assert/strict';
import { retainedComparison } from '../lib/append-comparison.ts';
import { buildSnapshot } from '../lib/share.ts';

test('retained results are immutable, credential-free, unranked, and keep provenance through sharing', () => {
  const result = { name: 'Old', model: 'old', provider: 'https://private.example', status: 'done', text: 'old answer', reasoning: 'old reasoning', rank: 1, metrics: { official: true, outputTokens: 20 }, samples: [{ t: 100, tps: 10 }] };
  const source = { id: 'old-id', at: 123, title: '', notes: '', prompt: 'x'.repeat(9000), source: { kind: 'share', id: 'share-id' }, results: [result] };
  const before = structuredClone(source);
  const kept = retainedComparison(source);
  assert.equal(kept.endpoints[0].apiKey, '');
  const run = kept.runs['retained-0'];
  assert.equal(run.rank, undefined);
  assert.equal(run.origin.kind, 'share');
  assert.equal(run.text, result.text);
  assert.deepEqual(run.metrics, result.metrics);
  const snapshot = buildSnapshot({ ...source, hasImage: true, watermark: '', thinkingStats: true, rows: [{ name: result.name, model: result.model, run }] });
  assert.equal(snapshot.prompt, source.prompt, 'do not truncate a prompt that can be used for append');
  assert.equal(snapshot.hasImage, true);
  assert.deepEqual(snapshot.results[0].origin, run.origin);
  assert.ok(!JSON.stringify(snapshot).includes('private.example'));
  assert.deepEqual(source, before);
});

test('completed, stopped and failed rows without metrics remain shareable', () => {
  const rows = ['done', 'stopped', 'error'].map(status => ({name: status, model: status,
    run: {status, metrics: null, text: '', reasoning: '', samples: []}}));
  const snapshot = buildSnapshot({title:'',notes:'',prompt:'task',watermark:'',thinkingStats:true,rows});
  assert.deepEqual(snapshot.results.map(r => r.status), ['done', 'stopped', 'error']);
});
