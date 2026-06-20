import Header from '@/components/layout/Header'
import LogMatch from '@/components/log/LogMatch'
import { getPlayers } from '@/lib/db'

export default async function LogPage() {
  const players = await getPlayers()
  return (
    <>
      <Header />
      <LogMatch players={players} />
    </>
  )
}
