import { Frame, Match } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface FrameEventLogProps {
  frame: Frame;
  match: Match;
  compact?: boolean;
  onRemoveEvent?: (eventId: number) => void;
}

export function FrameEventLog({ frame, match, compact = false, onRemoveEvent }: FrameEventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [frame.events?.length]);

  if (!frame.events || frame.events.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className={cn("pb-3", compact && "py-2")}>
        <CardTitle className={cn("text-base", compact && "text-sm")}>
          Frame eseményei
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={scrollRef}
          className={cn(
            "space-y-2 overflow-y-auto scroll-smooth pr-2",
            compact ? "max-h-64" : "max-h-96"
          )}
        >
          {frame.events.slice().reverse().map((event) => {
            const playerName = event.player?.user
              ? `${event.player.user.last_name} ${event.player.user.first_name}`
              : event.player
                ? `${event.player.last_name} ${event.player.first_name}`
                : 'N/A';
            
            const isPlayer1 = event.player?.id === match.player1.id;
            const isFoul = event.eventType === 'faul' || event.eventType === 'faul_and_next_player';
            
            return (
              <div
                key={event.id}
                className={cn(
                  "flex items-start gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300",
                  isPlayer1 ? "justify-start" : "justify-end"
                )}
              >
                <div
                  className={cn(
                    "text-sm p-2 rounded-lg max-w-[85%] relative group transition-all",
                    isPlayer1 ? "bg-primary/10 text-left" : "bg-secondary text-right",
                    isFoul && "bg-destructive/20 border border-destructive/50"
                  )}
                >
                  {onRemoveEvent && (
                    <button
                      onClick={() => onRemoveEvent(event.id)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Esemény törlése"
                    >
                      ×
                    </button>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    {!isPlayer1 && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString('hu-HU', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                    <div className="font-semibold">{playerName}</div>
                    {isPlayer1 && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString('hu-HU', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className={cn("text-sm", isPlayer1 ? "text-left" : "text-right")}>
                    {event.eventType === 'balls_potted' && event.ball_ids && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-muted-foreground">Belőtt golyók:</span>
                        <span className="font-medium">{event.ball_ids.join(', ')}</span>
                      </div>
                    )}
                    {isFoul && (
                      <div className="text-destructive font-semibold flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Szabálytalanság</span>
                      </div>
                    )}
                    {event.eventType === 'next_player' && (
                      <span className="text-muted-foreground">Játékosváltás</span>
                    )}
                    {event.eventType === 'cue_ball_left_table' && (
                      <span className="text-orange-500 font-medium">Fehér golyó leesett</span>
                    )}
                    {event.eventType === 'cue_ball_gets_positioned' && (
                      <span className="text-blue-500 font-medium">Fehér golyó pozícionálva</span>
                    )}
                    {event.eventType === 'start' && (
                      <span className="text-emerald-500 font-medium">Frame kezdés</span>
                    )}
                    {event.eventType === 'end' && (
                      <span className="text-emerald-500 font-medium">Frame vége</span>
                    )}
                    {event.details && (
                      <div className="text-xs text-muted-foreground mt-1">{event.details}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
