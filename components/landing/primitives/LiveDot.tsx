import React from 'react';

export const LiveDot: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 8,
  color,
  className,
}) => (
  <span
    className={`live-dot ${className ?? ''}`}
    style={{
      width: size,
      height: size,
      ...(color ? { background: color, boxShadow: `0 0 ${size * 1.2}px ${color}88` } : null),
    }}
    aria-hidden
  />
);

export default LiveDot;
