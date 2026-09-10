import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#51E2F5] text-[#1B1618] hover:bg-[#40d2e5] font-bold shadow-sm',
        secondary: 'bg-[#9DF9EF] text-[#251E22] hover:bg-[#8ae8dd] font-semibold',
        outline: 'border border-[#A28089]/40 dark:border-[#3E3137] bg-transparent hover:bg-[#51E2F5]/10 text-inherit',
        ghost: 'hover:bg-[#A28089]/15 hover:text-inherit',
        mauve: 'bg-[#A28089] text-white hover:bg-[#8f6e77] shadow-sm',
        coral: 'bg-[#FFA8B6] text-[#1B1618] hover:bg-[#f797a6] font-bold shadow-sm',
        cyan: 'bg-[#51E2F5] text-[#1B1618] hover:bg-[#40d2e5] font-bold shadow-sm',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6 text-sm',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
