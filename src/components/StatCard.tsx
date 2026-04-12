import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  subtitle?: string;
  progress?: number;
  isAccent?: boolean;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}

export function StatCard({ 
  label, 
  value, 
  trend, 
  subtitle, 
  progress, 
  isAccent = false,
  icon,
  footer
}: StatCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={cn(
        "glass-card p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-300",
        isAccent ? "bg-[#C8F0A0] border-mezo-black" : "bg-white border-mezo-black"
      )}
    >
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-[12px] font-bold uppercase tracking-wider",
            isAccent ? "text-mezo-sidebar/80" : "text-mezo-grey"
          )}>
            {label}
          </span>
          {icon && <div className={cn(isAccent ? "text-mezo-sidebar/60" : "opacity-80")}>{icon}</div>}
        </div>

        <div>
          <div className={cn(
            "text-[32px] font-extrabold leading-none tracking-tight",
            isAccent ? "text-mezo-sidebar" : "text-mezo-black"
          )}>
            {value}
          </div>
          
          {trend !== undefined && (
            <div className="flex items-center gap-2 mt-3">
              <div className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
                isAccent ? "bg-mezo-sidebar/10 text-mezo-sidebar" : "bg-mezo-black text-white"
              )}>
                {trend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {trend >= 0 ? '+' : ''}{trend}%
              </div>
              <span className={cn(
                "text-[12px] font-medium",
                isAccent ? "text-mezo-sidebar/60" : "text-mezo-grey"
              )}>vs last epoch</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-2 relative z-10">
        {subtitle && (
          <div className={cn(
            "text-[12px] font-bold",
            isAccent ? "text-mezo-sidebar/80" : "text-mezo-grey"
          )}>
            {subtitle}
          </div>
        )}
        
        {progress !== undefined && (
          <div className={cn(
            "h-1 rounded-full overflow-hidden",
            isAccent ? "bg-mezo-sidebar/10" : "bg-mezo-border/30"
          )}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                isAccent ? "bg-mezo-sidebar" : "bg-mezo-lime"
              )}
            />
          </div>
        )}

        {footer && (
          <div className="pt-4 mt-4 border-t border-mezo-sidebar/10">
            {footer}
          </div>
        )}
      </div>
    </motion.div>
  );
}
