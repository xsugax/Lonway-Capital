import React from 'react';
import aurixTheme from '../theme/aurixTheme';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, actions, children, style, ...props }) => {
  return (
    <div
      style={{
        background: aurixTheme.colors.card,
        borderRadius: aurixTheme.borderRadius,
        boxShadow: aurixTheme.shadow,
        padding: aurixTheme.spacing(3),
        color: aurixTheme.colors.text,
        marginBottom: aurixTheme.spacing(2),
        ...style,
      }}
      {...props}
    >
      {title && <div style={{ fontWeight: aurixTheme.font.weight.bold, fontSize: aurixTheme.font.size.lg, marginBottom: 8 }}>{title}</div>}
      {subtitle && <div style={{ color: aurixTheme.colors.textSecondary, fontSize: aurixTheme.font.size.sm, marginBottom: 16 }}>{subtitle}</div>}
      <div>{children}</div>
      {actions && <div style={{ marginTop: 16 }}>{actions}</div>}
    </div>
  );
};

export default Card;
