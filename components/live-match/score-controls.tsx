'use client';

import { Button } from '@/components/ui/button';
import { BallComponent } from '@/components/ui/ball';
import { Ball } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ScoreControlsProps {
  cueBall: Ball | undefined;
  activePlayerId: number | null;
  player1Id: number;
  player2Id: number;
  player1Name: string;
  player2Name: string;
  onBallsPotted: () => void;
  onCueBallLeft: () => void;
  onCueBallPositioned: () => void;
  onFoul: () => void;
  onSwitchPlayer: () => void;
  onEndFrame: (winnerId: number) => void;
  selectedBallsCount: number;
  disabled?: boolean;
  className?: string;
}

export function ScoreControls({
  cueBall,
  activePlayerId,
  player1Id,
  player2Id,
  player1Name,
  player2Name,
  onBallsPotted,
  onCueBallLeft,
  onCueBallPositioned,
  onFoul,
  onSwitchPlayer,
  onEndFrame,
  selectedBallsCount,
  disabled = false,
  className
}: ScoreControlsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Balls Potted Button */}
      <Button
        onClick={onBallsPotted}
        disabled={disabled || !activePlayerId || selectedBallsCount === 0}
        className={cn(
          "w-full h-16 font-bold text-lg touch-manipulation shadow-lg",
          "bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-slate-800 disabled:text-slate-600 border-2",
          !disabled && activePlayerId && selectedBallsCount > 0 && "border-emerald-400 shadow-emerald-500/30"
        )}
      >
        ✓ Golyók belövése ({selectedBallsCount})
      </Button>

      {/* Cue Ball Controls */}
      <div className="grid grid-cols-3 gap-3 items-center bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border-2 border-slate-700 shadow-xl">
        <Button
          onClick={onCueBallLeft}
          disabled={disabled || !activePlayerId}
          variant="outline"
          className={cn(
            "h-14 font-semibold touch-manipulation text-slate-200 border-2",
            "hover:bg-red-600 hover:text-white hover:border-red-400 border-red-600/50 bg-red-600/20"
          )}
          size="sm"
        >
          Leesett
        </Button>
        
        <div className="flex justify-center">
          {cueBall && <BallComponent ball={cueBall} size="lg" />}
        </div>
        
        <Button
          onClick={onCueBallPositioned}
          disabled={disabled || !activePlayerId}
          variant="outline"
          className={cn(
            "h-14 font-semibold touch-manipulation text-slate-200 border-2",
            "hover:bg-blue-600 hover:text-white hover:border-blue-400 border-blue-600/50 bg-blue-600/20"
          )}
          size="sm"
        >
          Kézben
        </Button>
      </div>

      {/* Foul and Switch Player */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onFoul}
          disabled={disabled || !activePlayerId}
          variant="destructive"
          className="h-14 font-bold text-base touch-manipulation bg-orange-600 hover:bg-orange-500 border-2 border-orange-400 shadow-lg"
        >
          ⚠ Szabálytalan
        </Button>
        <Button
          onClick={onSwitchPlayer}
          disabled={disabled || !activePlayerId}
          variant="outline"
          className="h-14 font-bold text-base touch-manipulation text-slate-200 border-2 border-cyan-600/50 bg-cyan-600/20 hover:bg-cyan-600 hover:text-white hover:border-cyan-400"
        >
          ⟲ Játékos váltás
        </Button>
      </div>

      {/* End Frame Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => onEndFrame(player1Id)}
          disabled={disabled || !activePlayerId}
          className="h-14 font-bold text-base touch-manipulation bg-blue-600 hover:bg-blue-500 text-white border-2 border-blue-400 shadow-lg"
        >
          🏆 {player1Name.split(' ')[0]} nyer
        </Button>
        <Button
          onClick={() => onEndFrame(player2Id)}
          disabled={disabled || !activePlayerId}
          className="h-14 font-bold text-base touch-manipulation bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 shadow-lg"
        >
          🏆 {player2Name.split(' ')[0]} nyer
        </Button>
      </div>
    </div>
  );
}
