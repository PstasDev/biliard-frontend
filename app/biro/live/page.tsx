'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { biroApi } from '@/lib/api';
import { Match } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function BiroLivePage() {
  const router = useRouter();
  const { isBiro, loading } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    if (!loading && !isBiro) {
      router.push('/');
      return;
    }

    async function fetchMatches() {
      try {
        const data = await biroApi.getMatches();
        // Filter ongoing matches (not finished)
        const ongoing = data.filter((m: Match) => {
          const player1Wins = m.match_frames?.filter(f => f.winner?.id === m.player1.id).length || 0;
          const player2Wins = m.match_frames?.filter(f => f.winner?.id === m.player2.id).length || 0;
          return player1Wins < m.frames_to_win && player2Wins < m.frames_to_win;
        });
        setMatches(ongoing);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoadingMatches(false);
      }
    }

    if (isBiro) {
      fetchMatches();
    }
  }, [isBiro, loading, router]);

  if (loading || loadingMatches) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!isBiro) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/biro" className="text-sm text-muted-foreground hover:text-foreground">
          ← Vissza a bírói felületre
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-8 text-foreground">Élő közvetítés kezelése</h1>

      <p className="text-muted-foreground mb-6">
        Válassz egy folyamatban lévő mérkőzést az élő frissítéshez:
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>

      {matches.length === 0 && (
        <p className="text-center text-muted-foreground">
          Jelenleg nincsenek folyamatban lévő mérkőzések
        </p>
      )}
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
    <Link href={`/biro/live/${match.id}`}>
      <Card className="hover:bg-secondary/50 transition-colors cursor-pointer wood-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mérkőzés #{match.id}</span>
            <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
              🔴 ÉLŐ
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold">{player1Name}</p>
            </div>
            <div className="mx-4 text-center">
              <div className="text-3xl font-bold text-foreground">
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
            <div className="mt-4 text-sm text-muted-foreground text-center">
              {new Date(match.match_date).toLocaleString('hu-HU')}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
