import { moveItem } from './reorder';

// Index the dragged row lands on: the number of other rows whose center it has passed.
export function getTargetIndex(centers, from, draggedCenter) {
  return centers.reduce(
    (target, center, index) => (index !== from && draggedCenter > center ? target + 1 : target),
    0,
  );
}

/**
 * Where rows sit if the row at `from` is dropped at `target`.
 * tops/heights are measured at drag start, relative to the list container.
 * Returns each row's vertical shift and the top of the drop slot.
 */
export function computeDragLayout({ tops, heights, gap, from, target }) {
  const order = moveItem(
    tops.map((_, index) => index),
    from,
    target,
  );
  const newTops = [];
  let y = tops[0];
  order.forEach((index) => {
    newTops[index] = y;
    y += heights[index] + gap;
  });

  return {
    shifts: tops.map((top, index) => newTops[index] - top),
    slotTop: newTops[from],
  };
}
