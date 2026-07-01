import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const TUR_ETIKET = {
  foto: '📷 Fotoğraf',
  website: '🌐 Web Sitesi',
  hizmet: '📋 Hizmet',
}

export default function MusteriTalepleri({ onKapat }) {
  const [talepler, setTalepler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')

  useEffect(() => {
    const getir = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/istekler`, {
          headers: { Authorization: sessionStorage.getItem('authHeader') || '' }
        })
        const data = await res.json()
        if (res.ok) setTalepler(data.requests || [])
        else setHata('Talepler alınamadı.')
      } catch {
        setHata('Sunucuya bağlanılamadı.')
      } finally {
        setYukleniyor(false)
      }
    }
    getir()
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16
    }}>
      <div style={{
        background: '#fff', padding: 24, borderRadius: 14, width: 480, maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: '#0F172A' }}>Müşteri Talepleri</h3>
          <button onClick={onKapat} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}>×</button>
        </div>

        {yukleniyor && <p style={{ fontSize: 13, color: '#64748B' }}>Yükleniyor...</p>}
        {hata && <p style={{ fontSize: 13, color: '#DC2626' }}>{hata}</p>}
        {!yukleniyor && !hata && talepler.length === 0 && (
          <p style={{ fontSize: 13, color: '#64748B' }}>Henüz bir talep yok.</p>
        )}

        {talepler.map(t => (
          <div key={t.id} style={{
            border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginBottom: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              <span>{t.business_name}</span>
              <span>{TUR_ETIKET[t.type] || t.type}</span>
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>{t.email} • {t.created_at}</div>

            {t.type === 'foto' ? (
              <img src={`${API_URL}/uploads/${t.value}`} alt="Müşteri fotoğrafı"
                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' }} />
            ) : (
              <div style={{ fontSize: 13, color: '#374151' }}>{t.value}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
