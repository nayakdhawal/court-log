'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import PlayerDropdown from '@/components/shared/PlayerDropdown'
import { addMatch } from '@/lib/actions'
import { countSetsWon, projectWinner } from '@/lib/scoring'
import type { Player } from '@/types'

interface Props {
  players: Player[]
}

export default function LogMatch({ players }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [type, setType] = useState<'singles' | 'doubles'>('singles')
  const [sideA, setSideA] = useState<string[]>([])
  const [sideB, setSideB] = useState<string[]>([])
  const [sets, setSets] = useState([{ a: '', b: '' }])
  const [matchComplete, setMatchComplete] = useState(true)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')

  const maxPerSide = type === 'singles' ? 1 : 2

  function reset() {
    setSideA([]); setSideB([]); setSets([{ a: '', b: '' }]); setMatchComplete(true); setError('')
  }

  function handleSubmit() {
    setError('')
    if (sideA.length !== maxPerSide || sideB.length !== maxPerSide) {
      setError(`Select ${maxPerSide} player${maxPerSide > 1 ? 's' : ''} for each side.`)
      return
    }
    if (sideA.some(n => sideB.includes(n))) {
      setError("A player can't be on both sides.")
      return
    }

    const parsedSets = sets
      .filter(s => s.a !== '' || s.b !== '')
      .map(s => [parseInt(s.a || '0', 10), parseInt(s.b || '0', 10)] as [number, number])

    if (parsedSets.length === 0) { setError('Enter at least one set score.'); return }

    const [setsA, setsB] = countSetsWon(parsedSets)
    let winnerSide: 0 | 1
    let projected = false

    if (matchComplete) {
      if (setsA === setsB) {
        setError("Sets are tied — uncheck 'match completed' or fix the score.")
        return
      }
      winnerSide = setsA > setsB ? 0 : 1
    } else {
      const gamesA = parsedSets.reduce((s, [a]) => s + a, 0)
      const gamesB = parsedSets.reduce((s, [, b]) => s + b, 0)
      const proj = projectWinner(setsA, setsB, gamesA, gamesB, 0, 0)
      if (proj === null) { setError("Score is perfectly even — can't project a winner."); return }
      winnerSide = proj
      projected = true
    }

    startTransition(async () => {
      try {
        await addMatch({
          playedOn: date,
          matchType: type,
          bestOf: 3,
          sideANames: sideA,
          sideBNames: sideB,
          setScores: parsedSets,
          isCompleted: matchComplete,
          isProjected: projected,
          winnerSide,
        })
        reset()
        router.push('/history')
      } catch (e) {
        setError(String(e))
      }
    })
  }

  return (
    <div className="panel">
      <div className="panel-title">Log a match</div>
      <div className="hint">Enter scores after the fact — for live scoring use the Live tab.</div>

      <div className="row">
        <div className="field">
          <label>Match type</label>
          <div className="toggle-group">
            <div className={`toggle-opt ${type === 'singles' ? 'active' : ''}`} onClick={() => { setType('singles'); setSideA([]); setSideB([]) }}>Singles</div>
            <div className={`toggle-opt ${type === 'doubles' ? 'active' : ''}`} onClick={() => { setType('doubles'); setSideA([]); setSideB([]) }}>Doubles</div>
          </div>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      <div className="player-grid">
        <PlayerDropdown
          players={players}
          selected={sideA}
          onChange={setSideA}
          excludeNames={sideB}
          maxCount={maxPerSide as 1 | 2}
          sideLabel="Side A"
        />
        <PlayerDropdown
          players={players}
          selected={sideB}
          onChange={setSideB}
          excludeNames={sideA}
          maxCount={maxPerSide as 1 | 2}
          sideLabel="Side B"
        />
      </div>

      <label style={{ marginTop: 4 }}>Set scores</label>
      {sets.map((s, i) => (
        <div key={i} className="set-score-row">
          <input type="text" inputMode="numeric" value={s.a} onChange={e => setSets(prev => prev.map((x, xi) => xi === i ? { ...x, a: e.target.value.replace(/[^0-9]/g, '').slice(0, 2) } : x))} placeholder="Side A" />
          <span className="set-dash">–</span>
          <input type="text" inputMode="numeric" value={s.b} onChange={e => setSets(prev => prev.map((x, xi) => xi === i ? { ...x, b: e.target.value.replace(/[^0-9]/g, '').slice(0, 2) } : x))} placeholder="Side B" />
          {sets.length > 1 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSets(prev => prev.filter((_, xi) => xi !== i))}>
              <i className="ti ti-trash" style={{ fontSize: 13 }} />
            </button>
          )}
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={() => setSets(prev => [...prev, { a: '', b: '' }])} style={{ marginBottom: 16 }}>
        + Add set
      </button>

      <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" id="complete-check" checked={matchComplete} onChange={e => setMatchComplete(e.target.checked)} style={{ width: 'auto' }} />
        <label htmlFor="complete-check" style={{ margin: 0, cursor: 'pointer' }}>Match was completed normally</label>
      </div>
      {!matchComplete && (
        <div className="hint" style={{ marginTop: -6 }}>
          <i className="ti ti-info-circle" style={{ marginRight: 4 }} />
          Winner will be projected from sets, then total games.
        </div>
      )}

      {error && <div style={{ color: 'var(--clay-dark)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{error}</div>}

      <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Saving…' : 'Save match'}
      </button>
    </div>
  )
}
