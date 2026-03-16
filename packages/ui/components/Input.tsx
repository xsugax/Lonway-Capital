import React from 'react';
import aurixTheme from '../theme/aurixTheme';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helperText, style, ...props }) => {
  return (
    <div style={{ marginBottom: aurixTheme.spacing(2) }}>
      {label && <label style={{ display: 'block', color: aurixTheme.colors.text, fontWeight: aurixTheme.font.weight.medium, marginBottom: 6 }}>{label}</label>}
      <input
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: aurixTheme.borderRadius,
          border: `1px solid ${error ? aurixTheme.colors.error : aurixTheme.colors.border}`,
          background: aurixTheme.colors.surface,
          color: aurixTheme.colors.text,
          fontFamily: aurixTheme.font.family,
          fontSize: aurixTheme.font.size.md,
          outline: 'none',
          boxShadow: error ? `0 0 0 2px ${aurixTheme.colors.error}33` : aurixTheme.shadow,
          transition: `border ${aurixTheme.transitions.normal}, box-shadow ${aurixTheme.transitions.normal}`,
          ...style,
        }}
        {...props}
      />
      {helperText && <div style={{ color: aurixTheme.colors.textSecondary, fontSize: aurixTheme.font.size.sm, marginTop: 4 }}>{helperText}</div>}
      {error && <div style={{ color: aurixTheme.colors.error, fontSize: aurixTheme.font.size.sm, marginTop: 4 }}>{error}</div>}
    </div>
  );
};

export default Input;
