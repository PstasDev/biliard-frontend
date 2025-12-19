'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import { Profile, Match } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const userId = parseInt(params.id as string);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!isAuthenticated) {
        return;
      }
      try {
        const data = await authApi.getUserProfile(userId);
        setProfile(data);
        // TODO: Fetch user's matches
      } catch (error: unknown) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId, isAuthenticated]);

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

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-muted-foreground">Profil nem található</p>
      </div>
    );
  }

  const fullName = profile.user
    ? `${profile.user.last_name} ${profile.user.first_name}`
    : `${profile.last_name} ${profile.first_name}`;

  const username = profile.user?.username || 'Játékos';

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-6">
            {profile.pfpURL && (
              <Image
                src={profile.pfpURL}
                alt={fullName}
                width={120}
                height={120}
                className="rounded-full"
              />
            )}
            <div>
              <CardTitle className="text-3xl mb-2">{fullName}</CardTitle>
              <p className="text-muted-foreground">@{username}</p>
              {profile.is_biro && (
                <span className="inline-block mt-2 text-xs bg-secondary/60 text-foreground px-2 py-1 rounded">
                  Bíró
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <p className="text-3xl font-bold">{matches.length}</p>
              <p className="text-sm text-muted-foreground">Mérkőzések</p>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <p className="text-3xl font-bold">
                {matches.filter(m => 
                  m.match_frames?.some(f => f.winner?.id === profile.id)
                ).length}
              </p>
              <p className="text-sm text-muted-foreground">Győzelmek</p>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Versenyrangsor</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Mérkőzések</h2>
        {matches.length === 0 ? (
          <p className="text-muted-foreground">Még nincsenek mérkőzések</p>
        ) : (
          <div className="space-y-4">
            {/* TODO: Add match cards */}
          </div>
        )}
      </div>
    </div>
  );
}
