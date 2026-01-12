'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { biroApi } from '@/lib/api';
import { Match, Profile, Tournament, Phase } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function BiroMatchesPage() {
  const router = useRouter();
  const { isBiro, loading } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'finished'>('all');
  const [formData, setFormData] = useState({
    tournament_id: '',
    phase_id: '',
    player1_id: '',
    player2_id: '',
    frames_to_win: 3,
    match_date: '',
    broadcastURL: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !isBiro) {
      router.push('/');
      return;
    }

    if (isBiro) {
      fetchData();
    }
  }, [isBiro, loading, router]);

  useEffect(() => {
    filterMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, searchQuery, statusFilter]);

  async function fetchData() {
    try {
      const [matchesData, playersData, tournamentsData] = await Promise.all([
        biroApi.getMatches(),
        biroApi.getProfiles(),
        biroApi.getTournaments(),
      ]);
      setMatches(matchesData);
      setPlayers(playersData);
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Hiba történt az adatok betöltése során');
    } finally {
      setLoadingData(false);
    }
  }

  const filterMatches = () => {
    let filtered = [...matches];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((match) => {
        const player1Wins = match.match_frames?.filter(f => f.winner?.id === match.player1.id).length || 0;
        const player2Wins = match.match_frames?.filter(f => f.winner?.id === match.player2.id).length || 0;
        const totalFrames = match.frames_to_win;
        // For even N need (N/2)+1 to win, for odd N need ceil(N/2)
        const framesNeededToWin = totalFrames % 2 === 0 ? (totalFrames / 2) + 1 : Math.ceil(totalFrames / 2);
        const isFinished = player1Wins >= framesNeededToWin || 
                          player2Wins >= framesNeededToWin ||
                          (totalFrames % 2 === 0 && player1Wins + player2Wins >= totalFrames);
        
        return statusFilter === 'finished' ? isFinished : !isFinished;
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((match) => {
        const player1Name = match.player1.user
          ? `${match.player1.user.last_name} ${match.player1.user.first_name}`
          : `${match.player1.last_name} ${match.player1.first_name}`;
        
        const player2Name = match.player2.user
          ? `${match.player2.user.last_name} ${match.player2.user.first_name}`
          : `${match.player2.last_name} ${match.player2.first_name}`;

        return (
          player1Name.toLowerCase().includes(query) ||
          player2Name.toLowerCase().includes(query) ||
          match.id.toString().includes(query)
        );
      });
    }

    setFilteredMatches(filtered);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.tournament_id) {
      errors.tournament_id = 'Válassz bajnokságot';
    }
    if (!formData.phase_id) {
      errors.phase_id = 'Válassz szakaszt';
    }
    if (!formData.player1_id) {
      errors.player1_id = 'Válassz első játékost';
    }
    if (!formData.player2_id) {
      errors.player2_id = 'Válassz második játékost';
    }
    if (formData.player1_id && formData.player2_id && formData.player1_id === formData.player2_id) {
      errors.player2_id = 'A két játékos nem lehet ugyanaz';
    }
    if (formData.frames_to_win < 1) {
      errors.frames_to_win = 'Legalább 1 frame szükséges';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (match?: Match) => {
    setFormErrors({});
    if (match) {
      setEditingMatch(match);
      const tournamentId = typeof match.phase === 'object' && match.phase ? match.phase.tournament : '';
      const phaseId = typeof match.phase === 'object' && match.phase ? match.phase.id : match.phase;
      
      setFormData({
        tournament_id: tournamentId?.toString() || '',
        phase_id: phaseId?.toString() || '',
        player1_id: match.player1.id.toString(),
        player2_id: match.player2.id.toString(),
        frames_to_win: match.frames_to_win,
        match_date: match.match_date ? new Date(match.match_date).toISOString().slice(0, 16) : '',
        broadcastURL: match.broadcastURL || '',
      });
      
      // Load phases for the tournament if exists
      if (tournamentId) {
        loadPhasesForTournament(Number(tournamentId));
      }
    } else {
      setEditingMatch(null);
      setFormData({
        tournament_id: '',
        phase_id: '',
        player1_id: '',
        player2_id: '',
        frames_to_win: 3,
        match_date: '',
        broadcastURL: '',
      });
      setPhases([]);
    }
    setDialogOpen(true);
  };

  const loadPhasesForTournament = async (tournamentId: number) => {
    try {
      const phasesData = await biroApi.getPhases(tournamentId);
      setPhases(phasesData);
    } catch (error) {
      console.error('Error loading phases:', error);
      setPhases([]);
    }
  };

  const handleTournamentChange = (tournamentId: string) => {
    setFormData({ ...formData, tournament_id: tournamentId, phase_id: '' });
    if (tournamentId) {
      loadPhasesForTournament(Number(tournamentId));
    } else {
      setPhases([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const data = {
        phase_id: parseInt(formData.phase_id),
        player1_id: parseInt(formData.player1_id),
        player2_id: parseInt(formData.player2_id),
        frames_to_win: formData.frames_to_win,
        match_date: formData.match_date || undefined,
        broadcastURL: formData.broadcastURL || undefined,
      };
      
      if (editingMatch) {
        await biroApi.updateMatch(editingMatch.id, data);
      } else {
        await biroApi.createMatch(data);
      }
      
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Hiba történt a mentés során');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a mérkőzést? Ez törli az összes frame-et és eseményt is.')) return;
    
    try {
      await biroApi.deleteMatch(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting match:', error);
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

  const getPlayerName = (player: Profile) => {
    return player.user
      ? `${player.user.last_name} ${player.user.first_name}`
      : `${player.last_name} ${player.first_name}`;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/biro" className="text-sm text-muted-foreground hover:text-foreground">
          ← Vissza a bírói felületre
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-foreground">Mérkőzések kezelése</h1>
        <Button size="lg" onClick={() => handleOpenDialog()}>+ Új mérkőzés</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="search">Keresés játékos vagy ID alapján</Label>
          <Input
            id="search"
            type="text"
            placeholder="Keresés..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="status">Állapot szűrő</Label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ongoing' | 'finished')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="all">Minden mérkőzés</option>
            <option value="ongoing">Folyamatban</option>
            <option value="finished">Befejezett</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{matches.length}</p>
              <p className="text-sm text-muted-foreground">Összes mérkőzés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {matches.filter((m) => {
                  const p1Wins = m.match_frames?.filter(f => f.winner?.id === m.player1.id).length || 0;
                  const p2Wins = m.match_frames?.filter(f => f.winner?.id === m.player2.id).length || 0;
                  const totalFrames = m.frames_to_win;
                  const framesNeededToWin = Math.ceil(totalFrames / 2);
                  return p1Wins < framesNeededToWin && p2Wins < framesNeededToWin &&
                         !(totalFrames % 2 === 0 && p1Wins + p2Wins >= totalFrames);
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Folyamatban</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {matches.filter((m) => {
                  const p1Wins = m.match_frames?.filter(f => f.winner?.id === m.player1.id).length || 0;
                  const p2Wins = m.match_frames?.filter(f => f.winner?.id === m.player2.id).length || 0;
                  const totalFrames = m.frames_to_win;
                  const framesNeededToWin = Math.ceil(totalFrames / 2);
                  return p1Wins >= framesNeededToWin || p2Wins >= framesNeededToWin ||
                         (totalFrames % 2 === 0 && p1Wins + p2Wins >= totalFrames);
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Befejezett</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches List */}
      <div className="grid gap-4">
        {filteredMatches.map((match) => {
          const player1Name = getPlayerName(match.player1);
          const player2Name = getPlayerName(match.player2);

          const player1Wins = match.match_frames?.filter(f => f.winner?.id === match.player1.id).length || 0;
          const player2Wins = match.match_frames?.filter(f => f.winner?.id === match.player2.id).length || 0;
          const totalFrames = match.frames_to_win;
          const framesNeededToWin = Math.ceil(totalFrames / 2);
          
          const isFinished = player1Wins >= framesNeededToWin || 
                            player2Wins >= framesNeededToWin ||
                            (totalFrames % 2 === 0 && player1Wins + player2Wins >= totalFrames);
          const winner = player1Wins >= framesNeededToWin ? match.player1 : 
                        player2Wins >= framesNeededToWin ? match.player2 : null;

          return (
            <Card key={match.id} className="hover:bg-secondary/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">Mérkőzés #{match.id}</CardTitle>
                    {isFinished && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Befejezett</span>}
                    {!isFinished && (player1Wins > 0 || player2Wins > 0) && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Folyamatban</span>}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/matches/${match.id}`}>
                      <Button variant="outline" size="sm">Részletek</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(match)}>Szerkesztés</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(match.id)}>Törlés</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className={`font-semibold text-lg ${winner?.id === match.player1.id ? 'text-green-600' : ''}`}>
                      {player1Name}
                      {winner?.id === match.player1.id && ' 🏆'}
                    </p>
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
                    <p className={`font-semibold text-lg ${winner?.id === match.player2.id ? 'text-green-600' : ''}`}>
                      {player2Name}
                      {winner?.id === match.player2.id && ' 🏆'}
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  {match.match_date && (
                    <div>
                      <p className="text-muted-foreground">Időpont</p>
                      <p className="font-semibold">
                        {new Date(match.match_date).toLocaleString('hu-HU')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Framek</p>
                    <p className="font-semibold">{match.match_frames?.length || 0} lejátszva</p>
                  </div>
                  {match.broadcastURL && (
                    <div>
                      <p className="text-muted-foreground">Közvetítés</p>
                      <a 
                        href={match.broadcastURL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        🔴 Nézés
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMatches.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          {searchQuery || statusFilter !== 'all' ? 'Nincs találat a szűrési feltételeknek megfelelően' : 'Még nincsenek mérkőzések'}
        </p>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMatch ? 'Mérkőzés szerkesztése' : 'Új mérkőzés létrehozása'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tournament">Bajnokság *</Label>
                <select
                  id="tournament"
                  value={formData.tournament_id}
                  onChange={(e) => handleTournamentChange(e.target.value)}
                  className={`flex h-10 w-full rounded-md border ${formErrors.tournament_id ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background`}
                  required
                >
                  <option value="">Válassz bajnokságot</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
                {formErrors.tournament_id && <p className="text-xs text-red-500 mt-1">{formErrors.tournament_id}</p>}
              </div>

              <div>
                <Label htmlFor="phase">Szakasz *</Label>
                <select
                  id="phase"
                  value={formData.phase_id}
                  onChange={(e) => setFormData({ ...formData, phase_id: e.target.value })}
                  className={`flex h-10 w-full rounded-md border ${formErrors.phase_id ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background`}
                  disabled={!formData.tournament_id}
                  required
                >
                  <option value="">Válassz szakaszt</option>
                  {phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.order}. szakasz - {phase.eliminationSystem === 'group' ? 'Csoportkör' : 'Egyenes kieséses'}
                    </option>
                  ))}
                </select>
                {formErrors.phase_id && <p className="text-xs text-red-500 mt-1">{formErrors.phase_id}</p>}
                {!formData.tournament_id && (
                  <p className="text-xs text-muted-foreground mt-1">Először válassz bajnokságot</p>
                )}
              </div>

              <div>
                <Label htmlFor="player1">Játékos 1 *</Label>
                <select
                  id="player1"
                  value={formData.player1_id}
                  onChange={(e) => setFormData({ ...formData, player1_id: e.target.value })}
                  className={`flex h-10 w-full rounded-md border ${formErrors.player1_id ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background`}
                  required
                >
                  <option value="">Válassz játékost</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {getPlayerName(player)}
                    </option>
                  ))}
                </select>
                {formErrors.player1_id && <p className="text-xs text-red-500 mt-1">{formErrors.player1_id}</p>}
              </div>
              
              <div>
                <Label htmlFor="player2">Játékos 2 *</Label>
                <select
                  id="player2"
                  value={formData.player2_id}
                  onChange={(e) => setFormData({ ...formData, player2_id: e.target.value })}
                  className={`flex h-10 w-full rounded-md border ${formErrors.player2_id ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background`}
                  required
                >
                  <option value="">Válassz játékost</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {getPlayerName(player)}
                    </option>
                  ))}
                </select>
                {formErrors.player2_id && <p className="text-xs text-red-500 mt-1">{formErrors.player2_id}</p>}
              </div>
              
              <div>
                <Label htmlFor="frames_to_win">Nyerő framek száma *</Label>
                <Input
                  id="frames_to_win"
                  type="number"
                  min="1"
                  value={formData.frames_to_win}
                  onChange={(e) => setFormData({ ...formData, frames_to_win: parseInt(e.target.value) || 1 })}
                  className={formErrors.frames_to_win ? 'border-red-500' : ''}
                  required
                />
                {formErrors.frames_to_win && <p className="text-xs text-red-500 mt-1">{formErrors.frames_to_win}</p>}
                <p className="text-xs text-muted-foreground mt-1">Pl: 3 = Best of 5, 5 = Best of 9</p>
              </div>
              
              <div>
                <Label htmlFor="match_date">Mérkőzés időpontja</Label>
                <Input
                  id="match_date"
                  type="datetime-local"
                  value={formData.match_date}
                  onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="broadcastURL">Közvetítés URL (opcionális)</Label>
                <Input
                  id="broadcastURL"
                  type="url"
                  value={formData.broadcastURL}
                  onChange={(e) => setFormData({ ...formData, broadcastURL: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Mégse
              </Button>
              <Button type="submit">
                {editingMatch ? 'Mentés' : 'Létrehozás'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
