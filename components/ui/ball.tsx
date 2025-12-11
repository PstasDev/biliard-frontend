import React from 'react';
import { cn } from '@/lib/utils';
import type { Ball } from '@/lib/types';

interface BallProps {
  ball: Ball;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ballColors: Record<string, { bg: string; highlight: string; text: string }> = {
  white: { bg: '#F8F8F8', highlight: '#FFFFFF', text: '#000000' },
  yellow: { bg: '#FCD34D', highlight: '#FEF3C7', text: '#000000' },
  blue: { bg: '#3B82F6', highlight: '#93C5FD', text: '#FFFFFF' },
  red: { bg: '#EF4444', highlight: '#FCA5A5', text: '#FFFFFF' },
  purple: { bg: '#A855F7', highlight: '#D8B4FE', text: '#FFFFFF' },
  orange: { bg: '#F97316', highlight: '#FDBA74', text: '#FFFFFF' },
  green: { bg: '#22C55E', highlight: '#86EFAC', text: '#FFFFFF' },
  maroon: { bg: '#7F1D1D', highlight: '#B91C1C', text: '#FFFFFF' },
  black: { bg: '#000000', highlight: '#404040', text: '#FFFFFF' },
};

const ballSizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const numberSizes = {
  sm: 'text-xs',
  md: 'text-base',
  lg: 'text-2xl',
};

export function BallComponent({ ball, size = 'md', className }: BallProps) {
  const colorScheme = ballColors[ball.color] || { bg: '#6B7280', highlight: '#9CA3AF', text: '#FFFFFF' };
  const isFull = ball.full !== false && ball.id !== 'cue';
  const isStriped = !isFull && ball.id !== 'cue';
  const isCue = ball.id === 'cue';

  return (
    <div
      className={cn(
        'rounded-full relative flex items-center justify-center font-bold transition-all duration-300',
        ballSizes[size],
        className
      )}
      title={ball.name}
      style={{
        backgroundColor: isCue ? '#FFFFFF' : colorScheme.bg,
        boxShadow: isCue 
          ? `0 4px 8px rgba(0, 0, 0, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.2), inset 2px 2px 4px rgba(255, 255, 255, 0.4)`
          : `0 4px 8px rgba(0, 0, 0, 0.4), inset 0 -3px 8px rgba(0, 0, 0, 0.3), inset 2px 2px 4px ${colorScheme.highlight}`,
      }}
    >
      {/* Striped pattern */}
      {isStriped && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, 
                ${colorScheme.bg} 0%, 
                ${colorScheme.bg} 30%, 
                #FFFFFF 30%, 
                #FFFFFF 70%, 
                ${colorScheme.bg} 70%, 
                ${colorScheme.bg} 100%)`,
            }}
          />
        </div>
      )}

      {/* Highlight for 3D effect */}
      {!isCue && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${colorScheme.highlight}60 0%, transparent 50%)`,
          }}
        />
      )}

      {/* Number */}
      {!isCue && (
        <div
          className={cn(
            'relative z-10 flex items-center justify-center rounded-full',
            numberSizes[size],
            size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-7 h-7' : 'w-10 h-10'
          )}
          style={{
            backgroundColor: isStriped || ball.id !== '8' ? '#FFFFFF' : 'transparent',
            color: ball.id === '8' ? '#FFFFFF' : colorScheme.bg,
            fontWeight: 900,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {ball.id}
        </div>
      )}
    </div>
  );
}
