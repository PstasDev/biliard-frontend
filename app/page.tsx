'use client';

import { useEffect, useState } from 'react';
import { publicApi } from '@/lib/api';
import { Tournament, Match } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const tournaments = await publicApi.getTournaments();
        
        // Find current or next upcoming tournament
        const now = new Date();
        const current = tournaments.find((t: Tournament) => {
          const start = new Date(t.startDate);
          const end = new Date(t.endDate);
          return start <= now && now <= end;
        });

        const upcoming = tournaments
          .filter((t: Tournament) => new Date(t.startDate) > now)
          .sort((a: Tournament, b: Tournament) => 
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          )[0];

        const selectedTournament = current || upcoming || tournaments[0];
        
        if (selectedTournament) {
          const fullTournament = await publicApi.getTournament(selectedTournament.id);
          setCurrentTournament(fullTournament);
          
          const matchesData = await publicApi.getMatches(selectedTournament.id);
          setMatches(matchesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

  if (!currentTournament) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-foreground">🎱 SZLG Biliárdbajnokság</h1>
          <p className="text-muted-foreground">Jelenleg nincs aktív bajnokság</p>
        </div>
      </div>
    );
  }

  const upcomingMatches = matches
    .filter(m => m.match_date && new Date(m.match_date) > new Date())
    .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime())
    .slice(0, 5);

  const recentMatches = matches
    .filter(m => m.match_date && new Date(m.match_date) <= new Date())
    .sort((a, b) => new Date(b.match_date!).getTime() - new Date(a.match_date!).getTime())
    .slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 text-foreground">
          🎱 SZLG Biliárdbajnokság
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          Kőbányai Szent László Gimnázium
        </p>
      </div>

      <div className="mb-12">
        <Card className="wood-border felt-texture">
          <CardHeader>
            <CardTitle className="text-3xl text-foreground font-bold">{currentTournament.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Helyszín</p>
                <p className="font-semibold">{currentTournament.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Játékmód</p>
                <p className="font-semibold">
                  {currentTournament.gameMode === '8ball' ? '8-as golyó' : 'Snooker'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Időpont</p>
                <p className="font-semibold">
                  {new Date(currentTournament.startDate).toLocaleDateString('hu-HU')} - {' '}
                  {new Date(currentTournament.endDate).toLocaleDateString('hu-HU')}
                </p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link href={`/tournaments/${currentTournament.id}`}>
                <Button size="lg" className="wood-border">
                  Bajnokság részletei
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Következő mérkőzések</h2>
          {upcomingMatches.length === 0 ? (
            <p className="text-muted-foreground">Nincsenek közelgő mérkőzések</p>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Legutóbbi mérkőzések</h2>
          {recentMatches.length === 0 ? (
            <p className="text-muted-foreground">Még nincsenek mérkőzések</p>
          ) : (
            <div className="space-y-4">
              {recentMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const player1Name = match.player1.user
    ? `${match.player1.user.last_name} ${match.player1.user.first_name}`
    : `${match.player1.last_name} ${match.player1.first_name}`;
  
  const player2Name = match.player2.user
    ? `${match.player2.user.last_name} ${match.player2.user.first_name}`
    : `${match.player2.last_name} ${match.player2.first_name}`;

  const player1Wins = match.match_frames?.filter(f => f.winner?.id === match.player1.id).length || 0;
  const player2Wins = match.match_frames?.filter(f => f.winner?.id === match.player2.id).length || 0;

  return (
    <Link href={`/matches/${match.id}`}>
      <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold">{player1Name}</p>
            </div>
            <div className="mx-4 text-center">
              <div className="text-2xl font-bold">
                {player1Wins} - {player2Wins}
              </div>
              <div className="text-xs text-muted-foreground">
                Best of {match.frames_to_win}
              </div>
            </div>
            <div className="flex-1 text-right">
              <p className="font-semibold">{player2Name}</p>
            </div>
          </div>
          {match.match_date && (
            <div className="mt-2 text-sm text-muted-foreground text-center">
              {new Date(match.match_date).toLocaleString('hu-HU')}
            </div>
          )}
          {match.broadcastURL && (
            <div className="mt-2 text-center">
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                🔴 ÉLŐ
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
