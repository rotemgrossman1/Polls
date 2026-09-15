import { computeDragLayout, getTargetIndex } from './dragLayout';

describe('getTargetIndex', () => {
  const centers = [30, 102, 174, 246];

  test.each([
    [0, 30, 0],
    [0, 101, 0],
    [0, 103, 1],
    [0, 200, 2],
    [0, 999, 3],
    [3, 0, 0],
    [3, 150, 2],
    [2, 174, 2],
  ])('row %i with its center at %i lands on %i', (from, draggedCenter, expected) => {
    expect(getTargetIndex(centers, from, draggedCenter)).toBe(expected);
  });
});

describe('computeDragLayout', () => {
  // Three rows, 60px tall with a 12px gap; the middle one is taller (100px).
  const tops = [0, 72, 184];
  const heights = [60, 100, 60];
  const gap = 12;

  test('no movement when the row stays in place', () => {
    expect(computeDragLayout({ tops, heights, gap, from: 1, target: 1 })).toEqual({
      shifts: [0, 0, 0],
      slotTop: 72,
    });
  });

  test('moving the first row to the end shifts the others up by its height plus the gap', () => {
    // New order: row 1 at 0, row 2 at 112, row 0 at 184.
    expect(computeDragLayout({ tops, heights, gap, from: 0, target: 2 })).toEqual({
      shifts: [184, -72, -72],
      slotTop: 184,
    });
  });

  test('moving the last row to the top shifts the others down', () => {
    expect(computeDragLayout({ tops, heights, gap, from: 2, target: 0 })).toEqual({
      shifts: [72, 72, -184],
      slotTop: 0,
    });
  });
});
