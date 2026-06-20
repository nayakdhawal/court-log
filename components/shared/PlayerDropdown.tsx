'use client'

import { useState, useRef, useEffect } from 'react'
import type { Player } from '@/types'

interface Props {
  players: Player[]
  selected: string[]
  onChange: (names: string[]) => void
  excludeNames?: string[]
  maxCount: 1 | 2
  sideLabel: string
}

export default function PlayerDropdown({ players, selected, onChange, excludeNames = [], maxCount, sideLabel }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const available = players.filter(p => !excludeNames.includes(p.name))

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(name: string) {
    if (selected.includes(name)) {
      onChange(selected.filter(n => n !== name))
    } else if (selected.length < maxCount) {
      onChange([...selected, name])
    }
  }

  const triggerLabel = selected.length === 0
    ? `Select player${maxCount > 1 ? 's' : ''}…`
    : selected.join(' & ')

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ marginBottom: 4 }}>{sideLabel}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '9px 11px', border: '1px solid var(--line)',
          borderRadius: 8, background: 'var(--chalk)', color: selected.length ? 'var(--ink)' : '#9a9485',
          fontFamily: 'Inter, sans-serif', fontSize: 14, textAlign: 'left',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'border-color .15s',
          ...(open ? { borderColor: 'var(--clay)', outline: 'none' } : {}),
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {triggerLabel}
        </span>
        <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 14, flexShrink: 0, marginLeft: 6, color: '#8a8576' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: '#fff', border: '1px solid var(--line)', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)', overflow: 'hidden',
        }}>
          {available.length === 0 ? (
            <div style={{ padding: '12px 14px', color: '#9a9485', fontSize: 13 }}>No players available</div>
          ) : available.map(p => {
            const isSelected = selected.includes(p.name)
            const isDisabled = !isSelected && selected.length >= maxCount
            return (
              <div
                key={p.id}
                onClick={() => { if (!isDisabled) toggle(p.name) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.4 : 1,
                  background: isSelected ? 'rgba(28,61,46,0.06)' : 'transparent',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => { if (!isDisabled) (e.currentTarget as HTMLDivElement).style.background = isSelected ? 'rgba(28,61,46,0.1)' : 'var(--chalk)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSelected ? 'rgba(28,61,46,0.06)' : 'transparent' }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: isSelected ? '2px solid var(--court)' : '1.5px solid var(--line)',
                  background: isSelected ? 'var(--court)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && <i className="ti ti-check" style={{ fontSize: 11, color: '#fff' }} />}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</span>
                {p.skill_level && (
                  <span style={{ fontSize: 11, color: '#9a9485', marginLeft: 'auto' }}>{p.skill_level}</span>
                )}
              </div>
            )
          })}
          {maxCount > 1 && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--line)', fontSize: 11, color: '#9a9485' }}>
              {selected.length}/{maxCount} selected
            </div>
          )}
        </div>
      )}
    </div>
  )
}
