// frontend/components/glass/GlassPanel.tsx
// The base glass surface component. All glass UI in ForgeFlow
// should use this or extend it — never write raw glass CSS again.

import { cn } from '@/lib/utils';
import { type HTMLAttributes, forwardRef } from 'react';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'regular' | 'clear' | 'heavy';
  withDistortion?: boolean;   // Enable SVG distortion (Chromium only)
  accentGradient?: 'blue' | 'purple' | 'emerald' | 'amber' | 'red' | 'none';
  radius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'pill';
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({
    variant = 'regular',
    withDistortion = false,
    accentGradient = 'none',
    radius = 'lg',
    className,
    children,
    ...props
  }, ref) => {
    const radiusMap = {
      sm: 'rounded-[var(--radius-glass-sm)]',
      md: 'rounded-[var(--radius-glass-md)]',
      lg: 'rounded-[var(--radius-glass-lg)]',
      xl: 'rounded-[var(--radius-glass-xl)]',
      '2xl': 'rounded-[var(--radius-glass-2xl)]',
      pill: 'rounded-[var(--radius-glass-pill)]',
    };

    const variantMap = {
      regular: 'glass-regular',
      clear: 'glass-clear',
      heavy: 'glass-heavy',
    };

    const accentMap = {
      blue: 'before:bg-[var(--gradient-accent-blue)]',
      purple: 'before:bg-[var(--gradient-accent-purple)]',
      emerald: 'before:bg-[var(--gradient-accent-emerald)]',
      amber: 'before:bg-[var(--gradient-accent-amber)]',
      red: 'before:bg-[var(--gradient-accent-red)]',
      none: '',
    };

    return (
      <div
        ref={ref}
        style={
          withDistortion
            ? { filter: 'url(#forgeflow-glass)' }
            : undefined
        }
        className={cn(
          'relative overflow-hidden',
          variantMap[variant],
          radiusMap[radius],
          // Accent gradient layer (pseudo-element overlay)
          accentGradient !== 'none' && [
            'before:absolute before:inset-0 before:pointer-events-none',
            accentMap[accentGradient],
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = 'GlassPanel';
