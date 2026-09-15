import { render, screen } from '@testing-library/react';
import StickerHeading from './StickerHeading';

describe('StickerHeading', () => {
  test('is the page h1 with a decorative icon, tilted like a sticker', () => {
    const { container } = render(<StickerHeading>You're invited</StickerHeading>);

    const heading = screen.getByRole('heading', { level: 1, name: "You're invited" });
    expect(heading).toHaveClass('rounded-full', 'rotate-tilt-sm', 'self-start');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
