'use client'

import { useMemo } from 'react'
import { computeStats } from '@/lib/stats'
import type { MatchView, Player } from '@/types'

interface Props {
  matches: MatchView[]
  players: Player[]
}

export default function StatsView({ matches, players }: Props) {
  const chronological = useMemo(
    () => [...matches].sort((a, b) => a.played_on.localeCompare(b.played_on)),
    [matches],
  )
  const { playerStats, pairStats, h2h } = useMemo(() => computeStats(chronological), [chronological])

  const playerList = Object.values(playerStats).sort((a, b) => (b.wins - b.losses) - (a.wins - a.losses))
  const pairList   = Object.values(pairStats).sort((a, b) => (b.wins - b.losses) - (a.wins - a.losses))
  const h2hPairs   = Object.values(h2h)

  if (matches.length === 0) {
    return (
      <div className="panel">
        <div className="empty-state">
          <i className="ti ti-chart-bar" />
          No stats yet — log a match first.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Player leaderboard</div>
        {playerList.length === 0
          ? <div className="hint">No completed matches yet.</div>
          : playerList.map(p => (
            <div key={p.name} className="ledger-row" style={{ gridTemplateColumns: '1fr 70px 90px 90px' }}>
              <div className="ledger-names"><div className="winner">{p.name}</div></div>
              <div className="ledger-score mono">{p.wins}-{p.losses}</div>
              <div style={{ textAlign: 'center' }}>
                {p.currentStreak > 0 && (
                  <span className={`pill ${p.streakType === 'W' ? 'pill-streak-w' : 'pill-streak-l'}`}>
                    {p.currentStreak}{p.streakType}
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right', color: '#8a8576', fontSize: 12 }}>
                {p.wins + p.losses > 0 ? `${Math.round(p.wins / (p.wins + p.losses) * 100)}% win` : '—'}
              </div>
            </div>
          ))
        }
      </div>

      <div className="panel">
        <div className="panel-title">Doubles pairings</div>
        {pairList.length === 0
          ? <div className="hint">No doubles matches logged yet.</div>
          : pairList.map(p => (
            <div key={p.names.join('&')} className="ledger-row" style={{ gridTemplateColumns: '1fr 70px 90px 90px' }}>
              <div className="ledger-names"><div className="winner">{p.names.join(' & ')}</div></div>
              <div className="ledger-score mono">{p.wins}-{p.losses}</div>
              <div style={{ textAlign: 'center' }}>
                {p.currentStreak > 0 && (
                  <span className={`pill ${p.streakType === 'W' ? 'pill-streak-w' : 'pill-streak-l'}`}>
                    {p.currentStreak}{p.streakType}
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right', color: '#8a8576', fontSize: 12 }}>
                {p.wins + p.losses > 0 ? `${Math.round(p.wins / (p.wins + p.losses) * 100)}% win` : '—'}
              </div>
            </div>
          ))
        }
      </div>

      <div className="panel">
        <div className="panel-title">Head to head</div>
        {h2hPairs.length === 0
          ? <div className="hint">Need at least one match between two players.</div>
          : (
            <table className="h2h-table">
              <thead>
                <tr><th>Matchup</th><th>Record</th><th></th></tr>
              </thead>
              <tbody>
                {h2hPairs.map(rec => {
                  const [p1, p2] = rec.players
                  const w1 = rec.wins[p1] || 0
                  const w2 = rec.wins[p2] || 0
                  const total = w1 + w2
                  const pct1 = total > 0 ? (w1 / total * 100) : 50
                  return (
                    <tr key={p1 + p2}>
                      <td className="h2h-name">{p1} vs {p2}</td>
                      <td className="mono">{w1}-{w2}</td>
                      <td>
                        <span className="h2h-bar-wrap">
                          <span className="h2h-bar" style={{ width: `${pct1}%` }} />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        }
      </div>

      <div className="panel">
        <div className="panel-title">Quick totals</div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Matches logged</div>
            <div className="value">{matches.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Players</div>
            <div className="value">{players.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Projected results</div>
            <div className="value">{matches.filter(m => !m.is_completed).length}</div>
            <div className="sub">from incomplete matches</div>
          </div>
          <div className="stat-card">
            <div className="label">Doubles played</div>
            <div className="value">{matches.filter(m => m.match_type === 'doubles').length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
