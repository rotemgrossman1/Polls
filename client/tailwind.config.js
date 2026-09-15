// Maps design tokens (client/src/styles/tokens.css) to Tailwind classes.
// Default palette, spacing, radii, and type scale are replaced, so only token-backed
// classes exist (bg-surface, p-4, rounded-md, text-sm, ...).
const token = (name) => `var(--${name})`;

const spacing = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [String(i + 1), token(`space-${i + 1}`)]),
);

module.exports = {
  // Relative to this file, so builds work from any working directory.
  content: {
    relative: true,
    files: ['./index.html', './src/**/*.{js,jsx}'],
  },
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: token('color-bg'),
      surface: token('color-surface'),
      'surface-raised': token('color-surface-raised'),
      border: token('color-border'),
      'border-strong': token('color-border-strong'),
      scrim: token('color-scrim'),
      text: token('color-text'),
      'text-muted': token('color-text-muted'),
      'text-inverse': token('color-text-inverse'),
      action: token('color-action'),
      'action-hover': token('color-action-hover'),
      'action-text': token('color-action-text'),
      'action-subtle': token('color-action-subtle'),
      focus: token('color-focus'),
      success: token('color-success'),
      'success-subtle': token('color-success-subtle'),
      warning: token('color-warning'),
      'warning-subtle': token('color-warning-subtle'),
      danger: token('color-danger'),
      'danger-subtle': token('color-danger-subtle'),
      'chart-1': token('chart-1'),
      'chart-2': token('chart-2'),
      'chart-3': token('chart-3'),
      'chart-4': token('chart-4'),
      'chart-5': token('chart-5'),
      'chart-6': token('chart-6'),
      'chart-7': token('chart-7'),
      'chart-8': token('chart-8'),
      'chart-track': token('chart-track'),
      'chart-highlight': token('chart-highlight'),
    },
    spacing: {
      0: '0',
      ...spacing,
      touch: token('touch-target-min'),
    },
    fontFamily: {
      sans: token('font-sans'),
    },
    fontSize: {
      xs: token('text-xs'),
      sm: token('text-sm'),
      base: token('text-base'),
      lg: token('text-lg'),
      xl: token('text-xl'),
      '2xl': token('text-2xl'),
      '3xl': token('text-3xl'),
    },
    fontWeight: {
      regular: token('weight-regular'),
      medium: token('weight-medium'),
      bold: token('weight-bold'),
    },
    lineHeight: {
      tight: token('leading-tight'),
      normal: token('leading-normal'),
    },
    borderRadius: {
      none: '0',
      sm: token('radius-sm'),
      md: token('radius-md'),
      lg: token('radius-lg'),
      full: token('radius-full'),
    },
    // Catalog: controls and cards use 2px outlines.
    borderWidth: {
      DEFAULT: '2px',
      0: '0',
      2: '2px',
    },
    boxShadow: {
      none: 'none',
      sm: token('shadow-sm'),
      md: token('shadow-md'),
      lg: token('shadow-lg'),
    },
    transitionDuration: {
      fast: token('duration-fast'),
      base: token('duration-base'),
    },
    transitionTimingFunction: {
      standard: token('ease-standard'),
      emphasized: token('ease-emphasized'),
    },
    rotate: {
      0: '0deg',
      'tilt-sm': token('rotate-tilt-sm'),
      'tilt-md': token('rotate-tilt-md'),
    },
    zIndex: {
      0: '0',
      dropdown: token('z-dropdown'),
      modal: token('z-modal'),
      toast: token('z-toast'),
    },
    extend: {
      maxWidth: {
        container: token('container-max'),
        // Catalog: ConfirmDialog max width from md up.
        dialog: '28rem',
      },
      minHeight: {
        touch: token('touch-target-min'),
      },
      minWidth: {
        touch: token('touch-target-min'),
      },
      width: {
        'success-mark': `calc(${token('space-12')} + ${token('space-6')})`,
      },
      height: {
        'success-mark': `calc(${token('space-12')} + ${token('space-6')})`,
      },
      // Catalog: focus rings are a 3px outline; primary buttons press down 2px.
      outlineWidth: {
        3: '3px',
      },
      translate: {
        press: '2px',
        lift: '-1px',
      },
      keyframes: {
        'skeleton-pulse': {
          from: { opacity: '1' },
          to: { opacity: '0.5' },
        },
        'dialog-in': {
          from: { opacity: '0', transform: `translateY(${token('space-4')})` },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'skeleton-pulse': `skeleton-pulse 1.4s ${token('ease-standard')} infinite alternate`,
        'dialog-in': `dialog-in ${token('duration-base')} ${token('ease-standard')}`,
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
};
