import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function MusteriListesi({ onKapat }) {
  const [musteriler, setMusteriler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [sifreAcikId, setSifreAcikId] = useState(null)
  const [yeniSifre, setYeniSifre] = useState('')
  const [mesaj, setMesaj] = useState('')

  const authHeader = () => ({ Authorization: sessionStorage.getItem('authHeader') || '' })

  const getir = async () => {
    setYukleniyor(true)
    try {
      const res = await fetch(`${API_URL}/admin/musteriler`, { headers: authHeader() })
      const data = await res.json()
      if (res.ok) setMusteriler(data.customers || [])
      else setHata('Müşteriler alınamadı.')
    } catch {
      setHata('Sunucuya bağlanılamadı.')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => { getir() }, [])

  const sil = async (musteri) => {
    if (!window.confirm(`${musteri.business_name} hesabını silmek istediğine emin misin?`)) return
    await fetch(`${API_URL}/admin/musteriler/${musteri.id}`, { method: 'DELETE', headers: authHeader() })
    setMusteriler(m => m.filter(x => x.id !== musteri.id))
  }

  const sifreKaydet = async (musteri) => {
    if (!yeniSifre) return
    await fetch(`${API_URL}/admin/musteriler/${musteri.id}/sifre-sifirla`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ new_password: yeniSifre })
    })
    setMesaj(`${musteri.business_name} için şifre güncellendi.`)
    setSifreAcikId(null)
    setYeniSifre('')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16
    }}>
      <div style={{
        background: '#fff', padding: 24, borderRadius: 14, width: 560, maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: '#0F172A' }}>Müşteriler</h3>
          <button onClick={onKapat} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}>×</button>
        </div>

        {mesaj && <p style={{ fontSize: 13, color: '#16A34A' }}>{mesaj}</p>}
        {yukleniyor && <p style={{ fontSize: 13, color: '#64748B' }}>Yükleniyor...</p>}
        {hata && <p style={{ fontSize: 13, color: '#DC2626' }}>{hata}</p>}
        {!yukleniyor && !hata && musteriler.length === 0 && (
          <p style={{ fontSize: 13, color: '#64748B' }}>Henüz müşteri eklenmemiş.</p>
        )}

        {musteriler.map(m => (
          <div key={m.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{m.business_name}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{m.email} {m.phone ? `• ${m.phone}` : ''}</div>
                {m.google_connected ? (
                  <div style={{ fontSize: 11, color: '#16A34A', marginTop: 4 }}>✓ Google Bağlı — {m.google_account_name || m.google_email}</div>
                ) : (
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Google bağlı değil</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => { setSifreAcikId(sifreAcikId === m.id ? null : m.id); setYeniSifre('') }} style={{
                  fontSize: 12, color: '#1E40AF', background: '#EEF2FF', border: 'none',
                  borderRadius: 6, padding: '6px 10px', cursor: 'pointer'
                }}>Şifre Sıfırla</button>
                <button onClick={() => sil(m)} style={{
                  fontSize: 12, color: '#DC2626', background: '#FEF2F2', border: 'none',
                  borderRadius: 6, padding: '6px 10px', cursor: 'pointer'
                }}>Sil</button>
              </div>
            </div>

            {sifreAcikId === m.id && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                  type="text" placeholder="Yeni şifre" value={yeniSifre}
                  onChange={e => setYeniSifre(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }}
                />
                <button onClick={() => sifreKaydet(m)} style={{
                  fontSize: 13, fontWeight: 700, color: '#fff', background: '#22C55E', border: 'none',
                  borderRadius: 8, padding: '8px 14px', cursor: 'pointer'
                }}>Kaydet</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
