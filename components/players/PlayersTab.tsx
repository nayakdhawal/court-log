'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addPlayer, updatePlayer, archivePlayer } from '@/lib/actions'
import type { Player, MatchView } from '@/types'

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const
const SKILL_COLORS: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: '#EAF3DE', text: '#3B6D11' },
  Intermediate: { bg: '#FAEEDA', text: '#854F0B' },
  Advanced:     { bg: '#FBEAEA', text: '#9A332A' },
}

interface Props {
  players: Player[]
  matches: MatchView[]
}

export default function PlayersTab({ players, matches }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmArchive, setConfirmArchive] = useState<Player | null>(null)

  const sorted = useMemo(() => [...players].sort((a, b) => a.name.localeCompare(b.name)), [players])
  const existingNames = players.map(p => p.name)

  function playerHasMatches(name: string) {
    return matches.some(m => m.sideA.includes(name) || m.sideB.includes(name))
  }

  async function handleArchive(p: Player) {
    await archivePlayer(p.id)
    setConfirmArchive(null)
    router.refresh()
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Add a player</div>
        <div className="hint">Add everyone in your regular group — they'll show up for selection when logging or scoring a match.</div>
        <PlayerForm
          onSubmit={async ({ name, age, skill }) => {
            await addPlayer(name, age, skill)
            router.refresh()
          }}
          existingNames={existingNames}
        />
      </div>

      <div className="panel">
        <div className="panel-title">Roster ({players.length})</div>
        {sorted.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-users" />
            No players added yet.
          </div>
        ) : (
          sorted.map(p => {
            if (editingId === p.id) {
              return (
                <div key={p.id} style={{ padding: '12px 4px', borderBottom: '1px solid var(--line)' }}>
                  <PlayerForm
                    initial={p}
                    onSubmit={async ({ name, age, skill }) => {
                      await updatePlayer(p.id, p.name, name, age, skill)
                      setEditingId(null)
                      router.refresh()
                    }}
                    onCancel={() => setEditingId(null)}
                    existingNames={existingNames.filter(n => n !== p.name)}
                  />
                </div>
              )
            }
            const c = p.skill_level ? SKILL_COLORS[p.skill_level] : null
            return (
              <div className="ledger-row" key={p.id} style={{ gridTemplateColumns: '1fr 70px 110px 70px' }}>
                <div className="ledger-names"><div className="winner">{p.name}</div></div>
                <div style={{ color: '#8a8576', fontSize: 13 }}>{p.age != null ? `${p.age} yrs` : '—'}</div>
                <div>
                  {p.skill_level
                    ? <span className="pill" style={{ background: c ? c.bg : 'var(--chalk-dim)', color: c ? c.text : '#8a8576' }}>{p.skill_level}</span>
                    : <span style={{ color: '#9a9485', fontSize: 12 }}>—</span>
                  }
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button className="btn btn-icon" onClick={() => setEditingId(p.id)} title="Edit" style={{ color: '#2A6B3D', fontSize: 20 }}>
                    <i className="ti ti-edit" />
                  </button>
                  <button className="btn btn-icon" onClick={() => playerHasMatches(p.name) ? setConfirmArchive(p) : handleArchive(p)} title="Delete" style={{ color: '#C44536', fontSize: 20 }}>
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {confirmArchive && (
        <div className="panel" style={{ border: '1px solid var(--clay)' }}>
          <div className="hint" style={{ marginBottom: 14 }}>
            <i className="ti ti-alert-triangle" style={{ marginRight: 4 }} />
            {confirmArchive.name} has match history logged. Removing them won&apos;t delete past matches, but they won&apos;t be selectable for new ones unless re-added.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-danger" onClick={() => handleArchive(confirmArchive)}>
              <i className="ti ti-trash" style={{ fontSize: 14, marginRight: 5, verticalAlign: '-2px' }} />Remove anyway
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirmArchive(null)}>
              <i className="ti ti-x" style={{ fontSize: 14, marginRight: 5, verticalAlign: '-2px' }} />Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface PlayerFormProps {
  initial?: Player
  onSubmit: (data: { name: string; age: number | null; skill: string | null }) => Promise<void>
  onCancel?: () => void
  existingNames: string[]
}

function PlayerForm({ initial, onSubmit, onCancel, existingNames }: PlayerFormProps) {
  const [name, setName]   = useState(initial?.name || '')
  const [age, setAge]     = useState(initial?.age != null ? String(initial.age) : '')
  const [skill, setSkill] = useState(initial?.skill_level || '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const trimmed = name.trim()
    if (!trimmed) { setError('Name is required.'); return }
    const isRename = initial && initial.name !== trimmed
    if (existingNames.includes(trimmed) && (isRename || !initial)) {
      setError('A player with that name already exists.')
      return
    }
    const parsedAge = age.trim() === '' ? null : parseInt(age, 10)
    if (parsedAge !== null && (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120)) {
      setError('Enter a valid age.')
      return
    }
    startTransition(async () => {
      try {
        await onSubmit({ name: trimmed, age: parsedAge, skill: skill || null })
        if (!initial) { setName(''); setAge(''); setSkill('') }
      } catch (e) {
        setError(String(e))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="field">
          <label>Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Player name" />
        </div>
        <div className="field">
          <label>Age</label>
          <input type="text" inputMode="numeric" value={age} onChange={e => setAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))} placeholder="Optional" />
        </div>
        <div className="field">
          <label>Skill level</label>
          <select value={skill} onChange={e => setSkill(e.target.value)}>
            <option value="">Not set</option>
            {SKILL_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {error && <div style={{ color: 'var(--clay-dark)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Saving…' : initial ? 'Save changes' : 'Add player'}
        </button>
        {initial && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            <i className="ti ti-x" style={{ fontSize: 14, marginRight: 5, verticalAlign: '-2px' }} />Cancel
          </button>
        )}
      </div>
    </form>
  )
}
