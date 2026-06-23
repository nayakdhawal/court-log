import { cookies } from 'next/headers'
import Header from '@/components/layout/Header'
import LiveScoring from '@/components/live/LiveScoring'
import { getPlayers } from '@/lib/db'

export default async function LivePage() {
  const cookieStore = await cookies()
  const cookieList = cookieStore.getAll().map(c => ({ name: c.name, value: c.value }))
  const players = await getPlayers(cookieList)

  return (
    <>
      <Header />
      <LiveScoring players={players} />
    </>
  )
}
