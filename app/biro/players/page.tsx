'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { biroApi } from '@/lib/api';
import { Profile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';

export default function BiroPlayersPage() {
  const router = useRouter();
  const { isBiro, loading } = useAuth();
  const [players, setPlayers] = useState<Profile[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Profile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'biro' | 'player'>('all');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    pfpURL: '',
    is_biro: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !isBiro) {
      router.push('/');
      return;
    }

    if (isBiro) {
      fetchPlayers();
    }
  }, [isBiro, loading, router]);

  useEffect(() => {
    filterPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, searchQuery, roleFilter]);

  async function fetchPlayers() {
    try {
      const data = await biroApi.getProfiles();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
      alert('Hiba történt az adatok betöltése során');
    } finally {
      setLoadingData(false);
    }
  }

  const filterPlayers = () => {
    let filtered = [...players];

    // Role filter
    if (roleFilter === 'biro') {
      filtered = filtered.filter((p) => p.is_biro);
    } else if (roleFilter === 'player') {
      filtered = filtered.filter((p) => !p.is_biro);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const fullName = getPlayerName(p).toLowerCase();
        const username = (p.user?.username || '').toLowerCase();
        return fullName.includes(query) || username.includes(query);
      });
    }

    setFilteredPlayers(filtered);
  };

  const getPlayerName = (player: Profile) => {
    return player.user
      ? `${player.user.last_name} ${player.user.first_name}`
      : `${player.last_name} ${player.first_name}`;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      errors.first_name = 'A keresztnév megadása kötelező';
    }
    if (!formData.last_name.trim()) {
      errors.last_name = 'A vezetéknév megadása kötelező';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (player?: Profile) => {
    setFormErrors({});
    if (player) {
      setEditingPlayer(player);
      setFormData({
        first_name: player.first_name || '',
        last_name: player.last_name || '',
        pfpURL: player.pfpURL || '',
        is_biro: player.is_biro,
      });
    } else {
      setEditingPlayer(null);
      setFormData({
        first_name: '',
        last_name: '',
        pfpURL: '',
        is_biro: false,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (editingPlayer) {
        await biroApi.updateProfile(editingPlayer.id, formData);
      } else {
        await biroApi.createProfile(formData);
      }
      
      setDialogOpen(false);
      fetchPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Hiba történt a mentés során');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a játékost?')) return;
    
    try {
      await biroApi.deleteProfile(id);
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Hiba történt a törlés során');
    }
  };

  if (loading || loadingData) {
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

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-foreground">Játékosok kezelése</h1>
        <Button size="lg" onClick={() => handleOpenDialog()}>+ Új játékos</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="search">Keresés név vagy felhasználónév alapján</Label>
          <Input
            id="search"
            type="text"
            placeholder="Keresés..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="role">Szerep szűrő</Label>
          <select
            id="role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'biro' | 'player')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="all">Mindenki</option>
            <option value="biro">Csak bírók</option>
            <option value="player">Csak játékosok</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{players.length}</p>
              <p className="text-sm text-muted-foreground">Összes profil</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {players.filter((p) => p.is_biro).length}
              </p>
              <p className="text-sm text-muted-foreground">Bírók</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {players.filter((p) => !p.is_biro).length}
              </p>
              <p className="text-sm text-muted-foreground">Játékosok</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map((player) => {
          const fullName = getPlayerName(player);
          const username = player.user?.username || 'Játékos';

          return (
            <Card key={player.id} className="hover:bg-secondary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {player.pfpURL ? (
                    <Image
                      src={player.pfpURL}
                      alt={fullName}
                      width={60}
                      height={60}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-[60px] h-[60px] rounded-full bg-secondary flex items-center justify-center text-2xl font-bold">
                      {fullName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground">@{username}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  {player.is_biro && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      Bíró
                    </span>
                  )}
                  {!player.user && (
                    <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                      Nincs fiók
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/profile/${player.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Profil
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(player)}>Szerkesztés</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(player.id)}>Törlés</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPlayers.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          {searchQuery || roleFilter !== 'all' ? 'Nincs találat a szűrési feltételeknek megfelelően' : 'Még nincsenek játékosok'}
        </p>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlayer ? 'Játékos szerkesztése' : 'Új játékos létrehozása'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="last_name">Vezetéknév *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className={formErrors.last_name ? 'border-red-500' : ''}
                  required
                />
                {formErrors.last_name && <p className="text-xs text-red-500 mt-1">{formErrors.last_name}</p>}
              </div>
              
              <div>
                <Label htmlFor="first_name">Keresztnév *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className={formErrors.first_name ? 'border-red-500' : ''}
                  required
                />
                {formErrors.first_name && <p className="text-xs text-red-500 mt-1">{formErrors.first_name}</p>}
              </div>
              
              <div>
                <Label htmlFor="pfpURL">Profilkép URL (opcionális)</Label>
                <Input
                  id="pfpURL"
                  type="url"
                  value={formData.pfpURL}
                  onChange={(e) => setFormData({ ...formData, pfpURL: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  id="is_biro"
                  type="checkbox"
                  checked={formData.is_biro}
                  onChange={(e) => setFormData({ ...formData, is_biro: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="is_biro" className="cursor-pointer">
                  Bírói jogosultság
                </Label>
              </div>
              
              {editingPlayer && editingPlayer.user && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Felhasználó:</strong> {editingPlayer.user.username}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Ez a profil kapcsolódik egy felhasználói fiókhoz.
                  </p>
                </div>
              )}
              
              {!editingPlayer && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    Ez a profil nincs összekapcsolva felhasználói fiókkal. A játékos később tud regisztrálni.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Mégse
              </Button>
              <Button type="submit">
                {editingPlayer ? 'Mentés' : 'Létrehozás'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
