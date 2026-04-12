import React from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-mezo-sidebar text-white hover:bg-black',
  secondary: 'bg-mezo-border/30 text-mezo-black border border-mezo-black hover:bg-mezo-border/50',
  ghost: 'bg-transparent text-mezo-muted hover:text-mezo-black hover:bg-mezo-border/20',
  accent: 'bg-mezo-lime text-mezo-sidebar hover:opacity-90',
  danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[12px] rounded-xl',
  md: 'px-6 py-3 text-[14px] rounded-2xl',
  lg: 'px-8 py-4 text-[16px] rounded-2xl',
};

export function Button({ variant = 'primary', size = 'md', icon, loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  );
}
