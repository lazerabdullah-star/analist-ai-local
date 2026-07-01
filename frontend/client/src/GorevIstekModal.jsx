import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const BASLIKLAR = {
  foto: { baslik: 'Fotoğraf Ekle', aciklama: 'İşletmenize ait bir fotoğraf seçin.' },
  website: { baslik: 'Web Sitesi Ekle', aciklama: 'İşletmenizin web sitesi bağlantısını girin.' },
  hizmet: { baslik: 'Hizmet Ekle', aciklama: 'Sunduğunuz bir hizmeti yazın.' },
}

export default function GorevIstekModal({ gorev, onKapat }) {
  const [deger, setDeger] = useState('')
  const [dosya, setDosya] = useState(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [basarili, setBasarili] = useState(false)
  const [hata, setHata] = useState('')

  const bilgi = BASLIKLAR[gorev.tur] || { baslik: 'Talep Gönder', aciklama: '' }
  const token = sessionStorage.getItem('musteriToken')

  const gonder = async (e) => {
    e.preventDefault()
    setHata('')
    setGonderiliyor(true)
    try {
      let res
      if (gorev.tur === 'foto') {
        if (!dosya) { setHata('Lütfen bir fotoğraf seçin.'); setGonderiliyor(false); return }
        const form = new FormData()
        form.append('file', dosya)
        res = await fetch(`${API_URL}/musteri/istek/foto`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        })
      } else {
        res = await fetch(`${API_URL}/musteri/istek`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ type: gorev.tur, value: deger })
        })
      }

      if (res.ok) {
        setBasarili(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setHata(data.detail || 'Gönderilemedi, tekrar deneyin.')
      }
    } catch {
      setHata('Sunucuya bağlanılamadı.')
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16
    }}>
      <div style={{
        background: '#fff', padding: 28, borderRadius: 14, width: 340,
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 17, color: '#0F172A' }}>{bilgi.baslik}</h3>
          <button onClick={onKapat} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}>×</button>
        </div>

        {basarili ? (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 14, color: '#16A34A', fontWeight: 600 }}>✓ Talebiniz alındı!</p>
            <p style={{ fontSize: 13, color: '#64748B' }}>Ekibimiz en kısa sürede işletme profilinizi güncelleyecek.</p>
            <button onClick={onKapat} style={{
              marginTop: 10, padding: '10px 12px', borderRadius: 8, border: 'none',
              background: '#1E40AF', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%'
            }}>Kapat</button>
          </div>
        ) : (
          <form onSubmit={gonder} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>{bilgi.aciklama}</p>

            {gorev.tur === 'foto' ? (
              <input type="file" accept="image/*" onChange={e => setDosya(e.target.files[0])} style={inputStyle} />
            ) : (
              <input
                type={gorev.tur === 'website' ? 'url' : 'text'}
                placeholder={gorev.tur === 'website' ? 'https://...' : 'Örn: Diş beyazlatma'}
                value={deger}
                onChange={e => setDeger(e.target.value)}
                required
                style={inputStyle}
              />
            )}

            {hata && <div style={{ color: '#DC2626', fontSize: 13 }}>{hata}</div>}

            <button type="submit" disabled={gonderiliyor} style={{
              padding: '10px 12px', borderRadius: 8, border: 'none',
              background: '#22C55E', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: gonderiliyor ? 'default' : 'pointer', opacity: gonderiliyor ? 0.7 : 1
            }}>
              {gonderiliyor ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
  background: '#F8FAFC', color: '#0F172A', fontSize: 14
}
