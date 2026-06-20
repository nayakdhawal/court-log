'use client'

import { useState } from 'react'
import type { Player } from '@/types'

const SKILL_COLORS: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: '#EAF3DE', text: '#3B6D11' },
  Intermediate: { bg: '#FAEEDA', text: '#854F0B' },
  Advanced:     { bg: '#FBEAEA', text: '#9A332A' },
}

function SkillDot({ skill }: { skill: string | null }) {
  if (!skill) return null
  const c = SKILL_COLORS[skill] || { bg: '#E4DFD0', text: '#8a8576' }
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: c.text, marginRight: 6, flexShrink: 0,
    }} />
  )
}

interface PlayerPickerProps {
  players: Player[]
  selected: string[]
  onChange: (names: string[]) => void
  excludeNames?: string[]
  placeholder?: string
  maxCount?: number | null
  onAddNew?: (name: string) => void
}

export default function PlayerPicker({
  players,
  selected,
  onChange,
  excludeNames = [],
  placeholder = 'Add player',
  maxCount = null,
  onAddNew,
}: PlayerPickerProps) {
  const [text, setText] = useState('')
  const available = players.filter(p => !excludeNames.includes(p.name))
  const atCapacity = maxCount !== null && selected.length >= maxCount

  function toggle(name: string) {
    if (selected.includes(name)) {
      onChange(selected.filter(n => n !== name))
      return
    }
    if (atCapacity) return
    onChange([...selected, name])
  }

  function submitNew(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    if (selected.includes(t)) { setText(''); return }
    if (atCapacity) return
    onAddNew?.(t)
    onChange([...selected, t])
    setText('')
  }

  return (
    <div>
      <div className="chip-row" style={{ marginBottom: 8 }}>
        {available.map(p => {
          const isSelected = selected.includes(p.name)
          const disabled = !isSelected && atCapacity
          return (
            <div
              key={p.name}
              className={`chip ${isSelected ? 'selected' : ''}`}
              style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              onClick={() => { if (!disabled) toggle(p.name) }}
            >
              <SkillDot skill={p.skill_level} />
              {p.name}
            </div>
          )
        })}
      </div>
      <form onSubmit={submitNew} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={atCapacity ? 'Side is full' : placeholder}
          disabled={atCapacity}
        />
        <button type="submit" className="btn btn-ghost btn-sm" disabled={atCapacity}>Add</button>
      </form>
      {maxCount !== null && (
        <div style={{ fontSize: 11, color: '#9a9485', marginTop: 6 }}>
          {selected.length} / {maxCount} added{atCapacity ? ' — remove someone to swap' : ''}
        </div>
      )}
    </div>
  )
}
