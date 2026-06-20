import Header from '@/components/layout/Header'
import StatsView from '@/components/stats/StatsView'
import { getMatches, getPlayers } from '@/lib/db'

export default async function StatsPage() {
  const [matches, players] = await Promise.all([getMatches(), getPlayers()])
  return (
    <>
      <Header />
      <StatsView matches={matches} players={players} />
    </>
  )
}
