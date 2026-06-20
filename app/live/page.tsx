import Header from '@/components/layout/Header'
import LiveScoring from '@/components/live/LiveScoring'
import { getPlayers } from '@/lib/db'

export default async function LivePage() {
  const players = await getPlayers()
  return (
    <>
      <Header />
      <LiveScoring players={players} />
    </>
  )
}
