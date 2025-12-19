'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { biroApi, getWebSocketUrl, getAccessToken } from '@/lib/api';
import { Match, Frame, balls } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Timer } from '@/components/live-match/timer';
import { BallsTracker } from '@/components/live-match/balls-tracker';
import { ActionLog } from '@/components/live-match/action-log';
import { ClearEventsDialog } from '@/components/live-match/clear-events-dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function BiroLiveMatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = parseInt(params.matchId as string);
  const { isBiro, loading: authLoading } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [currentFrame, setCurrentFrame] = useState<Frame | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBalls, setSelectedBalls] = useState<string[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const isMounted = useRef(false);
  const [foulMenuOpen, setFoulMenuOpen] = useState(false);
  const [isStartingFrame, setIsStartingFrame] = useState(false);
  const [endFrameConfirm, setEndFrameConfirm] = useState<{ open: boolean; winnerId: number | null }>({ open: false, winnerId: null });
  const [ballGroupDialogOpen, setBallGroupDialogOpen] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [matchWinner, setMatchWinner] = useState<{ id: number; name: string; wins: number } | null>(null);

  const fetchMatchData = async () => {
    try {
      console.log('Fetching match data for matchId:', matchId);
      const data = await biroApi.getMatch(matchId);
      console.log('Match data received:', data);
      setMatch(data);
      setError(null);
      
      // Calculate wins
      const player1Wins = data.match_frames?.filter((f: Frame) => f.winner?.id === data.player1.id).length || 0;
      const player2Wins = data.match_frames?.filter((f: Frame) => f.winner?.id === data.player2.id).length || 0;
      const totalFrames = data.frames_to_win;
      const framesNeededToWin = Math.ceil(totalFrames / 2);
      
      // Check if match is over (Best of N logic)
      // If odd frames: someone needs (N+1)/2 to win
      // If even frames: can end in draw if both reach N/2
      const isMatchOver = player1Wins >= framesNeededToWin || 
                         player2Wins >= framesNeededToWin ||
                         (totalFrames % 2 === 0 && player1Wins + player2Wins >= totalFrames);
      
      if (isMatchOver) {
        const isDraw = totalFrames % 2 === 0 && player1Wins === player2Wins;
        
        if (isDraw) {
          // Match ended in draw
          if (!matchEnded) {
            setMatchWinner(null);
            setMatchEnded(true);
          }
        } else {
          // Someone won
          const winner = player1Wins >= framesNeededToWin
            ? {
                id: data.player1.id,
                name: data.player1.user
                  ? `${data.player1.user.last_name} ${data.player1.user.first_name}`
                  : `${data.player1.last_name} ${data.player1.first_name}`,
                wins: player1Wins
              }
            : {
                id: data.player2.id,
                name: data.player2.user
                  ? `${data.player2.user.last_name} ${data.player2.user.first_name}`
                  : `${data.player2.last_name} ${data.player2.first_name}`,
                wins: player2Wins
              };
          
          if (!matchEnded) {
            setMatchWinner(winner);
            setMatchEnded(true);
          }
        }
      }
      
      // Find current frame
      const ongoing = data.match_frames?.find((f: Frame) => !f.winner);
      setCurrentFrame(ongoing || null);
      
      // Update current player based on latest event
      if (ongoing) {
        if (ongoing.events?.length) {
          const lastEvent = ongoing.events[ongoing.events.length - 1];
          if (lastEvent.player) {
            setCurrentPlayer(lastEvent.player.id);
          }
        } else if (!currentPlayer) {
          // New frame with no events, set to player 1
          setCurrentPlayer(data.player1.id);
        }
      } else {
        // No ongoing frame, clear current player and selected balls
        setCurrentPlayer(null);
        setSelectedBalls([]);
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      setError(error instanceof Error ? error.message : 'Hiba a mérkőzés betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !isBiro) {
      router.push('/');
      return;
    }

    if (isBiro && matchId) {
      fetchMatchData();

      // Connect to bíró WebSocket
      const connectWebSocket = () => {
        const token = getAccessToken();
        if (!token) {
          console.error('No access token available');
          return;
        }

        const ws = new WebSocket(getWebSocketUrl(`ws/biro/match/${matchId}/?token=${token}`));
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('Bíró WebSocket connected');
          if (isMounted.current) {
            setWsConnected(true);
          }
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          if (!isMounted.current) return;
          
          // Handle specific message types
          switch(message.type) {
            case 'event_removed':
              setSuccessMessage('Esemény sikeresen törölve!');
              setTimeout(() => setSuccessMessage(null), 2000);
              break;
            
            case 'events_removed':
              setSuccessMessage(`${message.data.count} esemény törölve!`);
              setTimeout(() => setSuccessMessage(null), 2000);
              break;
            
            case 'frame_events_cleared':
              setSuccessMessage(`${message.data.count} esemény törölve a frame-ből!`);
              setTimeout(() => setSuccessMessage(null), 2000);
              break;
            
            case 'error':
              alert(`Hiba: ${message.message}`);
              break;
          }
          
          // Refresh match data on ANY message from WebSocket
          fetchMatchData();
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (isMounted.current) {
            setWsConnected(false);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          if (isMounted.current) {
            setWsConnected(false);
          }
          
          // Attempt to reconnect after 3 seconds if not a normal closure
          if (event.code !== 1000 && isMounted.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Attempting to reconnect WebSocket...');
              connectWebSocket();
            }, 3000);
          }
        };
      };

      connectWebSocket();

      return () => {
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Close WebSocket connection
        if (wsRef.current) {
          wsRef.current.close(1000, 'Component unmounting');
          wsRef.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, isBiro, authLoading]);

  const handleStartFrame = async () => {
    if (!match || isStartingFrame) return;
    
    const nextFrameNumber = (match.match_frames?.length || 0) + 1;
    setIsStartingFrame(true);
    
    try {
      const newFrame = await biroApi.createFrame(matchId, {
        frame_number: nextFrameNumber,
      });
      
      // Optimistically update UI with new frame
      setCurrentFrame(newFrame);
      setCurrentPlayer(match.player1.id);
      
      // Update match state to include the new frame
      setMatch(prev => prev ? {
        ...prev,
        match_frames: [...(prev.match_frames || []), newFrame]
      } : null);
      
      // Notify via WebSocket
      wsRef.current?.send(JSON.stringify({
        action: 'start_frame',
        frame_data: { frame_number: nextFrameNumber }
      }));
    } catch (error) {
      console.error('Error starting frame:', error);
      setError('Hiba a frame indításakor');
    } finally {
      setIsStartingFrame(false);
    }
  };

  const handleEndFrame = async (winnerId: number) => {
    if (!currentFrame || !match) return;
    
    try {
      await biroApi.updateFrame(currentFrame.id, {
        frame_number: currentFrame.frame_number,
        winner_id: winnerId,
      });
      
      // Calculate wins after this frame
      const player1Wins = match.match_frames?.filter(f => f.winner?.id === match.player1.id).length || 0;
      const player2Wins = match.match_frames?.filter(f => f.winner?.id === match.player2.id).length || 0;
      
      // Add 1 to the winner's score
      const newPlayer1Wins = winnerId === match.player1.id ? player1Wins + 1 : player1Wins;
      const newPlayer2Wins = winnerId === match.player2.id ? player2Wins + 1 : player2Wins;
      
      const totalFrames = match.frames_to_win;
      const framesNeededToWin = Math.ceil(totalFrames / 2);
      
      // Check if match is over (Best of N logic)
      const isDraw = totalFrames % 2 === 0 && newPlayer1Wins === newPlayer2Wins && newPlayer1Wins + newPlayer2Wins >= totalFrames;
      const isMatchOver = newPlayer1Wins >= framesNeededToWin || newPlayer2Wins >= framesNeededToWin || isDraw;
      
      if (isMatchOver) {
        if (isDraw) {
          // Match ended in draw
          setMatchWinner(null);
          setMatchEnded(true);
        } else {
          // Match is over - determine winner
          const winner = newPlayer1Wins >= framesNeededToWin 
            ? { 
                id: match.player1.id, 
                name: match.player1.user 
                  ? `${match.player1.user.last_name} ${match.player1.user.first_name}` 
                  : `${match.player1.last_name} ${match.player1.first_name}`,
                wins: newPlayer1Wins
              }
            : { 
                id: match.player2.id, 
                name: match.player2.user 
                  ? `${match.player2.user.last_name} ${match.player2.user.first_name}` 
                  : `${match.player2.last_name} ${match.player2.first_name}`,
                wins: newPlayer2Wins
              };
          
          setMatchWinner(winner);
          setMatchEnded(true);
        }
      }
      
      // Update match state to mark current frame as ended
      if (match.match_frames) {
        const updatedFrames = match.match_frames.map(f => 
          f.id === currentFrame.id 
            ? { ...f, winner: winnerId === match.player1.id ? match.player1 : match.player2 }
            : f
        );
        setMatch({
          ...match,
          match_frames: updatedFrames
        });
      }
      
      // Optimistically update UI
      setCurrentFrame(null);
      setSelectedBalls([]);
      setCurrentPlayer(null);
      setEndFrameConfirm({ open: false, winnerId: null });
      
      wsRef.current?.send(JSON.stringify({
        action: 'end_frame',
        frame_id: currentFrame.id,
        winner_id: winnerId,
      }));
      
      // Refresh match data to ensure consistency
      await fetchMatchData();
    } catch (error) {
      console.error('Error ending frame:', error);
      setError('Hiba a frame lezáráskor');
    }
  };

  const handleBallPotted = async () => {
    if (!currentFrame || !currentPlayer || selectedBalls.length === 0) return;
    
    const ballsToAdd = [...selectedBalls];
    
    try {
      const response = await biroApi.createEvent(currentFrame.id, {
        eventType: 'balls_potted',
        player_id: currentPlayer,
        ball_ids: ballsToAdd,
      });
      
      // Optimistically update events
      if (currentFrame.events) {
        setCurrentFrame({
          ...currentFrame,
          events: [...currentFrame.events, response]
        });
      }
      
      setSelectedBalls([]);
      setSuccessMessage(`${ballsToAdd.length} golyó belőve!`);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error) {
      console.error('Error recording balls:', error);
      setError('Hiba a golyók rögzítésekor');
    }
  };

  const handleCueBallLeftTable = async () => {
    if (!currentFrame || !currentPlayer) return;
    
    try {
      const response = await biroApi.createEvent(currentFrame.id, {
        eventType: 'cue_ball_left_table',
        player_id: currentPlayer,
      });
      
      // Optimistically update events
      if (currentFrame.events) {
        setCurrentFrame({
          ...currentFrame,
          events: [...currentFrame.events, response]
        });
      }
      
      setSuccessMessage('Fehér golyó leesett!');
      setTimeout(() => setSuccessMessage(null), 2000);
      setFoulMenuOpen(false);
    } catch (error) {
      console.error('Error recording cue ball left table:', error);
    }
  };

  const handleCueBallPositioned = async () => {
    if (!currentFrame || !currentPlayer) return;
    
    try {
      const response = await biroApi.createEvent(currentFrame.id, {
        eventType: 'cue_ball_gets_positioned',
        player_id: currentPlayer,
      });
      
      // Optimistically update events
      if (currentFrame.events) {
        setCurrentFrame({
          ...currentFrame,
          events: [...currentFrame.events, response]
        });
      }
      
      setSuccessMessage('Fehér golyó pozícionálva!');
      setTimeout(() => setSuccessMessage(null), 2000);
      setFoulMenuOpen(false);
    } catch (error) {
      console.error('Error recording cue ball positioned:', error);
    }
  };

  const handleRemoveEvent = async (eventId: number) => {
    if (!currentFrame) return;
    
    // Optimistically remove event from UI
    const updatedEvents = currentFrame.events?.filter(e => e.id !== eventId) || [];
    setCurrentFrame({
      ...currentFrame,
      events: updatedEvents
    });
    
    try {
      wsRef.current?.send(JSON.stringify({
        action: 'remove_event',
        event_id: eventId,
      }));
      setSuccessMessage('Esemény törölve!');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error) {
      console.error('Error removing event:', error);
      // Revert on error
      fetchMatchData();
    }
  };

  const handleUndoLastEvent = async () => {
    if (!currentFrame || !currentFrame.events || currentFrame.events.length === 0) return;
    
    // Optimistically remove last event
    const updatedEvents = currentFrame.events.slice(0, -1);
    setCurrentFrame({
      ...currentFrame,
      events: updatedEvents
    });
    
    try {
      wsRef.current?.send(JSON.stringify({
        action: 'undo_last_event',
        frame_id: currentFrame.id,
      }));
      setSuccessMessage('Utolsó esemény visszavonva!');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error) {
      console.error('Error undoing last event:', error);
      // Revert on error
      fetchMatchData();
    }
  };

  const handleClearFrameEvents = async () => {
    if (!currentFrame) return;
    
    try {
      wsRef.current?.send(JSON.stringify({
        action: 'clear_frame_events',
        frame_id: currentFrame.id,
      }));
      setSuccessMessage('Összes esemény törölve!');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error) {
      console.error('Error clearing frame events:', error);
    }
  };

  const handleSetBallGroups = async (player1Group: 'full' | 'striped', player2Group: 'full' | 'striped') => {
    if (!currentFrame) return;
    
    try {
      wsRef.current?.send(JSON.stringify({
        action: 'set_ball_groups',
        frame_id: currentFrame.id,
        player1_ball_group: player1Group,
        player2_ball_group: player2Group,
      }));
      setSuccessMessage('Golyó csoportok beállítva!');
      setTimeout(() => setSuccessMessage(null), 2000);
      setBallGroupDialogOpen(false);
    } catch (error) {
      console.error('Error setting ball groups:', error);
    }
  };

  const handleFoul = async () => {
    if (!currentFrame || !currentPlayer) return;
    
    try {
      const response = await biroApi.createEvent(currentFrame.id, {
        eventType: 'faul',
        player_id: currentPlayer,
      });
      
      // Optimistically update events
      if (currentFrame.events) {
        setCurrentFrame({
          ...currentFrame,
          events: [...currentFrame.events, response]
        });
      }
      
      setSuccessMessage('Szabálytalan rögzítve!');
      setTimeout(() => setSuccessMessage(null), 2000);
      setFoulMenuOpen(false);
    } catch (error) {
      console.error('Error recording foul:', error);
    }
  };





  const handleSwitchPlayer = () => {
    if (!match) return;
    const nextPlayerId = currentPlayer === match.player1.id 
      ? match.player2.id 
      : match.player1.id;
    setCurrentPlayer(nextPlayerId);
  };

  // Computed values
  const player1Name = match?.player1.user
    ? `${match.player1.user.last_name} ${match.player1.user.first_name}`
    : match?.player1
      ? `${match.player1.last_name} ${match.player1.first_name}`
      : '';
  
  const player2Name = match?.player2.user
    ? `${match.player2.user.last_name} ${match.player2.user.first_name}`
    : match?.player2
      ? `${match.player2.last_name} ${match.player2.first_name}`
      : '';

  const player1Wins = match?.match_frames?.filter(f => f.winner?.id === match?.player1.id).length || 0;
  const player2Wins = match?.match_frames?.filter(f => f.winner?.id === match?.player2.id).length || 0;

  // Get the first frame's first event timestamp for timer start
  const firstFrame = match?.match_frames?.find(f => f.frame_number === 1);
  const firstEventTimestamp = firstFrame?.events?.[0]?.timestamp || match?.match_date;

  const pottedBalls = currentFrame?.events
    ?.filter(e => e.eventType === 'balls_potted' && e.ball_ids)
    .flatMap(e => e.ball_ids || []) || [];

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!isBiro || !match) {
    if (!authLoading && !loading && error) {
      return (
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-destructive text-xl mb-4">⚠️ Hiba</div>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Újratöltés
            </Button>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* TOP SECTION: Timer & Player Info - Fixed Header */}
      <div className="bg-slate-900 border-b-2 border-slate-700 shadow-2xl">
        <div className="px-4 py-3">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <Link href="/biro/live" className="text-3xl text-slate-200 hover:text-white transition-colors">←</Link>
            <div className="flex items-center gap-3">
              <Timer 
                matchStartTime={firstEventTimestamp} 
                isStopped={matchEnded}
                showControls={false} 
                className="flex-1 flex justify-center" 
              />
              {/* WebSocket Status Indicator */}
              <div className={cn(
                "w-3 h-3 rounded-full transition-colors shadow-lg",
                wsConnected ? "bg-emerald-400 animate-pulse shadow-emerald-500/50" : "bg-red-500 shadow-red-500/50"
              )} title={wsConnected ? "Kapcsolódva" : "Megszakadt"} />
            </div>
            <div className="w-8"></div>
          </div>
          
          {/* Player Scores */}
          <div className="flex items-center justify-between gap-4">
            {/* Player 1 - Blue */}
            <div className={cn(
              "flex-1 text-center px-4 py-3 rounded-xl transition-all relative backdrop-blur-sm",
              "bg-blue-500/20 border-2 shadow-lg",
              currentPlayer === match.player1.id && currentFrame 
                ? "border-blue-400 ring-4 ring-blue-400/40 scale-105 shadow-blue-500/30" 
                : "border-blue-600/40"
            )}>
              {currentPlayer === match.player1.id && currentFrame && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-blue-400 text-3xl drop-shadow-lg">▼</div>
              )}
              <div className="text-5xl font-extrabold text-blue-300 drop-shadow-md">{player1Wins}</div>
              <div className="text-sm text-slate-300 truncate mt-1.5 font-medium">{player1Name}</div>
              {currentFrame?.player1_ball_group && (
                <div className="text-xs text-blue-300 font-bold mt-1 tracking-wider">
                  {currentFrame.player1_ball_group === 'full' ? 'TELI' : 'CSÍKOS'}
                </div>
              )}
            </div>
            
            {/* Match Info Center */}
            <div className="text-center px-3">
              <div className="text-2xl font-bold text-slate-400">-</div>
              <div className="text-xs text-slate-500 whitespace-nowrap font-medium">
                of {match.frames_to_win}
              </div>
              <div className="text-xs text-slate-200 font-bold mt-1">
                #{currentFrame?.frame_number || (match.match_frames?.length || 0) + 1}
              </div>
            </div>

            {/* Player 2 - Red */}
            <div className={cn(
              "flex-1 text-center px-4 py-3 rounded-xl transition-all relative backdrop-blur-sm",
              "bg-red-500/20 border-2 shadow-lg",
              currentPlayer === match.player2.id && currentFrame 
                ? "border-red-400 ring-4 ring-red-400/40 scale-105 shadow-red-500/30" 
                : "border-red-600/40"
            )}>
              {currentPlayer === match.player2.id && currentFrame && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-red-400 text-3xl drop-shadow-lg">▼</div>
              )}
              <div className="text-5xl font-extrabold text-red-300 drop-shadow-md">{player2Wins}</div>
              <div className="text-sm text-slate-300 truncate mt-1.5 font-medium">{player2Name}</div>
              {currentFrame?.player2_ball_group && (
                <div className="text-xs text-red-300 font-bold mt-1 tracking-wider">
                  {currentFrame.player2_ball_group === 'full' ? 'TELI' : 'CSÍKOS'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-emerald-500 text-white px-8 py-4 rounded-xl shadow-2xl font-bold flex items-center gap-3 border-2 border-emerald-400">
            <span className="text-2xl">✓</span>
            <span className="text-lg">{successMessage}</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA - Mobile optimized with scrolling allowed */}
      <div className="flex-1 overflow-y-auto bg-slate-950">
        {!currentFrame ? (
          /* No Frame Active - Start Button or Match Ended */
          <div className="flex items-center justify-center min-h-full px-4 py-8">
            <div className="text-center space-y-6 w-full max-w-md">
              {matchEnded ? (
                <>
                  <div className="text-6xl mb-4">{matchWinner ? '🏆' : '🤝'}</div>
                  <h2 className="text-3xl font-bold text-amber-400">
                    {matchWinner ? 'Játék vége!' : 'Döntetlen!'}
                  </h2>
                  {matchWinner ? (
                    <>
                      <p className="text-xl text-slate-300">
                        Győztes: <span className="font-bold text-emerald-400">{matchWinner.name}</span>
                      </p>
                      <p className="text-lg text-slate-400">
                        {matchWinner.wins} frame-mel nyert!
                      </p>
                    </>
                  ) : (
                    <p className="text-xl text-slate-300">
                      A mérkőzés döntetlennel végződött!
                    </p>
                  )}
                  <div className="flex gap-3 w-full">
                    <Button 
                      onClick={() => router.push('/biro/live')}
                      size="lg" 
                      variant="outline"
                      className="flex-1 h-16 text-lg font-bold"
                    >
                      ← Vissza a listához
                    </Button>
                    <Button 
                      onClick={() => router.push(`/matches/${matchId}`)}
                      size="lg" 
                      className="flex-1 h-16 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                    >
                      Eredémények megtekintése
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-slate-100">Új Frame indítása</h2>
                  <Button 
                    onClick={handleStartFrame}
                    disabled={isStartingFrame}
                    size="lg" 
                    className="w-full h-20 text-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                  >
                    {isStartingFrame ? 'Indítás...' : `▶ Frame #${(match?.match_frames?.length || 0) + 1} indítása`}
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Frame Active - Optimized Layout */
          <div className="min-h-full flex flex-col p-3 gap-3">
            {/* Ball Group Assignment - Show warning if not set, or button to change if set */}
            {(!currentFrame.player1_ball_group || !currentFrame.player2_ball_group) ? (
              <div className="bg-amber-600/20 border-2 border-amber-400 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                <div className="text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
                  <span>⚠</span>
                  <span>Golyó csoportok beállítása</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleSetBallGroups('full', 'striped')}
                    variant="outline"
                    className="h-auto py-2 text-xs font-semibold hover:bg-blue-600 hover:text-white border-2 border-blue-400 text-slate-200 bg-blue-600/20"
                    size="sm"
                  >
                    {player1Name.split(' ')[0]}<br/>Teli (1-7)
                  </Button>
                  <Button
                    onClick={() => handleSetBallGroups('striped', 'full')}
                    variant="outline"
                    className="h-auto py-2 text-xs font-semibold hover:bg-blue-600 hover:text-white border-2 border-blue-400 text-slate-200 bg-blue-600/20"
                    size="sm"
                  >
                    {player1Name.split(' ')[0]}<br/>Csíkos (9-15)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/40 border-2 border-slate-600 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-slate-300">
                    <span className="font-semibold text-blue-300">{player1Name.split(' ')[0]}</span>: {currentFrame.player1_ball_group === 'full' ? 'TELI (1-7)' : 'CSÍKOS (9-15)'}
                    {' | '}
                    <span className="font-semibold text-red-300">{player2Name.split(' ')[0]}</span>: {currentFrame.player2_ball_group === 'full' ? 'TELI (1-7)' : 'CSÍKOS (9-15)'}
                  </div>
                  <Button
                    onClick={() => setBallGroupDialogOpen(true)}
                    variant="outline"
                    className="h-8 text-xs font-semibold hover:bg-purple-600 hover:text-white border-2 border-purple-400 text-slate-200 bg-purple-600/20 px-3"
                    size="sm"
                  >
                    🔄 Csere
                  </Button>
                </div>
              </div>
            )}

            {/* Main Content: Responsive Layout */}
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-3">
              {/* LEFT COLUMN: Balls and Controls */}
              <div className="flex flex-col gap-3">
                {/* Balls Tracker - Compact */}
                <div className="flex-shrink-0">
                  <BallsTracker
                    balls={balls}
                    pottedBalls={pottedBalls}
                    selectedBalls={selectedBalls}
                    onToggleBall={(ballId) => {
                      setSelectedBalls(prev => 
                        prev.includes(ballId) 
                          ? prev.filter(id => id !== ballId)
                          : [...prev, ballId]
                      );
                    }}
                    disabled={!currentPlayer}
                  />
                </div>

                {/* Action Controls - Compact Grid */}
                <div className="flex-shrink-0 bg-slate-900/60 backdrop-blur-sm rounded-xl p-3 border-2 border-slate-700 shadow-xl">
                  {/* Primary Action: Pot Balls */}
                  <Button
                    onClick={handleBallPotted}
                    disabled={!currentPlayer || selectedBalls.length === 0}
                    className={cn(
                      "w-full h-14 font-bold text-base touch-manipulation shadow-lg mb-3",
                      "bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-slate-800 disabled:text-slate-600 border-2",
                      currentPlayer && selectedBalls.length > 0 && "border-emerald-400 shadow-emerald-500/30"
                    )}
                  >
                    ✓ Golyók belövése ({selectedBalls.length})
                  </Button>

                  {/* Foul Menu - Collapsible */}
                  <div className="mb-3">
                    <Button
                      onClick={() => setFoulMenuOpen(!foulMenuOpen)}
                      disabled={!currentPlayer}
                      variant="destructive"
                      className="w-full h-12 font-bold text-sm touch-manipulation bg-orange-600 hover:bg-orange-500 border-2 border-orange-400 shadow-lg"
                    >
                      {foulMenuOpen ? '▼' : '▶'} ⚠ Szabálytalan
                    </Button>
                    {foulMenuOpen && (
                      <div className="mt-2 space-y-2 p-2 bg-slate-800/60 rounded-lg border border-slate-700">
                        <Button
                          onClick={handleCueBallLeftTable}
                          disabled={!currentPlayer}
                          variant="outline"
                          className="w-full h-10 text-xs font-semibold text-slate-200 border-red-600/50 bg-red-600/20 hover:bg-red-600 hover:text-white"
                        >
                          Fehér golyó leesett
                        </Button>
                        <Button
                          onClick={handleCueBallPositioned}
                          disabled={!currentPlayer}
                          variant="outline"
                          className="w-full h-10 text-xs font-semibold text-slate-200 border-blue-600/50 bg-blue-600/20 hover:bg-blue-600 hover:text-white"
                        >
                          Fehér golyó kézben
                        </Button>
                        <Button
                          onClick={handleFoul}
                          disabled={!currentPlayer}
                          variant="outline"
                          className="w-full h-10 text-xs font-semibold text-slate-200 border-orange-600/50 bg-orange-600/20 hover:bg-orange-600 hover:text-white"
                        >
                          Általános hiba
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Switch Player */}
                  <div className="mb-3">
                    <Button
                      onClick={handleSwitchPlayer}
                      disabled={!currentPlayer}
                      variant="outline"
                      className="w-full h-12 font-bold text-sm touch-manipulation text-slate-200 border-2 border-cyan-600/50 bg-cyan-600/20 hover:bg-cyan-600 hover:text-white hover:border-cyan-400"
                    >
                      ⟲ Játékos váltás
                    </Button>
                  </div>

                  {/* End Frame - 2-column with confirmation */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setEndFrameConfirm({ open: true, winnerId: match.player1.id })}
                      disabled={!currentPlayer}
                      className="h-12 font-bold text-sm touch-manipulation bg-blue-600 hover:bg-blue-500 text-white border-2 border-blue-400 shadow-lg"
                    >
                      🏆 {player1Name.split(' ')[0]}
                    </Button>
                    <Button
                      onClick={() => setEndFrameConfirm({ open: true, winnerId: match.player2.id })}
                      disabled={!currentPlayer}
                      className="h-12 font-bold text-sm touch-manipulation bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 shadow-lg"
                    >
                      🏆 {player2Name.split(' ')[0]}
                    </Button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Event Log (Scrollable on desktop, inline on mobile) */}
              <div className="flex flex-col gap-3 lg:overflow-y-auto lg:pr-1">
                {currentFrame.events && currentFrame.events.length > 0 && (
                  <>
                    <ActionLog
                      events={currentFrame.events}
                      match={match}
                      maxItems={20}
                      onUndoLast={handleUndoLastEvent}
                      onRemoveEvent={handleRemoveEvent}
                    />
                    <ClearEventsDialog
                      eventCount={currentFrame.events.length}
                      onConfirm={handleClearFrameEvents}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Match Victory Dialog */}
      <Dialog open={matchEnded} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-amber-400 text-3xl justify-center">
              {matchWinner ? (
                <>
                  <span className="text-5xl">🏆</span>
                  <span>Játék vége!</span>
                </>
              ) : (
                <>
                  <span className="text-5xl">🤝</span>
                  <span>Döntetlen!</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="pt-6 text-center space-y-4">
              {matchWinner ? (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    Gratulálunk!
                  </div>
                  <div className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                    {matchWinner.name}
                  </div>
                  <div className="text-lg text-muted-foreground">
                    Győztes <span className="font-bold text-emerald-400">{matchWinner.wins}</span> frame-mel!
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    A mérkőzés döntetlennel végződött!
                  </div>
                  <div className="text-lg text-muted-foreground">
                    Mindkét játékos azonos számú frame-t nyert.
                  </div>
                </>
              )}
              <div className="pt-4 text-sm text-slate-400">
                A stopper leállt. A mérkőzés véget ért.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2 pt-4">
            <Button
              onClick={() => router.push('/biro/live')}
              variant="outline"
              className="flex-1"
            >
              Vissza a listához
            </Button>
            <Button
              onClick={() => router.push(`/matches/${matchId}`)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
            >
              Eredmények megtekintése
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ball Group Change Dialog */}
      <Dialog open={ballGroupDialogOpen} onOpenChange={setBallGroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-500">
              <span className="text-2xl">🔄</span>
              Golyó csoportok cseréje
            </DialogTitle>
            <DialogDescription className="pt-4">
              Válaszd ki az új leosztást a játékosoknak:
              <br /><br />
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-blue-400">{player1Name}</span>
                  <div className="text-xs text-slate-400">
                    Jelenleg: {currentFrame?.player1_ball_group === 'full' ? 'TELI (1-7)' : 'CSÍKOS (9-15)'}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-red-400">{player2Name}</span>
                  <div className="text-xs text-slate-400">
                    Jelenleg: {currentFrame?.player2_ball_group === 'full' ? 'TELI (1-7)' : 'CSÍKOS (9-15)'}
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button
              onClick={() => handleSetBallGroups('full', 'striped')}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-600 hover:text-white border-2 border-blue-400 text-slate-200 bg-blue-600/20"
            >
              <div className="font-bold text-blue-300">{player1Name.split(' ')[0]}</div>
              <div className="text-xs">TELI (1-7)</div>
              <div className="text-2xl">⚫</div>
            </Button>
            <Button
              onClick={() => handleSetBallGroups('striped', 'full')}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-600 hover:text-white border-2 border-blue-400 text-slate-200 bg-blue-600/20"
            >
              <div className="font-bold text-blue-300">{player1Name.split(' ')[0]}</div>
              <div className="text-xs">CSÍKOS (9-15)</div>
              <div className="text-2xl">⚪</div>
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBallGroupDialogOpen(false)}
            >
              Mégse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Frame Confirmation Dialog */}
      <Dialog open={endFrameConfirm.open} onOpenChange={(open) => setEndFrameConfirm({ open, winnerId: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <span className="text-2xl">🏆</span>
              Frame lezárása
            </DialogTitle>
            <DialogDescription className="pt-4">
              Biztosan le szeretnéd zárni ezt a frame-et?
              <br /><br />
              Győztes: <strong className="text-foreground">
                {endFrameConfirm.winnerId === match?.player1.id ? player1Name : player2Name}
              </strong>
              <br /><br />
              <span className="text-amber-600 font-semibold">
                Ez a művelet nem vonható vissza!
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEndFrameConfirm({ open: false, winnerId: null })}
            >
              Mégse
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500"
              onClick={() => endFrameConfirm.winnerId && handleEndFrame(endFrameConfirm.winnerId)}
            >
              Igen, lezárom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
