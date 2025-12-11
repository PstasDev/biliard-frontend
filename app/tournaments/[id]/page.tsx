'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { Tournament, Phase, Match } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = parseInt(params.id as string);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournament() {
      try {
        const data = await publicApi.getTournament(tournamentId);
        setTournament(data);
      } catch (error) {
        console.error('Error fetching tournament:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTournament();
  }, [tournamentId]);

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

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-muted-foreground">Bajnokság nem található</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/tournaments" className="text-sm text-muted-foreground hover:text-foreground">
          ← Vissza a bajnokságokhoz
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">{tournament.name}</h1>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Helyszín</p>
            <p className="font-semibold">{tournament.location}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Játékmód</p>
            <p className="font-semibold">
              {tournament.gameMode === '8ball' ? '8-as golyó' : 'Snooker'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Időpont</p>
            <p className="text-sm">
              {new Date(tournament.startDate).toLocaleDateString('hu-HU')} - {' '}
              {new Date(tournament.endDate).toLocaleDateString('hu-HU')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {tournament.phases?.map((phase: Phase) => (
          <PhaseSection key={phase.id} phase={phase} />
        ))}
      </div>
    </div>
  );
}

function PhaseSection({ phase }: { phase: Phase }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {phase.order}. szakasz - {phase.eliminationSystem === 'group' ? 'Csoportkör' : 'Egyenes kieséses'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {phase.eliminationSystem === 'group' ? (
          <div className="space-y-6">
            {phase.groups?.map((group) => (
              <div key={group.id}>
                <h3 className="text-lg font-semibold mb-3">{group.name}</h3>
                <div className="space-y-2">
                  {group.matches?.map((match: Match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {phase.matches?.map((match: Match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MatchRow({ match }: { match: Match }) {
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
              <div className="text-xl font-bold">
                {player1Wins} - {player2Wins}
              </div>
              <div className="text-xs text-muted-foreground">
                First to {match.frames_to_win}
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
        </CardContent>
      </Card>
    </Link>
  );
}
