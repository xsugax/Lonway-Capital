import React from 'react';
import aurixTheme from '../theme/aurixTheme';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [visible, setVisible] = React.useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
    >
      {children}
      {visible && (
        <span
          style={{
            position: 'absolute',
            zIndex: aurixTheme.zIndex.tooltip,
            background: aurixTheme.colors.surface,
            color: aurixTheme.colors.text,
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: aurixTheme.font.size.sm,
            boxShadow: aurixTheme.shadow,
            whiteSpace: 'nowrap',
            top: position === 'top' ? -36 : position === 'bottom' ? '100%' : '50%',
            left: position === 'left' ? -120 : position === 'right' ? '100%' : '50%',
            transform:
              position === 'top' ? 'translateX(-50%)' :
              position === 'bottom' ? 'translateX(-50%)' :
              position === 'left' ? 'translateY(-50%)' :
              'translateY(-50%)',
            marginTop: position === 'bottom' ? 8 : undefined,
            marginLeft: position === 'right' ? 8 : position === 'left' ? -8 : undefined,
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
