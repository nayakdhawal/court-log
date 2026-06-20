'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateMatch, deleteMatch } from '@/lib/actions'
import { fmtDate, setsDisplayString, countSetsWon, projectWinner } from '@/lib/scoring'
import PlayerPicker from '@/components/shared/PlayerPicker'
import type { MatchView, Player, MatchInput } from '@/types'

interface Props {
  matches: MatchView[]
  players: Player[]
}

export default function MatchLedger({ matches, players }: Props) {
  const sorted = useMemo(() => [...matches].sort((a, b) => b.played_on.localeCompare(a.played_on)), [matches])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<MatchView | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete(matchId: number) {
    startTransition(async () => {
      try {
        await deleteMatch(matchId)
        setConfirmDelete(null)
        router.refresh()
      } catch (err) {
        console.error(err)
      }
    })
  }

  if (sorted.length === 0) {
    return (
      <div className="panel">
        <div className="empty-state">
          <i className="ti ti-tournament" />
          No matches logged yet. Head to Log match or Live to get started.
        </div>
      </div>
    )
  }

  return (
    <div>
      {confirmDelete && (
        <div className="panel" style={{ border: '1px solid var(--clay)', marginBottom: 18 }}>
          <div className="hint" style={{ marginBottom: 14 }}>
            <i className="ti ti-alert-triangle" style={{ marginRight: 4 }} />
            Are you sure you want to permanently delete the match played on <strong>{fmtDate(confirmDelete.played_on)}</strong> between <strong>{confirmDelete.sideA.join(' / ')}</strong> and <strong>{confirmDelete.sideB.join(' / ')}</strong>? This action cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete.id)} disabled={isPending}>
              <i className="ti ti-trash" style={{ fontSize: 14, marginRight: 5, verticalAlign: '-2px' }} />
              {isPending ? 'Deleting…' : 'Delete permanently'}
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)} disabled={isPending}>
              <i className="ti ti-x" style={{ fontSize: 14, marginRight: 5, verticalAlign: '-2px' }} />Cancel
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-title">Match history</div>
        {sorted.map(m => {
          if (editingId === m.id) {
            return (
              <EditMatchRow
                key={m.id}
                match={m}
                players={players}
                onSave={async (input) => {
                  await updateMatch(m.id, input)
                  setEditingId(null)
                  router.refresh()
                }}
                onCancel={() => setEditingId(null)}
              />
            )
          }
          const winnerNames = m.winner_side === 0 ? m.sideA : m.sideB
          const loserNames  = m.winner_side === 0 ? m.sideB : m.sideA
          return (
            <div className="ledger-row" key={m.id}>
              <div className="date-col">{fmtDate(m.played_on)}</div>
              <div className="ledger-names">
                <div className="winner">{winnerNames.join(' / ')}</div>
                <div className="loser">{loserNames.join(' / ')}</div>
              </div>
              <div className="vs-col">{m.match_type === 'doubles' ? 'dbl' : 'sgl'}</div>
              <div className="ledger-score mono">{setsDisplayString(m.setScores)}</div>
              <div className="ledger-meta">
                {!m.is_completed && <span className="pill pill-live" title="Winner projected from incomplete score">proj.</span>}
                <button className="btn btn-icon edit" onClick={() => setEditingId(m.id)} title="Edit" style={{ fontSize: 20 }}>
                  <i className="ti ti-edit" />
                </button>
                <button className="btn btn-icon delete" onClick={() => setConfirmDelete(m)} title="Delete" style={{ fontSize: 20 }}>
                  <i className="ti ti-trash" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EditMatchRow({
  match, players, onSave, onCancel,
}: {
  match: MatchView
  players: Player[]
  onSave: (input: MatchInput) => Promise<void>
  onCancel: () => void
}) {
  const [type, setType] = useState(match.match_type)
  const [sideA, setSideA] = useState([...match.sideA])
  const [sideB, setSideB] = useState([...match.sideB])
  const [sets, setSets] = useState(match.setScores.map(([a, b]) => ({ a: String(a), b: String(b) })))
  const [matchComplete, setMatchComplete] = useState(match.is_completed)
  const [date, setDate] = useState(match.played_on)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const maxPerSide = type === 'singles' ? 1 : 2

  function handleSave() {
    setError('')
    if (sideA.length !== maxPerSide || sideB.length !== maxPerSide) {
      setError(`Each side needs exactly ${maxPerSide} player${maxPerSide > 1 ? 's' : ''}.`)
      return
    }
    if (sideA.some(n => sideB.includes(n))) { setError("A player can't be on both sides."); return }

    const parsedSets = sets
      .filter(s => s.a !== '' || s.b !== '')
      .map(s => [parseInt(s.a || '0', 10), parseInt(s.b || '0', 10)] as [number, number])

    if (parsedSets.length === 0) { setError('Enter at least one set score.'); return }

    const [setsA, setsB] = countSetsWon(parsedSets)
    let winnerSide: 0 | 1
    let projected = false

    if (matchComplete) {
      if (setsA === setsB) { setError("Sets are tied — mark incomplete or fix the score."); return }
      winnerSide = setsA > setsB ? 0 : 1
    } else {
      const gA = parsedSets.reduce((s, [a]) => s + a, 0)
      const gB = parsedSets.reduce((s, [, b]) => s + b, 0)
      const proj = projectWinner(setsA, setsB, gA, gB, 0, 0)
      if (proj === null) { setError("Score is perfectly even — can't project a winner."); return }
      winnerSide = proj
      projected = true
    }

    startTransition(async () => {
      try {
        await onSave({
          playedOn: date,
          matchType: type,
          bestOf: match.best_of,
          sideANames: sideA,
          sideBNames: sideB,
          setScores: parsedSets,
          isCompleted: matchComplete,
          isProjected: projected,
          winnerSide,
        })
      } catch (e) {
        setError(String(e))
      }
    })
  }

  return (
    <div className="panel" style={{ background: 'var(--chalk)', border: '1px solid var(--clay)', marginBottom: 8 }}>
      <div className="panel-title" style={{ fontSize: 15 }}>Edit match</div>

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

      <div className="section-flex">
        <div>
          <label>Side A</label>
          <PlayerPicker players={players} selected={sideA} onChange={setSideA} excludeNames={sideB} maxCount={maxPerSide} />
        </div>
        <div>
          <label>Side B</label>
          <PlayerPicker players={players} selected={sideB} onChange={setSideB} excludeNames={sideA} maxCount={maxPerSide} />
        </div>
      </div>

      <label>Set scores</label>
      {sets.map((s, i) => (
        <div key={i} className="row" style={{ marginBottom: 8, alignItems: 'center' }}>
          <div className="field" style={{ margin: 0 }}>
            <input type="text" inputMode="numeric" value={s.a} onChange={e => setSets(prev => prev.map((x, xi) => xi === i ? { ...x, a: e.target.value.replace(/[^0-9]/g, '').slice(0, 2) } : x))} placeholder="Side A" />
          </div>
          <span style={{ color: '#8a8576', fontWeight: 700 }}>–</span>
          <div className="field" style={{ margin: 0 }}>
            <input type="text" inputMode="numeric" value={s.b} onChange={e => setSets(prev => prev.map((x, xi) => xi === i ? { ...x, b: e.target.value.replace(/[^0-9]/g, '').slice(0, 2) } : x))} placeholder="Side B" />
          </div>
          {sets.length > 1 && <button className="btn btn-ghost btn-sm" onClick={() => setSets(prev => prev.filter((_, xi) => xi !== i))}>Remove</button>}
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={() => setSets(prev => [...prev, { a: '', b: '' }])} style={{ marginBottom: 16 }}>+ Add set</button>

      <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" id={`cc-${match.id}`} checked={matchComplete} onChange={e => setMatchComplete(e.target.checked)} style={{ width: 'auto' }} />
        <label htmlFor={`cc-${match.id}`} style={{ margin: 0, cursor: 'pointer' }}>Match was completed normally</label>
      </div>

      {error && <div style={{ color: 'var(--clay-dark)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={isPending}>{isPending ? 'Saving…' : 'Save changes'}</button>
        <button className="btn btn-ghost" onClick={onCancel}><i className="ti ti-x" style={{ fontSize: 14, marginRight: 5, verticalAlign: '-2px' }} />Cancel</button>
      </div>
    </div>
  )
}
