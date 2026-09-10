import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#51E2F5] text-[#1B1618] font-bold shadow-sm',
        secondary:
          'border-transparent bg-[#9DF9EF] text-[#251E22] font-semibold',
        ice:
          'border-[#A28089]/30 bg-[#EDF7F6] text-[#362B30] dark:bg-[#251E22] dark:text-[#9DF9EF]',
        coral:
          'border-transparent bg-[#FFA8B6] text-[#1B1618] font-bold shadow-sm',
        mauve:
          'border-transparent bg-[#A28089] text-white',
        forest:
          'border-transparent bg-[#A28089] text-white',
        slate:
          'border-[#A28089]/50 bg-[#A28089]/20 text-[#362B30] dark:text-[#EDF7F6]',
        pebble:
          'border-[#A28089]/40 bg-[#EDF7F6] text-[#362B30] dark:bg-[#251E22] dark:text-[#EDF7F6]',
        outline:
          'border-[#51E2F5] text-[#51E2F5] dark:border-[#9DF9EF] dark:text-[#9DF9EF]',
        critical:
          'border-transparent bg-[#FFA8B6] text-[#1B1618] font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
