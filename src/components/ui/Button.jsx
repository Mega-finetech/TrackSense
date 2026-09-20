import { forwardRef } from 'react';

const VARIANTS = {
  primary:
    'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-[0_8px_24px_-6px_rgb(0_180_216/0.5)] hover:shadow-[0_10px_28px_-6px_rgb(0_180_216/0.6)] hover:brightness-105',
  secondary:
    'bg-card text-ink border border-line hover:border-cyan-300/60 hover:bg-accent-soft',
  soft:
    'bg-accent-soft text-[var(--ts-accent)] hover:brightness-95',
  ghost:
    'bg-transparent text-ink-soft hover:bg-card-muted hover:text-ink',
  dark:
    'bg-navy-900 text-white hover:bg-navy-800 dark:bg-white dark:text-navy-900 dark:hover:bg-navy-50',
  danger:
    'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-7 text-base gap-2 rounded-2xl',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex select-none items-center justify-center font-semibold tracking-tight
        transition-all duration-200 active:scale-[0.96]
        disabled:pointer-events-none disabled:opacity-45
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
