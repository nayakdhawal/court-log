import { cookies } from 'next/headers'
import Header from '@/components/layout/Header'
import LogMatch from '@/components/log/LogMatch'
import { getPlayers } from '@/lib/db'

export default async function LogPage() {
  const cookieStore = await cookies()
  const cookieList = cookieStore.getAll().map(c => ({ name: c.name, value: c.value }))
  const players = await getPlayers(cookieList)

  return (
    <>
      <Header />
      <LogMatch players={players} />
    </>
  )
}
