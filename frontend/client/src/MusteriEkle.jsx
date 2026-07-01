import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function MusteriEkle({ onKapat }) {
  const [isletmeAdi, setIsletmeAdi] = useState('')
  const [kategori, setKategori] = useState('')
  const [telefon, setTelefon] = useState('')
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  const kaydet = async (e) => {
    e.preventDefault()
    setHata('')
    setMesaj('')
    setYukleniyor(true)

    try {
      const res = await fetch(`${API_URL}/admin/musteriler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: sessionStorage.getItem('authHeader') || ''
        },
        body: JSON.stringify({
          email, password: sifre, business_name: isletmeAdi, phone: telefon, category: kategori
        })
      })
      const data = await res.json()

      if (res.ok) {
        setMesaj(data.message || 'Müşteri hesabı oluşturuldu.')
        setIsletmeAdi(''); setKategori(''); setTelefon(''); setEmail(''); setSifre('')
      } else {
        setHata(data.detail || 'Hesap oluşturulamadı.')
      }
    } catch {
      setHata('Sunucuya bağlanılamadı.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <form onSubmit={kaydet} style={{
        background: '#fff', padding: 28, borderRadius: 14, width: 340,
        display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 17, color: '#0F172A' }}>Yeni Müşteri Ekle</h3>
          <button type="button" onClick={onKapat} style={{
            border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B'
          }}>×</button>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
          Müşteri bu email/şifre ile kendi panel adresinden giriş yapacak.
        </p>

        <input placeholder="İşletme adı" value={isletmeAdi} onChange={e => setIsletmeAdi(e.target.value)}
          required style={inputStyle} />
        <input placeholder="Kategori (örn: Çiçekçi)" value={kategori} onChange={e => setKategori(e.target.value)}
          style={inputStyle} />
        <input placeholder="Telefon" value={telefon} onChange={e => setTelefon(e.target.value)}
          style={inputStyle} />
        <input type="email" placeholder="Müşteri email" value={email} onChange={e => setEmail(e.target.value)}
          required style={inputStyle} />
        <input type="password" placeholder="Müşteri şifresi" value={sifre} onChange={e => setSifre(e.target.value)}
          required style={inputStyle} />

        {hata && <div style={{ color: '#DC2626', fontSize: 13 }}>{hata}</div>}
        {mesaj && <div style={{ color: '#16A34A', fontSize: 13 }}>{mesaj}</div>}

        <button type="submit" disabled={yukleniyor} style={{
          padding: '10px 12px', borderRadius: 8, border: 'none',
          background: '#1E40AF', color: 'white', fontSize: 14, fontWeight: 600,
          cursor: yukleniyor ? 'default' : 'pointer', opacity: yukleniyor ? 0.7 : 1
        }}>
          {yukleniyor ? 'Kaydediliyor...' : 'Hesabı Oluştur'}
        </button>
      </form>
    </div>
  )
}

const inputStyle = {
  padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
  background: '#F8FAFC', color: '#0F172A', fontSize: 14
}
