'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BiroPage() {
  const router = useRouter();
  const { isBiro, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isBiro) {
      router.push('/');
    }
  }, [isBiro, loading, router]);

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

  if (!isBiro) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-foreground">Bírói felület</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/biro/tournaments">
          <Card className="hover:bg-secondary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Bajnokságok kezelése</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Bajnokságok létrehozása, szerkesztése és törlése
              </p>
              <Button className="w-full mt-4">Megnyitás</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/biro/matches">
          <Card className="hover:bg-secondary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Mérkőzések kezelése</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Mérkőzések létrehozása és szervezése
              </p>
              <Button className="w-full mt-4">Megnyitás</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/biro/live">
          <Card className="hover:bg-secondary/50 transition-colors cursor-pointer h-full wood-border">
            <CardHeader>
              <CardTitle className="text-foreground font-bold">Élő közvetítés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Mérkőzések élő frissítése mobil nézetben
              </p>
              <Button className="w-full mt-4" variant="default">
                🔴 Élő
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/biro/players">
          <Card className="hover:bg-secondary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Játékosok kezelése</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Játékos profilok kezelése
              </p>
              <Button className="w-full mt-4">Megnyitás</Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
