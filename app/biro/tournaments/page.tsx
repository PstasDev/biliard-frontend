'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { biroApi } from '@/lib/api';
import { Tournament } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function BiroTournamentsPage() {
  const router = useRouter();
  const { isBiro, loading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gameModeFilter, setGameModeFilter] = useState<'all' | '8ball' | 'snooker'>('all');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    gameMode: '8ball' as '8ball' | 'snooker',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !isBiro) {
      router.push('/');
      return;
    }

    if (isBiro) {
      fetchTournaments();
    }
  }, [isBiro, loading, router]);

  useEffect(() => {
    filterTournaments();
  }, [tournaments, searchQuery, gameModeFilter]);

  async function fetchTournaments() {
    try {
      const data = await biroApi.getTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      alert('Hiba történt az adatok betöltése során');
    } finally {
      setLoadingData(false);
    }
  }

  const filterTournaments = () => {
    let filtered = [...tournaments];

    // Game mode filter
    if (gameModeFilter !== 'all') {
      filtered = filtered.filter((t) => t.gameMode === gameModeFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => 
        t.name.toLowerCase().includes(query) ||
        t.location.toLowerCase().includes(query)
      );
    }

    setFilteredTournaments(filtered);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'A név megadása kötelező';
    }
    if (!formData.location.trim()) {
      errors.location = 'A helyszín megadása kötelező';
    }
    if (!formData.startDate) {
      errors.startDate = 'A kezdő dátum megadása kötelező';
    }
    if (!formData.endDate) {
      errors.endDate = 'A befejező dátum megadása kötelező';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      errors.endDate = 'A befejező dátum nem lehet korábbi, mint a kezdő dátum';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (tournament?: Tournament) => {
    setFormErrors({});
    if (tournament) {
      setEditingTournament(tournament);
      setFormData({
        name: tournament.name,
        location: tournament.location,
        startDate: tournament.startDate.split('T')[0],
        endDate: tournament.endDate.split('T')[0],
        gameMode: tournament.gameMode,
      });
    } else {
      setEditingTournament(null);
      setFormData({
        name: '',
        location: '',
        startDate: '',
        endDate: '',
        gameMode: '8ball',
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
      if (editingTournament) {
        await biroApi.updateTournament(editingTournament.id, formData);
      } else {
        await biroApi.createTournament(formData);
      }
      
      setDialogOpen(false);
      fetchTournaments();
    } catch (error) {
      console.error('Error saving tournament:', error);
      alert('Hiba történt a mentés során');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a bajnokságot? Ez törli az összes kapcsolódó meccset is.')) return;
    
    try {
      await biroApi.deleteTournament(id);
      fetchTournaments();
    } catch (error) {
      console.error('Error deleting tournament:', error);
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
        <h1 className="text-4xl font-bold text-foreground">Bajnokságok kezelése</h1>
        <Button size="lg" onClick={() => handleOpenDialog()}>+ Új bajnokság</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="search">Keresés név vagy helyszín alapján</Label>
          <Input
            id="search"
            type="text"
            placeholder="Keresés..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="gameMode">Játékmód szűrő</Label>
          <select
            id="gameMode"
            value={gameModeFilter}
            onChange={(e) => setGameModeFilter(e.target.value as 'all' | '8ball' | 'snooker')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="all">Minden játékmód</option>
            <option value="8ball">8-as golyó</option>
            <option value="snooker">Snooker</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{tournaments.length}</p>
              <p className="text-sm text-muted-foreground">Összes bajnokság</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {tournaments.filter((t) => t.gameMode === '8ball').length}
              </p>
              <p className="text-sm text-muted-foreground">8-as golyó</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {tournaments.filter((t) => t.gameMode === 'snooker').length}
              </p>
              <p className="text-sm text-muted-foreground">Snooker</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {filteredTournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:bg-secondary/50 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{tournament.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">{tournament.location}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/tournaments/${tournament.id}`}>
                    <Button variant="outline" size="sm">Részletek</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(tournament)}>Szerkesztés</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(tournament.id)}>Törlés</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Játékmód</p>
                  <p className="font-semibold">
                    {tournament.gameMode === '8ball' ? '🎱 8-as golyó' : '🔴 Snooker'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kezdés</p>
                  <p className="font-semibold">
                    {new Date(tournament.startDate).toLocaleDateString('hu-HU')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Befejezés</p>
                  <p className="font-semibold">
                    {new Date(tournament.endDate).toLocaleDateString('hu-HU')}
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTournaments.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          {searchQuery || gameModeFilter !== 'all' ? 'Nincs találat a szűrési feltételeknek megfelelően' : 'Még nincsenek bajnokságok'}
        </p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTournament ? 'Bajnokság szerkesztése' : 'Új bajnokság létrehozása'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Név *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'border-red-500' : ''}
                  required
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <Label htmlFor="location">Helyszín *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={formErrors.location ? 'border-red-500' : ''}
                  required
                />
                {formErrors.location && <p className="text-xs text-red-500 mt-1">{formErrors.location}</p>}
              </div>
              <div>
                <Label htmlFor="gameMode">Játékmód *</Label>
                <select
                  id="gameMode"
                  value={formData.gameMode}
                  onChange={(e) => setFormData({ ...formData, gameMode: e.target.value as '8ball' | 'snooker' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required
                >
                  <option value="8ball">🎱 8-as golyó</option>
                  <option value="snooker">🔴 Snooker</option>
                </select>
              </div>
              <div>
                <Label htmlFor="startDate">Kezdés *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={formErrors.startDate ? 'border-red-500' : ''}
                  required
                />
                {formErrors.startDate && <p className="text-xs text-red-500 mt-1">{formErrors.startDate}</p>}
              </div>
              <div>
                <Label htmlFor="endDate">Befejezés *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={formErrors.endDate ? 'border-red-500' : ''}
                  required
                />
                {formErrors.endDate && <p className="text-xs text-red-500 mt-1">{formErrors.endDate}</p>}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Mégse
              </Button>
              <Button type="submit">
                {editingTournament ? 'Mentés' : 'Létrehozás'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
