// Outline icon geometry on a 24px grid (brief: Lucide style, round caps and joins).
// Components render these inside an aria-hidden <svg> with stroke="currentColor".
export const ICON_STROKE_WIDTH = 2;

export const ICON_PATHS = {
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  alert: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 8v4M12 16h.01',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 16v-4M12 8h.01',
  // Six filled dots (radius 1.7); render with fill="currentColor" and no stroke.
  grip:
    'M10.7 6a1.7 1.7 0 1 1-3.4 0 1.7 1.7 0 0 1 3.4 0ZM16.7 6a1.7 1.7 0 1 1-3.4 0 1.7 1.7 0 0 1 3.4 0Z' +
    'M10.7 12a1.7 1.7 0 1 1-3.4 0 1.7 1.7 0 0 1 3.4 0ZM16.7 12a1.7 1.7 0 1 1-3.4 0 1.7 1.7 0 0 1 3.4 0Z' +
    'M10.7 18a1.7 1.7 0 1 1-3.4 0 1.7 1.7 0 0 1 3.4 0ZM16.7 18a1.7 1.7 0 1 1-3.4 0 1.7 1.7 0 0 1 3.4 0Z',
  bars: 'M5 20V10M12 20V4M19 20v-6',
  singleChoice: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  multipleChoice: 'M8 8h12v12H8zM4 16V4h12',
};
