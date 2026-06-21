'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MatchInput } from '@/types'

/** Upserts a player by name; returns their id. */
async function resolvePlayerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
  userId: string | null
): Promise<number> {
  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .eq('name', name)
    .is('archived_at', null)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('players')
    .insert({ name, user_id: userId })
    .select('id')
    .single()
  if (error) throw error
  return created.id
}

export async function addMatch(input: MatchInput): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { data: match, error: mErr } = await supabase
    .from('matches')
    .insert({
      played_on: input.playedOn,
      match_type: input.matchType,
      best_of: input.bestOf,
      is_completed: input.isCompleted,
      is_projected: input.isProjected,
      winner_side: input.winnerSide,
      created_by: userId,
    })
    .select('id')
    .single()
  if (mErr) throw mErr

  const matchId = match.id

  const allNames = [...input.sideANames, ...input.sideBNames]
  const ids = await Promise.all(allNames.map(n => resolvePlayerId(supabase, n, userId)))
  const sideAIds = ids.slice(0, input.sideANames.length)
  const sideBIds = ids.slice(input.sideANames.length)

  const participants = [
    ...sideAIds.map(pid => ({ match_id: matchId, player_id: pid, side: 0 })),
    ...sideBIds.map(pid => ({ match_id: matchId, player_id: pid, side: 1 })),
  ]
  const { error: pErr } = await supabase.from('match_participants').insert(participants)
  if (pErr) throw pErr

  const sets = input.setScores.map(([g0, g1], i) => ({
    match_id: matchId,
    set_number: i + 1,
    games_side_0: g0,
    games_side_1: g1,
    was_tiebreak: false,
  }))
  const { error: sErr } = await supabase.from('match_sets').insert(sets)
  if (sErr) throw sErr

  revalidateTag('matches', 'max')
  revalidateTag('players', 'max')
  revalidatePath('/history')
  revalidatePath('/stats')
  revalidatePath('/log')
}

export async function updateMatch(matchId: number, input: MatchInput): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { error: mErr } = await supabase
    .from('matches')
    .update({
      played_on: input.playedOn,
      match_type: input.matchType,
      best_of: input.bestOf,
      is_completed: input.isCompleted,
      is_projected: input.isProjected,
      winner_side: input.winnerSide,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)
  if (mErr) throw mErr

  // Rebuild participants
  await supabase.from('match_participants').delete().eq('match_id', matchId)
  const allNames = [...input.sideANames, ...input.sideBNames]
  const ids = await Promise.all(allNames.map(n => resolvePlayerId(supabase, n, userId)))
  const sideAIds = ids.slice(0, input.sideANames.length)
  const sideBIds = ids.slice(input.sideANames.length)
  const participants = [
    ...sideAIds.map(pid => ({ match_id: matchId, player_id: pid, side: 0 })),
    ...sideBIds.map(pid => ({ match_id: matchId, player_id: pid, side: 1 })),
  ]
  const { error: pErr } = await supabase.from('match_participants').insert(participants)
  if (pErr) throw pErr

  // Rebuild sets
  await supabase.from('match_sets').delete().eq('match_id', matchId)
  const sets = input.setScores.map(([g0, g1], i) => ({
    match_id: matchId,
    set_number: i + 1,
    games_side_0: g0,
    games_side_1: g1,
    was_tiebreak: false,
  }))
  const { error: sErr } = await supabase.from('match_sets').insert(sets)
  if (sErr) throw sErr

  revalidateTag('matches', 'max')
  revalidateTag('players', 'max')
  revalidatePath('/history')
  revalidatePath('/stats')
}

export async function addPlayer(
  name: string,
  age: number | null,
  skillLevel: string | null,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('players')
    .insert({
      name,
      age,
      skill_level: skillLevel || null,
      user_id: user?.id ?? null
    })
  if (error) throw error

  revalidateTag('players', 'max')
  revalidatePath('/players')
  revalidatePath('/log')
  revalidatePath('/live')
}

export async function updatePlayer(
  id: number,
  originalName: string,
  name: string,
  age: number | null,
  skillLevel: string | null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('players')
    .update({ name, age, skill_level: skillLevel || null })
    .eq('id', id)
  if (error) throw error

  revalidateTag('players', 'max')
  revalidateTag('matches', 'max')
  revalidatePath('/players')
  revalidatePath('/history')
  revalidatePath('/stats')
}

export async function archivePlayer(id: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('players')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error

  revalidateTag('players', 'max')
  revalidatePath('/players')
}

export async function deleteMatch(matchId: number): Promise<void> {
  const supabase = await createClient()

  // Delete dependent rows first to satisfy FK constraints
  const { error: pErr } = await supabase.from('match_participants').delete().eq('match_id', matchId)
  if (pErr) throw pErr

  const { error: sErr } = await supabase.from('match_sets').delete().eq('match_id', matchId)
  if (sErr) throw sErr

  // Delete the match itself
  const { error: mErr } = await supabase.from('matches').delete().eq('id', matchId)
  if (mErr) throw mErr

  revalidateTag('matches', 'max')
  revalidatePath('/history')
  revalidatePath('/stats')
}
