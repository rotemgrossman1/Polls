import { moveItem } from './reorder';

describe('moveItem', () => {
  const list = ['A', 'B', 'C', 'D'];

  test.each([
    [0, 2, ['B', 'C', 'A', 'D']],
    [3, 0, ['D', 'A', 'B', 'C']],
    [1, 2, ['A', 'C', 'B', 'D']],
    [2, 1, ['A', 'C', 'B', 'D']],
  ])('moves index %i to %i', (from, to, expected) => {
    expect(moveItem(list, from, to)).toEqual(expected);
  });

  test('does not change the original list', () => {
    moveItem(list, 0, 3);

    expect(list).toEqual(['A', 'B', 'C', 'D']);
  });

  test.each([
    [1, 1],
    [-1, 2],
    [0, 4],
    [5, 0],
  ])('returns the same list for a no-op or out-of-range move (%i to %i)', (from, to) => {
    expect(moveItem(list, from, to)).toBe(list);
  });
});
