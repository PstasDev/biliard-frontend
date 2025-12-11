// TypeScript types matching Django backend models

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Profile {
  id: number;
  user?: User;
  first_name?: string;
  last_name?: string;
  pfpURL?: string | null;
  is_biro: boolean;
}

export interface Ball {
  id: string;
  name: string;
  color: string;
  full?: boolean;
}

export const balls: Ball[] = [
  { id: 'cue', name: 'Kijátszó golyó', color: 'white' },
  { id: '1', name: '1-es golyó', color: 'yellow', full: true },
  { id: '2', name: '2-es golyó', color: 'blue', full: true },
  { id: '3', name: '3-as golyó', color: 'red', full: true },
  { id: '4', name: '4-es golyó', color: 'purple', full: true },
  { id: '5', name: '5-ös golyó', color: 'orange', full: true },
  { id: '6', name: '6-os golyó', color: 'green', full: true },
  { id: '7', name: '7-es golyó', color: 'maroon', full: true },
  { id: '8', name: '8-as golyó', color: 'black', full: true },
  { id: '9', name: '9-es golyó', color: 'yellow', full: false },
  { id: '10', name: '10-es golyó', color: 'blue', full: false },
  { id: '11', name: '11-es golyó', color: 'red', full: false },
  { id: '12', name: '12-es golyó', color: 'purple', full: false },
  { id: '13', name: '13-as golyó', color: 'orange', full: false },
  { id: '14', name: '14-es golyó', color: 'green', full: false },
  { id: '15', name: '15-ös golyó', color: 'maroon', full: false },
];

export type GameMode = '8ball' | 'snooker';

export interface Tournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  gameMode: GameMode;
  phases?: Phase[];
}

export type EliminationSystem = 'group' | 'elimination';

export interface Phase {
  id: number;
  tournament?: number;
  order: number;
  eliminationSystem: EliminationSystem;
  groups?: Group[];
  matches?: Match[];
}

export interface Group {
  id: number;
  phase?: number;
  name: string;
  matches?: Match[];
}

export type EventType =
  | 'start'
  | 'end'
  | 'next_player'
  | 'score_update'
  | 'balls_potted'
  | 'faul'
  | 'faul_and_next_player'
  | 'cue_ball_left_table'
  | 'cue_ball_gets_positioned';

export type BallGroup = 'full' | 'striped' | null;

export interface MatchEvent {
  id: number;
  eventType: EventType;
  timestamp: string;
  details?: string;
  turn_number?: number;
  player?: Profile;
  ball_ids?: string[];
}

export interface Frame {
  id: number;
  match?: number;
  frame_number: number;
  events?: MatchEvent[];
  winner?: Profile;
  player1_ball_group?: BallGroup;
  player2_ball_group?: BallGroup;
}

export interface Match {
  id: number;
  phase: number | Phase;
  group?: number | Group;
  player1: Profile;
  player2: Profile;
  match_date?: string;
  frames_to_win: number;
  broadcastURL?: string;
  match_frames?: Frame[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: Profile;
}

export interface WebSocketMessage {
  type: 'match_state' | 'match_update' | 'frame_update' | 'event_created' | 'ping' | 'pong';
  data?: unknown;
}
