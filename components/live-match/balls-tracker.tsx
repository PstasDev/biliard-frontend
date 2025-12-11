'use client';

import { Ball } from '@/lib/types';
import { BallComponent } from '@/components/ui/ball';
import { cn } from '@/lib/utils';

interface BallsTrackerProps {
  balls: Ball[];
  pottedBalls: string[];
  selectedBalls: string[];
  onToggleBall: (ballId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function BallsTracker({
  balls,
  pottedBalls,
  selectedBalls,
  onToggleBall,
  disabled = false,
  className
}: BallsTrackerProps) {
  const availableBalls = balls.filter(b => b.id !== 'cue' && !pottedBalls.includes(b.id));
  const pottedBallObjects = balls.filter(b => pottedBalls.includes(b.id));

  return (
    <div className={cn("space-y-3", className)}>
      {/* Available Balls Grid */}
      <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-3 border-2 border-slate-700 shadow-xl">
        <div className="grid grid-cols-5 gap-2 justify-items-center">
          {availableBalls.map(ball => (
            <button
              key={ball.id}
              onClick={() => !disabled && onToggleBall(ball.id)}
              disabled={disabled}
              className={cn(
                "transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation",
                "min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full",
                selectedBalls.includes(ball.id) && "ring-4 ring-emerald-400 scale-115 shadow-lg shadow-emerald-500/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <BallComponent ball={ball} size="md" />
            </button>
          ))}
        </div>

        {/* Selection Counter - Inline */}
        {selectedBalls.length > 0 && (
          <div className="text-center mt-3 pt-3 border-t border-slate-700">
            <span className="text-sm font-bold text-emerald-300">
              {selectedBalls.length} golyó kiválasztva
            </span>
          </div>
        )}
      </div>

      {/* Potted Balls - Compact */}
      {pottedBallObjects.length > 0 && (
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-3 border-2 border-slate-800">
          <div className="text-xs text-slate-400 mb-2 text-center font-semibold uppercase tracking-wider">Belőtt golyók</div>
          <div className="grid grid-cols-5 gap-2 justify-items-center">
            {pottedBallObjects.map(ball => (
              <div
                key={ball.id}
                className="opacity-40 grayscale relative"
              >
                <BallComponent ball={ball} size="sm" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-red-400 text-2xl font-bold drop-shadow-lg">×</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
