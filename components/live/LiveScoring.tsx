'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PlayerPicker from '@/components/shared/PlayerPicker'
import { addMatch } from '@/lib/actions'
import {
  newLiveMatch, addPoint, undoPoint, isMatchWon, countSetsWon,
  projectWinner, pointLabel, setsDisplayString,
} from '@/lib/scoring'
import type { Player, LiveMatchState } from '@/types'

const STORAGE_KEY = 'courtlog:live'

interface Props {
  players: Player[]
}

export default function LiveScoring({ players }: Props) {
  const router = useRouter()
  const [liveMatch, setLiveMatch] = useState<LiveMatchState | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Restore live match from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setLiveMatch(JSON.parse(raw))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (!hydrated) return
    if (liveMatch) localStorage.setItem(STORAGE_KEY, JSON.stringify(liveMatch))
    else localStorage.removeItem(STORAGE_KEY)
  }, [liveMatch, hydrated])

  const [type, setType] = useState<'singles' | 'doubles'>('singles')
  const [sideA, setSideA] = useState<string[]>([])
  const [sideB, setSideB] = useState<string[]>([])
  const [bestOf3, setBestOf3] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const maxPerSide = type === 'singles' ? 1 : 2

  function startMatch() {
    setError('')
    if (sideA.length !== maxPerSide || sideB.length !== maxPerSide) {
      setError(`Each side needs exactly ${maxPerSide} player${maxPerSide > 1 ? 's' : ''}.`)
      return
    }
    if (sideA.some(n => sideB.includes(n))) { setError("A player can't be on both sides."); return }
    setLiveMatch(newLiveMatch(sideA, sideB, type, bestOf3))
  }

  const update = useCallback((fn: (s: LiveMatchState) => void) => {
    setLiveMatch(prev => {
      if (!prev) return prev
      const next: LiveMatchState = JSON.parse(JSON.stringify(prev))
      next.history = prev.history
      fn(next)
      return next
    })
  }, [])

  function handlePoint(i: 0 | 1) { update(s => addPoint(s, i)) }
  function handleUndo() { update(s => undoPoint(s)) }

  async function finishAndSave() {
    if (!liveMatch) return
    setError('')
    const m = liveMatch
    const completedSets = [...m.sets]
    let isCompleted = true
    let isProjected = false
    let winnerSide = isMatchWon(m)

    if (winnerSide === null) {
      isCompleted = false
      if (m.currentSetGames[0] > 0 || m.currentSetGames[1] > 0) {
        completedSets.push([...m.currentSetGames] as [number, number])
      }
      const [setsA, setsB] = countSetsWon(m.sets)
      const gamesA = m.sets.reduce((s, [a]) => s + a, 0)
      const gamesB = m.sets.reduce((s, [, b]) => s + b, 0)
      const proj = projectWinner(setsA, setsB, gamesA, gamesB, m.currentSetGames[0], m.currentSetGames[1])
      if (proj === null) {
        setError("Score is dead even — can't project a winner yet.")
        return
      }
      winnerSide = proj
      isProjected = true
    }

    setSaving(true)
    try {
      await addMatch({
        playedOn: m.startedAt.slice(0, 10),
        matchType: m.type,
        bestOf: m.bestOf3 ? 3 : 1,
        sideANames: m.sideA,
        sideBNames: m.sideB,
        setScores: completedSets,
        isCompleted,
        isProjected,
        winnerSide: winnerSide as 0 | 1,
      })
      setLiveMatch(null)
      router.push('/history')
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  if (!hydrated) return null

  if (!liveMatch) {
    return (
      <div className="panel">
        <div className="panel-title">Start a live match</div>
        <div className="hint">Score it point by point as you play.</div>

        <div className="row">
          <div className="field">
            <label>Match type</label>
            <div className="toggle-group">
              <div className={`toggle-opt ${type === 'singles' ? 'active' : ''}`} onClick={() => { setType('singles'); setSideA([]); setSideB([]) }}>Singles</div>
              <div className={`toggle-opt ${type === 'doubles' ? 'active' : ''}`} onClick={() => { setType('doubles'); setSideA([]); setSideB([]) }}>Doubles</div>
            </div>
          </div>
          <div className="field">
            <label>Format</label>
            <div className="toggle-group">
              <div className={`toggle-opt ${bestOf3 ? 'active' : ''}`} onClick={() => setBestOf3(true)}>Best of 3 sets</div>
              <div className={`toggle-opt ${!bestOf3 ? 'active' : ''}`} onClick={() => setBestOf3(false)}>Single set</div>
            </div>
          </div>
        </div>

        <div className="section-flex">
          <div>
            <label>Side A {type === 'doubles' ? '(team)' : ''}</label>
            <PlayerPicker players={players} selected={sideA} onChange={setSideA} excludeNames={sideB} placeholder="Add player to side A" maxCount={maxPerSide} />
          </div>
          <div>
            <label>Side B {type === 'doubles' ? '(team)' : ''}</label>
            <PlayerPicker players={players} selected={sideB} onChange={setSideB} excludeNames={sideA} placeholder="Add player to side B" maxCount={maxPerSide} />
          </div>
        </div>

        {error && <div style={{ color: 'var(--clay-dark)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{error}</div>}
        <button className="btn btn-primary" onClick={startMatch}>Start match</button>
      </div>
    )
  }

  const m = liveMatch
  const nameA = m.sideA.join(' / ')
  const nameB = m.sideB.join(' / ')
  const winner = isMatchWon(m)
  const inTiebreak = !!m.tiebreak

  return (
    <div className="panel">
      <div className="panel-title">
        <span>Live match</span>
        <span className="pill pill-live">
          <i className="ti ti-circle-filled" style={{ fontSize: 8 }} /> in progress
        </span>
      </div>

      <div className="scoreboard">
        <div className="sb-header-row">
          <div className="sb-name" />
          {m.sets.map((_, i) => <div key={i} className="sb-set">S{i + 1}</div>)}
          <div className="sb-set current">S{m.sets.length + 1}</div>
          <div className="sb-points">PTS</div>
        </div>
        {([0, 1] as const).map(i => (
          <div className="sb-row" key={i}>
            <div className="sb-name">
              {m.server === i && !winner && <span className="serve-dot" />}
              <span>{i === 0 ? nameA : nameB}</span>
            </div>
            {m.sets.map((set, si) => <div key={si} className="sb-set">{set[i]}</div>)}
            <div className="sb-set current">{m.currentSetGames[i]}</div>
            <div className="sb-points">
              {winner !== null ? '—' : inTiebreak ? m.tiebreak!.points[i] : pointLabel(m.currentGamePoints, i)}
            </div>
          </div>
        ))}
      </div>

      {winner === null ? (
        <>
          <div className="point-pad">
            <div className="point-btn" onClick={() => handlePoint(0)}>
              <span className="ppt-label">Point for</span>
              <span className="ppt-name">{nameA}</span>
            </div>
            <div className="point-btn" onClick={() => handlePoint(1)}>
              <span className="ppt-label">Point for</span>
              <span className="ppt-name">{nameB}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'space-between' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleUndo} disabled={!m.history || m.history.length === 0}>
              <i className="ti ti-arrow-back-up" style={{ marginRight: 4, fontSize: 14, verticalAlign: '-2px' }} />Undo point
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger btn-sm" onClick={finishAndSave} disabled={saving}>End match now</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setLiveMatch(null)}>
                <i className="ti ti-trash" style={{ fontSize: 13, marginRight: 4, verticalAlign: '-2px' }} />Discard
              </button>
            </div>
          </div>
          {error && <div style={{ color: 'var(--clay-dark)', fontSize: 13, marginTop: 10, fontWeight: 600 }}>{error}</div>}
        </>
      ) : (
        <div>
          <div className="proj-banner" style={{ background: '#E8F3EA', borderColor: '#BFE0C8', color: '#2A6B3D' }}>
            <i className="ti ti-trophy" />
            <span>{winner === 0 ? nameA : nameB} wins the match {setsDisplayString(m.sets)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={finishAndSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save to history'}
            </button>
            <button className="btn btn-ghost" onClick={() => setLiveMatch(null)}>
              <i className="ti ti-trash" style={{ fontSize: 14, marginRight: 5, verticalAlign: '-2px' }} />Discard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
