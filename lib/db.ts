import { createClient } from '@/lib/supabase/server'
import type { Player, MatchView } from '@/types'

type RawMatch = {
  id: number
  played_on: string
  match_type: 'singles' | 'doubles'
  best_of: 1 | 3
  is_completed: boolean
  is_projected: boolean
  winner_side: 0 | 1 | null
  match_participants: {
    side: 0 | 1
    players: { name: string }
  }[]
  match_sets: {
    set_number: number
    games_side_0: number
    games_side_1: number
  }[]
}

function toMatchView(raw: RawMatch): MatchView {
  const sideA = raw.match_participants
    .filter(p => p.side === 0)
    .map(p => p.players.name)
  const sideB = raw.match_participants
    .filter(p => p.side === 1)
    .map(p => p.players.name)
  const setScores = [...raw.match_sets]
    .sort((a, b) => a.set_number - b.set_number)
    .map(s => [s.games_side_0, s.games_side_1] as [number, number])

  return {
    id: raw.id,
    played_on: raw.played_on,
    match_type: raw.match_type,
    best_of: raw.best_of,
    is_completed: raw.is_completed,
    is_projected: raw.is_projected,
    winner_side: raw.winner_side,
    sideA,
    sideB,
    setScores,
  }
}

export async function getPlayers(): Promise<Player[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .is('archived_at', null)
    .order('name')
  if (error) throw error
  return data as Player[]
}

export async function getMatches(): Promise<MatchView[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, played_on, match_type, best_of, is_completed, is_projected, winner_side,
      match_participants ( side, players ( name ) ),
      match_sets ( set_number, games_side_0, games_side_1 )
    `)
    .order('played_on', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as unknown as RawMatch[]).map(toMatchView)
}
