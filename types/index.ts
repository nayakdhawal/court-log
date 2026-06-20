export interface Player {
  id: number
  name: string
  age: number | null
  skill_level: 'Beginner' | 'Intermediate' | 'Advanced' | null
  created_at: string
  archived_at: string | null
}

export interface MatchSet {
  id?: number
  match_id?: number
  set_number: number
  games_side_0: number
  games_side_1: number
  was_tiebreak: boolean
}

/** Flattened view used throughout the UI */
export interface MatchView {
  id: number
  played_on: string
  match_type: 'singles' | 'doubles'
  best_of: 1 | 3
  is_completed: boolean
  is_projected: boolean
  winner_side: 0 | 1 | null
  sideA: string[]
  sideB: string[]
  setScores: [number, number][]
}

/** Input shape for create / update mutations */
export interface MatchInput {
  playedOn: string
  matchType: 'singles' | 'doubles'
  bestOf: 1 | 3
  sideANames: string[]
  sideBNames: string[]
  setScores: [number, number][]
  isCompleted: boolean
  isProjected: boolean
  winnerSide: 0 | 1
}

/** Live scoring state — kept in localStorage only, never in the DB mid-match */
export interface LiveMatchState {
  type: 'singles' | 'doubles'
  sideA: string[]
  sideB: string[]
  bestOf3: boolean
  sets: [number, number][]
  currentSetGames: [number, number]
  currentGamePoints: [number, number]
  tiebreak: { points: [number, number] } | null
  server: 0 | 1
  history: LiveMatchSnapshot[]
  startedAt: string
}

export type LiveMatchSnapshot = Omit<LiveMatchState, 'history'>
