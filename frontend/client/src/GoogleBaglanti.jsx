import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function GoogleBaglanti() {
  const [durum, setDurum] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [mesaj, setMesaj] = useState(null)
  const token = sessionStorage.getItem('musteriToken')

  const durumGetir = async () => {
    const res = await fetch(`${API_URL}/musteri/google/status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      setDurum(await res.json())
    } else if (res.status === 401) {
      sessionStorage.removeItem('musteriToken')
      sessionStorage.removeItem('musteriBilgi')
      window.location.reload()
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sonuc = params.get('google')
    if (sonuc === 'connected') setMesaj({ tip: 'basarili', metin: 'Google İşletme Profiliniz başarıyla bağlandı.' })
    else if (sonuc === 'error') setMesaj({ tip: 'hata', metin: 'Google bağlantısı kurulamadı, lütfen tekrar deneyin.' })
    if (sonuc) window.history.replaceState({}, '', window.location.pathname)

    durumGetir()
  }, [])

  const baglan = async () => {
    setYukleniyor(true)
    try {
      const res = await fetch(`${API_URL}/musteri/google/connect`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) window.location.href = data.auth_url
    } finally {
      setYukleniyor(false)
    }
  }

  const baglantiyiKaldir = async () => {
    setYukleniyor(true)
    try {
      await fetch(`${API_URL}/musteri/google/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      await durumGetir()
    } finally {
      setYukleniyor(false)
    }
  }

  if (!durum) return null

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 24px', marginBottom: 20,
      border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)'
    }}>
      {mesaj && (
        <div style={{
          marginBottom: 14, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: mesaj.tip === 'basarili' ? '#F0FDF4' : '#FEF2F2',
          color: mesaj.tip === 'basarili' ? '#16A34A' : '#DC2626'
        }}>{mesaj.metin}</div>
      )}

      {durum.connected ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#16A34A' }}>✓ Google Bağlı</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              {durum.account_name || durum.email}
            </div>
          </div>
          <button onClick={baglantiyiKaldir} disabled={yukleniyor} style={{
            fontSize: 13, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 8, padding: '8px 14px', cursor: yukleniyor ? 'default' : 'pointer', opacity: yukleniyor ? 0.7 : 1
          }}>Bağlantıyı Kaldır</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Google İşletme Profilinizi Bağlayın</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Profilinizi bağlayarak otomatik güncellemelerden yararlanın.
            </div>
          </div>
          <button onClick={baglan} disabled={yukleniyor} style={{
            fontSize: 13, fontWeight: 700, color: '#fff', background: '#3B5BDB', border: 'none',
            borderRadius: 8, padding: '9px 16px', cursor: yukleniyor ? 'default' : 'pointer', opacity: yukleniyor ? 0.7 : 1,
            whiteSpace: 'nowrap'
          }}>Google ile Bağlan</button>
        </div>
      )}
    </div>
  )
}
