import historicalCases from './cases.mjs';
// v1 stays available for historical recovery; new evaluations omit the duplicate static pelican.
export const version = 'visual-svg-v2';
export default historicalCases.filter(c => c.id !== 'pelican');
