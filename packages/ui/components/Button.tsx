import React from 'react';
import aurixTheme from '../theme/aurixTheme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  style,
  ...props
}) => {
  const color =
    variant === 'primary' ? aurixTheme.colors.primary :
    variant === 'secondary' ? aurixTheme.colors.surface :
    variant === 'accent' ? aurixTheme.colors.accent :
    variant === 'danger' ? aurixTheme.colors.error :
    aurixTheme.colors.primary;
  const textColor = variant === 'secondary' ? aurixTheme.colors.textSecondary : aurixTheme.colors.text;
  const padding = size === 'sm' ? '8px 16px' : size === 'lg' ? '16px 32px' : '12px 24px';
  const fontSize = size === 'sm' ? aurixTheme.font.size.sm : size === 'lg' ? aurixTheme.font.size.lg : aurixTheme.font.size.md;
  return (
    <button
      style={{
        background: color,
        color: textColor,
        border: 'none',
        borderRadius: aurixTheme.borderRadius,
        padding,
        fontFamily: aurixTheme.font.family,
        fontWeight: aurixTheme.font.weight.bold,
        fontSize,
        boxShadow: aurixTheme.shadow,
        opacity: loading ? 0.7 : 1,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: `background ${aurixTheme.transitions.normal}, color ${aurixTheme.transitions.normal}`,
        ...style,
      }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;
