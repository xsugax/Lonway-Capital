// Premium fintech design system theme for Londway Capital UI
export const aurixTheme = {
  colors: {
    primary: '#C4A052',
    secondary: '#060913',
    accent: '#7fffd4',
    background: '#060913',
    surface: '#0D1628',
    error: '#ff4d4f',
    warning: '#ffb300',
    info: '#2196f3',
    success: '#00e676',
    text: '#EAE0D0',
    textSecondary: '#60707E',
    border: 'rgba(196,160,82,0.15)',
    card: '#09101F',
    highlight: 'rgba(196,160,82,0.13)',
    shadow: '0 2px 8px rgba(196,160,82,0.07)',
  },
  font: {
    family: 'Inter, sans-serif',
    weight: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
    size: {
      xs: '0.75rem',
      sm: '0.9rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '2rem',
    },
  },
  borderRadius: 12,
  spacing: (factor: number) => `${factor * 8}px`,
  shadow: '0 2px 8px rgba(196,160,82,0.07)',
  transitions: {
    fast: '0.15s',
    normal: '0.3s',
    slow: '0.5s',
  },
  zIndex: {
    modal: 1000,
    popover: 900,
    tooltip: 1100,
  },
  // ...extend with charts, buttons, cards, etc.
};

export default aurixTheme;
