import type { MatchView } from '@/types'

export interface PlayerStat {
  name: string
  wins: number
  losses: number
  results: ('W' | 'L')[]
  currentStreak: number
  streakType: 'W' | 'L' | null
}

export interface PairStat {
  names: string[]
  wins: number
  losses: number
  results: ('W' | 'L')[]
  currentStreak: number
  streakType: 'W' | 'L' | null
}

export interface H2HRecord {
  players: [string, string]
  wins: Record<string, number>
}

export interface StatsResult {
  playerStats: Record<string, PlayerStat>
  pairStats: Record<string, PairStat>
  h2h: Record<string, H2HRecord>
}

function nameKey(names: string[]): string {
  return [...names].sort().join(' & ')
}

function finalizeStreak(obj: PlayerStat | PairStat) {
  const res = obj.results
  if (res.length === 0) { obj.currentStreak = 0; obj.streakType = null; return }
  const last = res[res.length - 1]
  let count = 0
  for (let i = res.length - 1; i >= 0; i--) {
    if (res[i] === last) count++
    else break
  }
  obj.currentStreak = count
  obj.streakType = last
}

export function computeStats(matches: MatchView[]): StatsResult {
  const playerStats: Record<string, PlayerStat> = {}
  const pairStats: Record<string, PairStat> = {}
  const h2h: Record<string, H2HRecord> = {}

  function ensurePlayer(n: string): PlayerStat {
    if (!playerStats[n]) playerStats[n] = { name: n, wins: 0, losses: 0, results: [], currentStreak: 0, streakType: null }
    return playerStats[n]
  }
  function ensurePair(names: string[]): PairStat {
    const key = nameKey(names)
    if (!pairStats[key]) pairStats[key] = { names: [...names], wins: 0, losses: 0, results: [], currentStreak: 0, streakType: null }
    return pairStats[key]
  }
  function ensureH2H(p1: string, p2: string): H2HRecord {
    const key = [p1, p2].sort().join('___')
    if (!h2h[key]) h2h[key] = { players: [p1, p2].sort() as [string, string], wins: { [p1]: 0, [p2]: 0 } }
    return h2h[key]
  }

  matches.forEach(m => {
    if (m.winner_side === null) return
    const winners = m.winner_side === 0 ? m.sideA : m.sideB
    const losers  = m.winner_side === 0 ? m.sideB : m.sideA

    winners.forEach(n => { const ps = ensurePlayer(n); ps.wins++;   ps.results.push('W') })
    losers.forEach(n  => { const ps = ensurePlayer(n); ps.losses++; ps.results.push('L') })

    if (m.match_type === 'doubles') {
      const wPair = ensurePair(winners); wPair.wins++;   wPair.results.push('W')
      const lPair = ensurePair(losers);  lPair.losses++; lPair.results.push('L')
    }

    winners.forEach(w => {
      losers.forEach(l => {
        const rec = ensureH2H(w, l)
        rec.wins[w] = (rec.wins[w] || 0) + 1
      })
    })
  })

  Object.values(playerStats).forEach(finalizeStreak)
  Object.values(pairStats).forEach(finalizeStreak)

  return { playerStats, pairStats, h2h }
}
