'use client';

import { useEffect, useState } from 'react';
import { publicApi } from '@/lib/api';
import { Tournament } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        const data = await publicApi.getTournaments();
        // Sort by start date descending
        const sorted = data.sort((a: Tournament, b: Tournament) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        setTournaments(sorted);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTournaments();
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

  const now = new Date();
  const currentTournaments = tournaments.filter(t => {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    return start <= now && now <= end;
  });

  const upcomingTournaments = tournaments.filter(t => new Date(t.startDate) > now);
  const pastTournaments = tournaments.filter(t => new Date(t.endDate) < now);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-foreground text-center">🎱 Bajnokságok</h1>

      {currentTournaments.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Folyamatban</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} isCurrent />
            ))}
          </div>
        </div>
      )}

      {upcomingTournaments.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Közelgő</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      )}

      {pastTournaments.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Archívum</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} isPast />
            ))}
          </div>
        </div>
      )}

      {tournaments.length === 0 && (
        <p className="text-center text-muted-foreground">Még nincsenek bajnokságok</p>
      )}
    </div>
  );
}

function TournamentCard({ 
  tournament, 
  isCurrent = false, 
  isPast = false 
}: { 
  tournament: Tournament; 
  isCurrent?: boolean;
  isPast?: boolean;
}) {
  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <Card className={`h-full hover:bg-secondary/50 transition-colors cursor-pointer ${isCurrent ? 'wood-border' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className={isCurrent ? 'text-foreground font-bold' : ''}>{tournament.name}</CardTitle>
            {isCurrent && (
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                ÉLŐ
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
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
              <p className={`text-sm ${isPast ? 'text-muted-foreground' : ''}`}>
                {new Date(tournament.startDate).toLocaleDateString('hu-HU')} - {' '}
                {new Date(tournament.endDate).toLocaleDateString('hu-HU')}
              </p>
            </div>
          </div>
          <Button className="w-full mt-4" variant={isPast ? 'outline' : 'default'}>
            {isPast ? 'Eredmények' : 'Részletek'}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
