'use client';

import { MatchEvent, Match } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionLogProps {
  events: MatchEvent[];
  match: Match;
  maxItems?: number;
  onUndo?: (eventId: number) => void;
  onUndoLast?: () => void;
  onRemoveEvent?: (eventId: number) => void;
  className?: string;
}

export function ActionLog({
  events,
  match,
  maxItems = 5,
  onUndo,
  onUndoLast,
  onRemoveEvent,
  className
}: ActionLogProps) {
  // Get last N events
  const recentEvents = events.slice(-maxItems).reverse();

  if (recentEvents.length === 0) {
    return null;
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'balls_potted': return '🎱';
      case 'faul':
      case 'faul_and_next_player': return '⚠️';
      case 'cue_ball_left_table': return '🔴';
      case 'cue_ball_gets_positioned': return '⚪';
      case 'next_player': return '⟲';
      default: return '•';
    }
  };

  const getEventLabel = (event: MatchEvent) => {
    const playerName = event.player?.user
      ? `${event.player.user.last_name} ${event.player.user.first_name}`
      : event.player
        ? `${event.player.last_name} ${event.player.first_name}`
        : 'N/A';
    
    const shortName = playerName.split(' ')[0];
    
    switch (event.eventType) {
      case 'balls_potted':
        return `${shortName}: ${event.ball_ids?.join(', ')}`;
      case 'faul':
      case 'faul_and_next_player':
        return `${shortName}: Szabálytalan`;
      case 'cue_ball_left_table':
        return `${shortName}: Fehér leesett`;
      case 'cue_ball_gets_positioned':
        return `${shortName}: Fehér kézben`;
      case 'next_player':
        return `Váltás: ${shortName}`;
      default:
        return shortName;
    }
  };

  return (
    <div className={cn("bg-slate-900/60 backdrop-blur-sm border-2 border-slate-700 rounded-xl p-4 shadow-xl", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Legutóbbi események
        </h3>
        <div className="flex gap-2">
          {onUndoLast && recentEvents.length > 0 && (
            <Button
              onClick={onUndoLast}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs font-semibold hover:bg-amber-600/30 hover:text-amber-300 text-amber-400 border border-amber-600/50"
              title="Utolsó esemény visszavonása"
            >
              ↶ Visszavon
            </Button>
          )}
          {onUndo && recentEvents.length > 0 && (
            <Button
              onClick={() => onUndo(recentEvents[0].id)}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs font-semibold hover:bg-red-600/30 hover:text-red-300 text-red-400 border border-red-600/50"
              title="Legutóbbi esemény törlése"
            >
              × Töröl
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {recentEvents.map((event, index) => {
          const isPlayer1 = event.player?.id === match.player1.id;
          const isFoul = event.eventType === 'faul' || event.eventType === 'faul_and_next_player';
          
          return (
            <div
              key={event.id}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all border-2",
                index === 0 && "bg-slate-800/80 font-semibold ring-2 ring-slate-600",
                !isFoul && (index !== 0 ? "bg-slate-800/40" : ""),
                isPlayer1 ? "text-blue-300 border-blue-600/50" : "text-red-300 border-red-600/50",
                isFoul && "bg-orange-600/20 border-orange-500 text-orange-300"
              )}
            >
              <span className="text-lg">{getEventIcon(event.eventType)}</span>
              <span className="flex-1 truncate font-medium">{getEventLabel(event)}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(event.timestamp).toLocaleTimeString('hu-HU', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
                {onRemoveEvent && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveEvent(event.id);
                    }}
                    className="text-red-400 hover:bg-red-600/30 rounded-md px-2 py-1 text-sm opacity-0 group-hover:opacity-100 transition-opacity border border-red-600/50 hover:border-red-500"
                    title="Esemény törlése"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
