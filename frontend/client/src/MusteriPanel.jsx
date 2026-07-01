import { useState } from 'react'
import MusteriGiris from './MusteriGiris'
import Dashboard from './Dashboard'

export default function MusteriPanel() {
  const [musteri, setMusteri] = useState(() => {
    const kayitli = sessionStorage.getItem('musteriBilgi')
    return kayitli ? JSON.parse(kayitli) : null
  })

  if (!musteri) {
    return <MusteriGiris onSuccess={setMusteri} />
  }

  const cikisYap = () => {
    sessionStorage.removeItem('musteriToken')
    sessionStorage.removeItem('musteriBilgi')
    setMusteri(null)
  }

  return <Dashboard musteri={musteri} onCikis={cikisYap} />
}
