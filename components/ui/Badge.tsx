'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
  className?: string;
}

const variants = {
  default: 'bg-cp-bg-secondary text-cp-text-muted border-cp-border',
  success: 'bg-cp-green/15 text-cp-green border-cp-green/25',
  warning: 'bg-cp-warning/15 text-cp-warning border-cp-warning/25',
  danger: 'bg-cp-danger/15 text-cp-danger border-cp-danger/25',
  accent: 'bg-cp-green/15 text-cp-green border-cp-green/25',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border-2 ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
