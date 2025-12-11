// API utilities for backend communication
/* eslint-disable @typescript-eslint/no-explicit-any */

const isProduction = process.env.NODE_ENV === 'production';
const API_BASE_URL = isProduction
  ? 'https://biliardapi.szlg.info'
  : 'http://localhost:8000/api';

export const getApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

export const getWebSocketUrl = (endpoint: string) => {
  const wsProtocol = isProduction ? 'wss' : 'ws';
  const baseUrl = isProduction ? 'biliardapi.szlg.info' : 'localhost:8000';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${wsProtocol}://${baseUrl}/${cleanEndpoint}`;
};

// Token management
export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

export const setAccessToken = (token: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', token);
};

export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
};

export const setRefreshToken = (token: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('refresh_token', token);
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_profile');
};

export const getUserProfile = () => {
  if (typeof window === 'undefined') return null;
  const profile = localStorage.getItem('user_profile');
  return profile ? JSON.parse(profile) : null;
};

export const setUserProfile = (profile: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_profile', JSON.stringify(profile));
};

// Generic fetch wrapper
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Public API methods
export const publicApi = {
  getTournaments: () => fetchApi<any[]>('/tournaments/'),
  getTournament: (id: number) => fetchApi<any>(`/tournaments/${id}/`),
  getMatches: (tournamentId?: number) => {
    const query = tournamentId ? `?tournament_id=${tournamentId}` : '';
    return fetchApi<any[]>(`/matches/${query}`);
  },
  getMatch: (id: number) => fetchApi<any>(`/matches/${id}/`),
};

// Authenticated API methods
export const authApi = {
  login: (username: string, password: string) =>
    fetchApi<any>('/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getMyProfile: () => fetchApi<any>('/profile/'),
  getUserProfile: (userId: number) => fetchApi<any>(`/profile/${userId}/`),
};

// Bíró API methods
export const biroApi = {
  // Tournaments
  getTournaments: () => fetchApi<any[]>('/biro/tournaments/'),
  createTournament: (data: any) =>
    fetchApi<any>('/biro/tournaments/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTournament: (id: number) => fetchApi<any>(`/biro/tournaments/${id}/`),
  updateTournament: (id: number, data: any) =>
    fetchApi<any>(`/biro/tournaments/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTournament: (id: number) =>
    fetchApi<any>(`/biro/tournaments/${id}/`, { method: 'DELETE' }),

  // Phases
  getPhases: (tournamentId: number) =>
    fetchApi<any[]>(`/biro/tournaments/${tournamentId}/phases/`),
  createPhase: (tournamentId: number, data: any) =>
    fetchApi<any>(`/biro/tournaments/${tournamentId}/phases/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePhase: (id: number, data: any) =>
    fetchApi<any>(`/biro/phases/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePhase: (id: number) =>
    fetchApi<any>(`/biro/phases/${id}/`, { method: 'DELETE' }),

  // Groups
  getGroups: (phaseId: number) =>
    fetchApi<any[]>(`/biro/phases/${phaseId}/groups/`),
  createGroup: (phaseId: number, data: any) =>
    fetchApi<any>(`/biro/phases/${phaseId}/groups/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateGroup: (id: number, data: any) =>
    fetchApi<any>(`/biro/groups/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteGroup: (id: number) =>
    fetchApi<any>(`/biro/groups/${id}/`, { method: 'DELETE' }),

  // Matches
  getMatches: (phaseId?: number, groupId?: number) => {
    const params = new URLSearchParams();
    if (phaseId) params.append('phase_id', phaseId.toString());
    if (groupId) params.append('group_id', groupId.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<any[]>(`/biro/matches/${query}`);
  },
  createMatch: (data: any) =>
    fetchApi<any>('/biro/matches/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMatch: (id: number) => fetchApi<any>(`/biro/matches/${id}/`),
  updateMatch: (id: number, data: any) =>
    fetchApi<any>(`/biro/matches/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteMatch: (id: number) =>
    fetchApi<any>(`/biro/matches/${id}/`, { method: 'DELETE' }),

  // Frames
  getFrames: (matchId: number) =>
    fetchApi<any[]>(`/biro/matches/${matchId}/frames/`),
  createFrame: (matchId: number, data: any) =>
    fetchApi<any>(`/biro/matches/${matchId}/frames/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFrame: (id: number, data: any) =>
    fetchApi<any>(`/biro/frames/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFrame: (id: number) =>
    fetchApi<any>(`/biro/frames/${id}/`, { method: 'DELETE' }),

  // Events
  createEvent: (frameId: number, data: any) =>
    fetchApi<any>(`/biro/frames/${frameId}/events/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Profiles
  getProfiles: () => fetchApi<any[]>('/biro/profiles/'),
  createProfile: (data: any) =>
    fetchApi<any>('/biro/profiles/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProfile: (id: number, data: any) =>
    fetchApi<any>(`/biro/profiles/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProfile: (id: number) =>
    fetchApi<any>(`/biro/profiles/${id}/`, { method: 'DELETE' }),
};
