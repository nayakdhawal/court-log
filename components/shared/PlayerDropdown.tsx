'use client'

import type { Player } from '@/types'

interface Props {
  players: Player[]
  selected: string[]           // 1 or 2 selected names for this side
  onChange: (names: string[]) => void
  excludeNames?: string[]      // names locked to the other side
  maxCount: 1 | 2
  sideLabel: string            // "Side A" | "Side B"
}

export default function PlayerDropdown({ players, selected, onChange, excludeNames = [], maxCount, sideLabel }: Props) {
  const slots = Array.from({ length: maxCount }, (_, i) => i)

  function handleChange(slotIdx: number, value: string) {
    const next = [...selected]
    if (value === '') {
      next.splice(slotIdx, 1)
    } else {
      next[slotIdx] = value
    }
    // remove empty slots
    onChange(next.filter(Boolean))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {slots.map(i => {
        const currentVal = selected[i] || ''
        // exclude: other side + the other slot on this side
        const otherSlot = selected[1 - i] || ''
        const excluded = [...excludeNames, ...(otherSlot ? [otherSlot] : [])]
        const available = players.filter(p => !excluded.includes(p.name) || p.name === currentVal)

        return (
          <div key={i}>
            <label style={{ marginBottom: 4 }}>
              {sideLabel}{maxCount === 2 ? ` — Player ${i + 1}` : ''}
            </label>
            <select
              value={currentVal}
              onChange={e => handleChange(i, e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Select player…</option>
              {available.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}{p.skill_level ? ` (${p.skill_level})` : ''}
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}
