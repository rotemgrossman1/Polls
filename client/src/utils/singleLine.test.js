import { toSingleLine } from './singleLine';

describe('toSingleLine', () => {
  test.each([
    ['Where\nshould we eat?', 'Where should we eat?'],
    ['Where\r\nshould we eat?', 'Where should we eat?'],
    ['Where\rshould we eat?', 'Where should we eat?'],
    ['a\n\nb', 'a  b'],
    ['Lunch\tnow', 'Lunch now'],
    ['No breaks', 'No breaks'],
  ])('turns %p into %p', (input, expected) => {
    expect(toSingleLine(input)).toBe(expected);
  });
});
