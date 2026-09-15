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
  // Single choice is a stroked ring plus a filled center dot.
  singleChoice: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  singleChoiceDot: 'M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z',
  multipleChoice: 'M8 8h12v12H8zM4 16V4h12',
  // Two chain links joined at an angle.
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7L11.8 5.2M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  // The two chain links pulled apart, with break marks at the gap.
  brokenLink:
    'M18.8 13.4l1.7-1.7a5 5 0 0 0-7.1-7.1l-1.7 1.7M5.2 10.6l-1.7 1.7a5 5 0 0 0 7.1 7.1l1.7-1.7' +
    'M8 2v3M2 8h3M16 22v-3M22 16h-3',
  // A front sheet with a second sheet peeking out behind its top left.
  copy:
    'M10 9h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z' +
    'M5 15h-.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5',
  // An arrow rising out of an open tray.
  share: 'M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  home: 'M3 11l9-8 9 8M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
  // Three lines with a round dot before each.
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
};
