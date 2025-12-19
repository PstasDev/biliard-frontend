import React from 'react';
import { cn } from '@/lib/utils';

interface TimelineProps {
  children: React.ReactNode;
  className?: string;
}

interface TimelineItemProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  position?: 'left' | 'right' | 'center';
}

interface TimelineContentProps {
  children: React.ReactNode;
  className?: string;
}

interface TimelineDotProps {
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'pink' | 'cyan';
  icon?: React.ReactNode;
}

interface TimelineConnectorProps {
  className?: string;
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={cn('relative py-4', className)}>
        {/* Center line - responsive width */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 sm:w-1 bg-border/60 -translate-x-1/2 rounded-full" />
        <div className="space-y-6 sm:space-y-10">
          {children}
        </div>
      </div>
    );
  }
);
Timeline.displayName = 'Timeline';

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ children, className, active = false, position = 'center' }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-center group min-h-[60px] sm:min-h-[70px]',
          position === 'left' && 'justify-end pr-[calc(50%+1.5rem)] sm:pr-[calc(50%+2.5rem)]',
          position === 'right' && 'justify-start pl-[calc(50%+1.5rem)] sm:pl-[calc(50%+2.5rem)]',
          position === 'center' && 'justify-center',
          active && 'animate-pulse-subtle',
          className
        )}
      >
        {children}
      </div>
    );
  }
);
TimelineItem.displayName = 'TimelineItem';

const variantStyles = {
  default: 'bg-secondary border-border',
  success: 'bg-green-500 border-green-600 shadow-green-500/50',
  warning: 'bg-orange-500 border-orange-600 shadow-orange-500/50',
  error: 'bg-red-500 border-red-600 shadow-red-500/50',
  info: 'bg-blue-500 border-blue-600 shadow-blue-500/50',
  purple: 'bg-purple-500 border-purple-600 shadow-purple-500/50',
  pink: 'bg-pink-500 border-pink-600 shadow-pink-500/50',
  cyan: 'bg-cyan-500 border-cyan-600 shadow-cyan-500/50',
};

const TimelineDot = React.forwardRef<HTMLDivElement, TimelineDotProps>(
  ({ className, variant = 'default', icon }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-10 flex shrink-0 items-center justify-center rounded-full shadow-lg transition-all duration-300',
          'h-10 w-10 sm:h-12 sm:w-12 border-2 sm:border-4',
          'hover:scale-110',
          variantStyles[variant],
          className
        )}
      >
        {icon && (
          <div className="flex items-center justify-center text-white">
            {icon}
          </div>
        )}
      </div>
    );
  }
);
TimelineDot.displayName = 'TimelineDot';

const TimelineConnector = React.forwardRef<HTMLDivElement, TimelineConnectorProps>(
  () => {
    return null; // Connector is now the central line in Timeline component
  }
);
TimelineConnector.displayName = 'TimelineConnector';

const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('w-full max-w-[85%] sm:max-w-md', className)}
      >
        {children}
      </div>
    );
  }
);
TimelineContent.displayName = 'TimelineContent';

export { Timeline, TimelineItem, TimelineDot, TimelineConnector, TimelineContent };
