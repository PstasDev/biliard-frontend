'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimerProps {
  isRunning?: boolean;
  matchStartTime?: string | null;
  onPause?: () => void;
  onStart?: () => void;
  onReset?: () => void;
  showControls?: boolean;
  className?: string;
}

export function Timer({ 
  isRunning = false,
  matchStartTime = null,
  onPause, 
  onStart, 
  onReset,
  showControls = true,
  className 
}: TimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(isRunning);

  useEffect(() => {
    setRunning(isRunning);
  }, [isRunning]);

  // If matchStartTime is provided, calculate elapsed time from match start
  useEffect(() => {
    if (!matchStartTime) return;
    
    const startTime = new Date(matchStartTime).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setSeconds(elapsed > 0 ? elapsed : 0);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [matchStartTime]);

  // Otherwise use internal timer with controls
  useEffect(() => {
    if (matchStartTime) return; // Don't run internal timer if match time is provided
    
    let interval: NodeJS.Timeout | null = null;

    if (running) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running, matchStartTime]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = useCallback(() => {
    if (running) {
      setRunning(false);
      onPause?.();
    } else {
      setRunning(true);
      onStart?.();
    }
  }, [running, onPause, onStart]);

  const handleReset = useCallback(() => {
    setSeconds(0);
    setRunning(false);
    onReset?.();
  }, [onReset]);

  if (!showControls) {
    // Display-only mode for spectator view
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="text-3xl font-mono font-extrabold tabular-nums text-slate-200 drop-shadow-md">
          {formatTime(seconds)}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-slate-700 shadow-lg">
        <Button
          onClick={handleToggle}
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/50 rounded-lg"
        >
          {running ? '⏸' : '▶'}
        </Button>
        <div className={cn(
          "text-3xl font-mono font-extrabold tabular-nums min-w-[100px] text-center drop-shadow-md",
          running ? "text-emerald-300 animate-pulse" : "text-slate-300"
        )}>
          {formatTime(seconds)}
        </div>
        <Button
          onClick={handleReset}
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg"
        >
          ⟲
        </Button>
      </div>
    </div>
  );
}
