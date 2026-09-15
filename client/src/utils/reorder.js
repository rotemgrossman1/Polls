// Returns a new list with the item at fromIndex moved to toIndex.
export function moveItem(list, fromIndex, toIndex) {
  const inRange = (index) => Number.isInteger(index) && index >= 0 && index < list.length;
  if (fromIndex === toIndex || !inRange(fromIndex) || !inRange(toIndex)) {
    return list;
  }
  const next = list.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
