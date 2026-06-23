import { cookies } from 'next/headers'
import Header from '@/components/layout/Header'
import MatchLedger from '@/components/history/MatchLedger'
import { getMatches, getPlayers } from '@/lib/db'

export default async function HistoryPage() {
  const cookieStore = await cookies()
  const cookieList = cookieStore.getAll().map(c => ({ name: c.name, value: c.value }))
  const [matches, players] = await Promise.all([
    getMatches(cookieList),
    getPlayers(cookieList),
  ])

  return (
    <>
      <Header />
      <MatchLedger matches={matches} players={players} />
    </>
  )
}
