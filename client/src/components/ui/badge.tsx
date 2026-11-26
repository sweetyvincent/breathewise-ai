import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', {
  variants: {
    variant: {
      default: 'border-transparent bg-secondary text-secondary-foreground',
      outline: 'bg-card text-foreground',
      live: 'border-emerald-700/30 bg-emerald-50 text-emerald-900',
      simulated: 'border-amber-700/40 bg-amber-50 text-amber-950',
      warning: 'border-orange-700/40 bg-orange-50 text-orange-950',
      danger: 'border-red-800/40 bg-red-50 text-red-950',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}
export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
