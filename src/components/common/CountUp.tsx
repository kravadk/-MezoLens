import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface CountUpProps {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({ end, duration = 1500, decimals = 2, prefix = '', suffix = '', className }: CountUpProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(eased * end);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  );
}
