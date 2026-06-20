import Header from '@/components/layout/Header'
import PlayersTab from '@/components/players/PlayersTab'
import { getPlayers, getMatches } from '@/lib/db'

export default async function PlayersPage() {
  const [players, matches] = await Promise.all([getPlayers(), getMatches()])
  return (
    <>
      <Header />
      <PlayersTab players={players} matches={matches} />
    </>
  )
}
