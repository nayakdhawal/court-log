import type { LiveMatchState, LiveMatchSnapshot } from '@/types'

export const POINT_LABELS = ['0', '15', '30', '40']

export function newLiveMatch(
  sideA: string[],
  sideB: string[],
  type: 'singles' | 'doubles',
  bestOf3: boolean,
): LiveMatchState {
  return {
    type,
    sideA,
    sideB,
    bestOf3,
    sets: [],
    currentSetGames: [0, 0],
    currentGamePoints: [0, 0],
    tiebreak: null,
    server: 0,
    history: [],
    startedAt: new Date().toISOString(),
  }
}

function cloneState(s: LiveMatchState): LiveMatchSnapshot {
  const { history: _h, ...rest } = JSON.parse(JSON.stringify(s))
  return rest
}

function pushHistory(state: LiveMatchState) {
  state.history.push(cloneState(state))
  if (state.history.length > 50) state.history.shift()
}

function isGameWon(points: [number, number]): 0 | 1 | null {
  const [a, b] = points
  if (a >= 4 && a - b >= 2) return 0
  if (b >= 4 && b - a >= 2) return 1
  return null
}

function isTiebreakWon(points: [number, number], target = 7): 0 | 1 | null {
  const [a, b] = points
  if (a >= target && a - b >= 2) return 0
  if (b >= target && b - a >= 2) return 1
  return null
}

export function isSetWon(
  games: [number, number],
  tb: { points: [number, number] } | null,
): 0 | 1 | null {
  const [a, b] = games
  if (tb) {
    const w = isTiebreakWon(tb.points)
    if (w === 0) return 0
    if (w === 1) return 1
    return null
  }
  if (a >= 6 && a - b >= 2) return 0
  if (b >= 6 && b - a >= 2) return 1
  if (a === 7 && b === 6) return 0
  if (b === 7 && a === 6) return 1
  return null
}

export function countSetsWon(sets: [number, number][]): [number, number] {
  let a = 0, b = 0
  sets.forEach(([sa, sb]) => { if (sa > sb) a++; else b++ })
  return [a, b]
}

export function isMatchWon(state: LiveMatchState): 0 | 1 | null {
  const need = state.bestOf3 ? 2 : 1
  const [a, b] = countSetsWon(state.sets)
  if (a >= need) return 0
  if (b >= need) return 1
  return null
}

export function addPoint(state: LiveMatchState, i: 0 | 1): void {
  pushHistory(state)
  const opp = (1 - i) as 0 | 1

  if (state.tiebreak) {
    state.tiebreak.points[i]++
    const tbWinner = isTiebreakWon(state.tiebreak.points)
    if (tbWinner !== null) {
      state.currentSetGames[tbWinner]++
      state.sets.push([...state.currentSetGames] as [number, number])
      state.currentSetGames = [0, 0]
      state.tiebreak = null
      state.currentGamePoints = [0, 0]
    }
    return
  }

  state.currentGamePoints[i]++
  const gw = isGameWon(state.currentGamePoints)
  if (gw !== null) {
    state.currentSetGames[gw]++
    state.currentGamePoints = [0, 0]
    state.server = opp
    const [ga, gb] = state.currentSetGames
    if (ga === 6 && gb === 6) {
      state.tiebreak = { points: [0, 0] }
    } else {
      const sw = isSetWon(state.currentSetGames, null)
      if (sw !== null) {
        state.sets.push([...state.currentSetGames] as [number, number])
        state.currentSetGames = [0, 0]
      }
    }
  }
}

export function undoPoint(state: LiveMatchState): void {
  if (state.history.length === 0) return
  const prev = state.history.pop()!
  Object.assign(state, prev)
}

export function pointLabel(points: [number, number], idx: 0 | 1): string {
  const [a, b] = points
  if (a < 4 && b < 4) return POINT_LABELS[points[idx]]
  if (a === b) return '40'
  return points[idx] > points[(1 - idx) as 0 | 1] ? 'AD' : '40'
}

export function projectWinner(
  setsA: number,
  setsB: number,
  gamesA: number,
  gamesB: number,
  curGamesA: number,
  curGamesB: number,
): 0 | 1 | null {
  if (setsA !== setsB) return setsA > setsB ? 0 : 1
  const totalA = gamesA + curGamesA
  const totalB = gamesB + curGamesB
  if (totalA !== totalB) return totalA > totalB ? 0 : 1
  return null
}

export function setsDisplayString(setScores: [number, number][], retired = false): string {
  return setScores.map(([a, b]) => `${a}-${b}`).join(', ') + (retired ? ' (ret.)' : '')
}

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
