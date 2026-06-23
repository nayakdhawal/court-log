import { cookies } from 'next/headers'
import Header from '@/components/layout/Header'
import PlayersTab from '@/components/players/PlayersTab'
import { getPlayers, getMatches } from '@/lib/db'

export default async function PlayersPage() {
  const cookieStore = await cookies()
  const cookieList = cookieStore.getAll().map(c => ({ name: c.name, value: c.value }))
  const [players, matches] = await Promise.all([
    getPlayers(cookieList),
    getMatches(cookieList),
  ])

  return (
    <>
      <Header />
      <PlayersTab players={players} matches={matches} />
    </>
  )
}
