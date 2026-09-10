import React from 'react';
import { cn } from '../../lib/utils';

export function Progress({ value = 0, className, barClassName, ...props }) {
  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-[#EDF7F6] dark:bg-[#3E3137]',
        className
      )}
      {...props}
    >
      <div
        className={cn('h-full w-full flex-1 bg-gradient-to-r from-[#9DF9EF] to-[#51E2F5] transition-all', barClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
}
