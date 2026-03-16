import React from 'react';
import aurixTheme from '../theme/aurixTheme';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  width?: number | string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width = 400 }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#0008',
      zIndex: aurixTheme.zIndex.modal,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: aurixTheme.colors.surface,
        borderRadius: aurixTheme.borderRadius,
        boxShadow: aurixTheme.shadow,
        width: typeof width === 'number' ? `${width}px` : width,
        maxWidth: '95vw',
        padding: aurixTheme.spacing(4),
        color: aurixTheme.colors.text,
        position: 'relative',
      }}>
        {title && <div style={{ fontWeight: aurixTheme.font.weight.bold, fontSize: aurixTheme.font.size.lg, marginBottom: 16 }}>{title}</div>}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: aurixTheme.colors.textSecondary,
            fontSize: 24,
            cursor: 'pointer',
          }}
          aria-label="Close"
        >
          ×
        </button>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
