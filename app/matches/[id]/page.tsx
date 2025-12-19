'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { publicApi, getWebSocketUrl } from '@/lib/api';
import { Match, Frame } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { BallComponent } from '@/components/ui/ball';
import { balls } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Play, Flag, RefreshCw, Star, Circle, AlertTriangle, Target, ChevronUp } from 'lucide-react';

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = parseInt(params.id as string);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showPreviousFrames, setShowPreviousFrames] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    async function fetchMatch() {
      try {
        const data = await publicApi.getMatch(matchId);
        setMatch(data);
      } catch (error) {
        console.error('Error fetching match:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMatch();

    // Connect to WebSocket for live updates
    const ws = new WebSocket(getWebSocketUrl(`ws/match/${matchId}/`));
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'match_state' || message.type === 'match_update') {
        setMatch(message.data);
      } else if (message.type === 'frame_update' || message.type === 'event_created') {
        // Refresh match data
        fetchMatch();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [matchId]);

  // Timer effect - starts from first frame's first event
  useEffect(() => {
    if (!match) return;
    
    // Get first frame's first event timestamp, fallback to match_date
    const firstFrame = match.match_frames?.find(f => f.frame_number === 1);
    const startTimeStr = firstFrame?.events?.[0]?.timestamp || match.match_date;
    
    if (!startTimeStr) return;
    
    // Check if match is over
    const player1Wins = match.match_frames?.filter(f => f.winner?.id === match.player1.id).length || 0;
    const player2Wins = match.match_frames?.filter(f => f.winner?.id === match.player2.id).length || 0;
    const totalFrames = match.frames_to_win;
    const framesNeededToWin = Math.ceil(totalFrames / 2);
    const isMatchOver = player1Wins >= framesNeededToWin || 
                       player2Wins >= framesNeededToWin ||
                       (totalFrames % 2 === 0 && player1Wins + player2Wins >= totalFrames);
    
    const startTime = new Date(startTimeStr).getTime();
    
    // If match is over, calculate the final time based on the last frame's last event
    if (isMatchOver) {
      // Find the last frame with a winner
      const lastFinishedFrame = match.match_frames
        ?.filter(f => f.winner)
        .sort((a, b) => b.frame_number - a.frame_number)[0];
      
      if (lastFinishedFrame && lastFinishedFrame.events && lastFinishedFrame.events.length > 0) {
        // Get the last event's timestamp from the last finished frame
        const lastEvent = lastFinishedFrame.events[lastFinishedFrame.events.length - 1];
        const endTime = new Date(lastEvent.timestamp).getTime();
        const finalElapsed = Math.floor((endTime - startTime) / 1000);
        const timeToShow = finalElapsed > 0 ? finalElapsed : 0;
        
        console.log('Match ended - Timer calculation:', {
          startTimeStr,
          startTime,
          lastEventTimestamp: lastEvent.timestamp,
          endTime,
          finalElapsed,
          timeToShow,
          matchEnded,
          finalTime
        });
        
        if (!matchEnded) {
          setMatchEnded(true);
          setFinalTime(timeToShow);
          setElapsedTime(timeToShow);
        } else if (finalTime !== null) {
          setElapsedTime(finalTime);
        } else {
          setElapsedTime(timeToShow);
        }
      }
      return;
    }
    
    if (matchEnded && finalTime !== null) {
      // Keep showing frozen time
      setElapsedTime(finalTime);
      return;
    }
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000); // seconds
      setElapsedTime(elapsed > 0 ? elapsed : 0);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [match, matchEnded, finalTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-muted-foreground">Mérkőzés nem található</p>
      </div>
    );
  }

  const player1Name = match.player1.user
    ? `${match.player1.user.last_name} ${match.player1.user.first_name}`
    : `${match.player1.last_name} ${match.player1.first_name}`;
  
  const player2Name = match.player2.user
    ? `${match.player2.user.last_name} ${match.player2.user.first_name}`
    : `${match.player2.last_name} ${match.player2.first_name}`;

  const player1Wins = match.match_frames?.filter(f => f.winner?.id === match.player1.id).length || 0;
  const player2Wins = match.match_frames?.filter(f => f.winner?.id === match.player2.id).length || 0;

  const totalFrames = match.frames_to_win;
  const framesNeededToWin = Math.ceil(totalFrames / 2);
  const isMatchOver = player1Wins >= framesNeededToWin || 
                     player2Wins >= framesNeededToWin ||
                     (totalFrames % 2 === 0 && player1Wins + player2Wins >= totalFrames);
  const isDraw = totalFrames % 2 === 0 && player1Wins === player2Wins && isMatchOver;
  const winner = isDraw ? null : (player1Wins >= framesNeededToWin ? match.player1 : match.player2);

  const currentFrame = match.match_frames?.find(f => !f.winner);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-12 max-w-6xl">
      <div className="mb-4 sm:mb-8">
        <Link href="/tournaments" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 hover:underline">
          ← Vissza
        </Link>
      </div>

      {match.broadcastURL && (
        <div className="mb-4 sm:mb-6 text-center">
          <a 
            href={match.broadcastURL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-destructive/20 text-destructive px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-destructive/40 transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm sm:text-base"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
            </span>
            <span className="font-semibold">ÉLŐ KÖZVETÍTÉS MEGTEKINTÉSE</span>
          </a>
        </div>
      )}

      {/* Billiard Table with Player Info */}
      <div className="relative w-full mb-4 sm:mb-8">
        {/* Mobile: Portrait orientation with rotated table */}
        <div className="block md:hidden">
          <div className="relative w-full aspect-[9/16] max-h-[80vh]">
            {/* Rotated background image only */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <div className="relative w-[150%] h-[75%] -rotate-90">
                <Image 
                  src="/billiard-table.png"
                  alt="Billiard Table"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            
            {/* Content overlay - NOT rotated */}
            <div className="absolute inset-0 flex flex-col justify-between py-6 sm:py-8 px-3 sm:px-4">
              {/* Player 1 - Top */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 animate-slide-in-left">
                {match.player1.pfpURL && (
                  <Image 
                    src={match.player1.pfpURL} 
                    alt={player1Name}
                    width={50}
                    height={50}
                    className="rounded-full border-2 sm:border-3 border-white shadow-lg"
                  />
                )}
                <h2 className="text-sm sm:text-base font-bold text-white drop-shadow-lg animate-pulse-slow text-center px-2">
                  {player1Name}
                </h2>
                <div className="text-3xl sm:text-4xl font-bold text-yellow-400 drop-shadow-lg">
                  {player1Wins}
                </div>
              </div>

              {/* Center Info */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 animate-fade-in">
                <div className="text-xs sm:text-sm text-white/90 font-semibold bg-green-900/80 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm whitespace-nowrap">
                  Best of {match.frames_to_win}
                </div>
                <div className="text-sm sm:text-base font-mono text-white/90 bg-green-900/60 px-3 sm:px-4 py-1 sm:py-1.5 rounded backdrop-blur-sm tabular-nums">
                  {formatTime(elapsedTime)}
                </div>
                {isMatchOver && (
                  <div className="text-center mt-2">
                    {isDraw ? (
                      <div className="text-lg sm:text-xl font-bold text-yellow-400 bg-slate-900/80 px-4 py-2 rounded-lg backdrop-blur-sm animate-pulse">
                        🤝 Döntetlen!
                      </div>
                    ) : winner && (
                      <div className="text-lg sm:text-xl font-bold text-amber-400 bg-slate-900/80 px-4 py-2 rounded-lg backdrop-blur-sm animate-pulse">
                        🏆 Győztes: {winner.user ? `${winner.user.last_name} ${winner.user.first_name}` : `${winner.last_name} ${winner.first_name}`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Player 2 - Bottom */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 animate-slide-in-right">
                <div className="text-3xl sm:text-4xl font-bold text-yellow-400 drop-shadow-lg">
                  {player2Wins}
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white drop-shadow-lg animate-pulse-slow text-center px-2">
                  {player2Name}
                </h2>
                {match.player2.pfpURL && (
                  <Image 
                    src={match.player2.pfpURL} 
                    alt={player2Name}
                    width={50}
                    height={50}
                    className="rounded-full border-2 sm:border-3 border-white shadow-lg"
                  />
                )}
              </div>
            </div>

            {/* Balls on Table - Mobile */}
            {currentFrame && (
              <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%]">
                <div className="bg-green-900/80 backdrop-blur-md rounded-lg p-2 sm:p-3 border border-green-700/50">
                  <h4 className="text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2 text-white text-center">
                    Golyók az asztalon
                  </h4>
                  <BallsOnTable frame={currentFrame} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop/Tablet: Landscape orientation */}
        <div className="hidden md:block">
          <div className="relative w-full aspect-[2/1]">
            <Image 
              src="/billiard-table.png"
              alt="Billiard Table"
              fill
              className="object-contain"
              priority
            />
            
            {/* Player 1 - Left - Absolute positioned */}
            <div className="absolute left-[12%] top-[12%] text-left animate-slide-in-left">
              <div className="flex items-start gap-3">
                {match.player1.pfpURL && (
                  <Image 
                    src={match.player1.pfpURL} 
                    alt={player1Name}
                    width={60}
                    height={60}
                    className="rounded-full border-3 border-white shadow-lg"
                  />
                )}
                <div className="text-left">
                  <h2 className="text-xl lg:text-2xl font-bold text-white drop-shadow-lg animate-pulse-slow">
                    {player1Name}
                  </h2>
                  <div className="text-3xl lg:text-4xl font-bold text-yellow-400 drop-shadow-lg mt-1">
                    {player1Wins}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Score Info - Truly centered on table */}
            <div className="absolute top-[12%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in">
              <div className="text-sm text-white/90 font-semibold bg-green-900/80 px-4 py-2 rounded-full backdrop-blur-sm whitespace-nowrap">
                Best of {match.frames_to_win}
              </div>
              <div className="text-lg font-mono text-white/90 bg-green-900/60 px-4 py-1.5 rounded backdrop-blur-sm tabular-nums">
                {formatTime(elapsedTime)}
              </div>
              {isMatchOver && (
                <div className="text-center mt-2">
                  {isDraw ? (
                    <div className="text-xl font-bold text-yellow-400 bg-slate-900/80 px-5 py-2.5 rounded-lg backdrop-blur-sm animate-pulse shadow-lg">
                      🤝 Döntetlen!
                    </div>
                  ) : winner && (
                    <div className="text-xl font-bold text-amber-400 bg-slate-900/80 px-5 py-2.5 rounded-lg backdrop-blur-sm animate-pulse shadow-lg">
                      🏆 Győztes: {winner.user ? `${winner.user.last_name} ${winner.user.first_name}` : `${winner.last_name} ${winner.first_name}`}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Player 2 - Right - Absolute positioned */}
            <div className="absolute right-[12%] top-[12%] text-right animate-slide-in-right">
              <div className="flex flex-row-reverse items-start gap-3">
                {match.player2.pfpURL && (
                  <Image 
                    src={match.player2.pfpURL} 
                    alt={player2Name}
                    width={60}
                    height={60}
                    className="rounded-full border-3 border-white shadow-lg"
                  />
                )}
                <div className="text-right">
                  <h2 className="text-xl lg:text-2xl font-bold text-white drop-shadow-lg animate-pulse-slow">
                    {player2Name}
                  </h2>
                  <div className="text-3xl lg:text-4xl font-bold text-yellow-400 drop-shadow-lg mt-1">
                    {player2Wins}
                  </div>
                </div>
              </div>
            </div>

            {/* Balls on Table - Desktop - Within table bounds */}
            {currentFrame && (
              <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[75%]">
                <div className="bg-green-900/80 backdrop-blur-md rounded-lg p-3 border border-green-700/50">
                  <h4 className="text-sm font-semibold mb-2 text-white text-center">
                    Golyók az asztalon
                  </h4>
                  <BallsOnTable frame={currentFrame} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Continuous Timeline */}
      <div className="mt-6 sm:mt-8">
        <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Mérkőzés Timeline</h3>
        
        {/* All Events Timeline - Bottom to Top (Chronological) */}
        {match.match_frames && match.match_frames.length > 0 && (
          <div className="relative">
            {/* Show Previous Frames Button */}
            {match.match_frames.length > 1 && !showPreviousFrames && (
              <div className="flex justify-center mb-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowPreviousFrames(true)}
                  className="gap-2"
                >
                  <ChevronUp className="h-5 w-5" />
                  Korábbi frame-ek megjelenítése ({match.match_frames.length - 1})
                </Button>
              </div>
            )}

            {showPreviousFrames && match.match_frames.length > 1 && (
              <div className="flex justify-center mb-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreviousFrames(false)}
                  className="gap-2"
                >
                  <ChevronUp className="h-4 w-4 rotate-180" />
                  Korábbi frame-ek elrejtése
                </Button>
              </div>
            )}

            <div className="space-y-8">
              {/* Process frames in reverse (newest first for bottom-to-top) */}
              {[...match.match_frames].reverse().map((frame) => {
                const isCurrentFrame = !frame.winner;
                const shouldShow = isCurrentFrame || showPreviousFrames;
                
                if (!shouldShow) return null;

                // Get events and reverse them for chronological order (oldest at bottom)
                const frameEvents = frame.events ? [...frame.events].reverse() : [];
                
                return (
                  <div key={frame.id} className="space-y-6">
                    {/* Frame Header */}
                    <div className="flex items-center justify-center">
                      <div className={cn(
                        'rounded-lg p-4 sm:p-5 shadow-lg border-2 transition-all duration-200 w-full max-w-md',
                        isCurrentFrame 
                          ? 'bg-blue-500/20 border-blue-500/60 animate-pulse-subtle' 
                          : 'bg-green-500/15 border-green-500/40'
                      )}>
                        <div className="text-center">
                          <div className="font-bold text-base sm:text-lg mb-1">
                            Frame #{frame.frame_number}
                          </div>
                          {frame.winner ? (
                            <div className="text-sm text-muted-foreground">
                              Győztes: {frame.winner.user
                                ? `${frame.winner.user.last_name} ${frame.winner.user.first_name}`
                                : `${frame.winner.last_name} ${frame.winner.first_name}`}
                            </div>
                          ) : (
                            <div className="text-sm font-semibold text-blue-400">
                              Folyamatban
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Frame Events - Two-sided Timeline */}
                    {frameEvents.length > 0 && (
                      <div className="relative">
                        {/* Center line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-border/60 -translate-x-1/2 rounded-full" />
                        
                        <div className="space-y-6">
                          {frameEvents.map((event, eventIdx) => {
                            const playerName = event.player?.user
                              ? `${event.player.user.last_name} ${event.player.user.first_name}`
                              : event.player
                                ? `${event.player.last_name} ${event.player.first_name}`
                                : 'Unknown';

                            const isPlayer1 = event.player?.id === match.player1.id;
                            const isFoul = event.eventType === 'faul' || event.eventType === 'faul_and_next_player';

                            const getEventIcon = () => {
                              switch (event.eventType) {
                                case 'balls_potted': return <Target className="h-4 w-4" />;
                                case 'faul':
                                case 'faul_and_next_player': return <AlertTriangle className="h-4 w-4" />;
                                case 'next_player': return <RefreshCw className="h-4 w-4" />;
                                case 'cue_ball_left_table': return <Circle className="h-4 w-4" />;
                                case 'cue_ball_gets_positioned': return <Target className="h-4 w-4" />;
                                case 'start': return <Play className="h-4 w-4" />;
                                case 'end': return <Flag className="h-4 w-4" />;
                                default: return <Star className="h-4 w-4" />;
                              }
                            };

                            const getEventDescription = () => {
                              if (event.eventType === 'balls_potted' && event.ball_ids) {
                                return `Belőtt golyók: ${event.ball_ids.join(', ')}`;
                              } else if (isFoul) {
                                return 'Szabálytalanság';
                              } else if (event.eventType === 'next_player') {
                                return 'Játékosváltás';
                              } else if (event.eventType === 'cue_ball_left_table') {
                                return 'Fehér golyó leesett';
                              } else if (event.eventType === 'cue_ball_gets_positioned') {
                                return 'Fehér golyó pozícionálva';
                              } else if (event.eventType === 'start') {
                                return 'Frame kezdés';
                              } else if (event.eventType === 'end') {
                                return 'Frame vége';
                              }
                              return event.details || event.eventType;
                            };

                            return (
                              <div 
                                key={`${frame.id}-${eventIdx}`}
                                className="relative flex items-center min-h-[60px]"
                              >
                                {/* Event content - Left side for Player 1 */}
                                {isPlayer1 && (
                                  <div className="w-[calc(50%-2rem)] pr-4 flex justify-end">
                                    <div className={cn(
                                      'rounded-lg p-3 shadow-md border transition-all duration-200 max-w-sm w-full',
                                      'bg-blue-500/30 border-blue-500/50',
                                      isFoul && 'bg-orange-500/40 border-orange-500/60',
                                      isCurrentFrame && 'animate-timeline-event'
                                    )}>
                                      <div className="flex flex-col gap-1">
                                        <div className="font-semibold text-sm">
                                          {playerName}
                                        </div>
                                        <div className={cn(
                                          "text-xs",
                                          isFoul ? "text-orange-300 font-medium" : "text-foreground/90"
                                        )}>
                                          {getEventDescription()}
                                        </div>
                                        <div className="text-[10px] text-foreground/70 mt-1">
                                          {new Date(event.timestamp).toLocaleTimeString('hu-HU', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Center icon */}
                                <div className={cn(
                                  'absolute left-1/2 -translate-x-1/2 z-10 flex shrink-0 items-center justify-center rounded-full shadow-lg border-4',
                                  'h-10 w-10',
                                  isFoul ? 'bg-orange-500 border-orange-600' : isPlayer1 ? 'bg-blue-500 border-blue-600' : 'bg-red-500 border-red-600'
                                )}>
                                  <div className="flex items-center justify-center text-white">
                                    {getEventIcon()}
                                  </div>
                                </div>

                                {/* Event content - Right side for Player 2 */}
                                {!isPlayer1 && (
                                  <div className="w-[calc(50%-2rem)] pl-4 ml-auto flex justify-start">
                                    <div className={cn(
                                      'rounded-lg p-3 shadow-md border transition-all duration-200 max-w-sm w-full',
                                      'bg-red-500/30 border-red-500/50',
                                      isFoul && 'bg-orange-500/40 border-orange-500/60',
                                      isCurrentFrame && 'animate-timeline-event'
                                    )}>
                                      <div className="flex flex-col gap-1">
                                        <div className="font-semibold text-sm">
                                          {playerName}
                                        </div>
                                        <div className={cn(
                                          "text-xs",
                                          isFoul ? "text-orange-300 font-medium" : "text-foreground/90"
                                        )}>
                                          {getEventDescription()}
                                        </div>
                                        <div className="text-[10px] text-foreground/70 mt-1">
                                          {new Date(event.timestamp).toLocaleTimeString('hu-HU', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(!match.match_frames || match.match_frames.length === 0) && (
          <p className="text-center text-muted-foreground">Még nem kezdődött el a mérkőzés</p>
        )}
      </div>
    </div>
  );
}

function BallsOnTable({ frame }: { frame: Frame }) {
  const ballsOnTable = balls.filter(b => 
    b.id !== 'cue' && !frame.events?.some(e => 
      e.eventType === 'balls_potted' && e.ball_ids?.includes(b.id)
    )
  );

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center items-center">
      {ballsOnTable.map(ball => (
        <div key={ball.id} className="transform hover:scale-110 transition-transform duration-200">
          <BallComponent ball={ball} size="sm" />
        </div>
      ))}
      {ballsOnTable.length === 0 && (
        <p className="text-xs sm:text-sm text-white/70">Minden golyó belőve</p>
      )}
    </div>
  );
}
