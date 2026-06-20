import Header from '@/components/layout/Header'
import MatchLedger from '@/components/history/MatchLedger'
import { getMatches, getPlayers } from '@/lib/db'

export default async function HistoryPage() {
  const [matches, players] = await Promise.all([getMatches(), getPlayers()])
  return (
    <>
      <Header />
      <MatchLedger matches={matches} players={players} />
    </>
  )
}
