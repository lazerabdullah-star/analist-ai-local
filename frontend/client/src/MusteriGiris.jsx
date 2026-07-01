import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function MusteriGiris({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  const girisYap = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)

    try {
      const res = await fetch(`${API_URL}/musteri/giris`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: sifre })
      })
      const data = await res.json()

      if (res.ok) {
        sessionStorage.setItem('musteriToken', data.token)
        sessionStorage.setItem('musteriBilgi', JSON.stringify(data))
        onSuccess(data)
      } else {
        setHata(data.detail || 'Email veya şifre hatalı.')
      }
    } catch {
      setHata('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0F172A', fontFamily: 'system-ui, sans-serif'
    }}>
      <form onSubmit={girisYap} style={{
        background: '#1E293B', padding: 32, borderRadius: 12, width: 320,
        display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ color: '#F1F5F9', margin: 0, fontSize: 20 }}>Müşteri Paneli</h2>
        <p style={{ color: '#94A3B8', margin: 0, fontSize: 13 }}>İşletmenizin panosuna giriş yapın</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            padding: '10px 12px', borderRadius: 8, border: '1px solid #334155',
            background: '#0F172A', color: '#F1F5F9', fontSize: 14
          }}
        />
        <input
          type="password"
          placeholder="Şifre"
          value={sifre}
          onChange={e => setSifre(e.target.value)}
          style={{
            padding: '10px 12px', borderRadius: 8, border: '1px solid #334155',
            background: '#0F172A', color: '#F1F5F9', fontSize: 14
          }}
        />

        {hata && <div style={{ color: '#F87171', fontSize: 13 }}>{hata}</div>}

        <button type="submit" disabled={yukleniyor} style={{
          padding: '10px 12px', borderRadius: 8, border: 'none',
          background: '#2563EB', color: 'white', fontSize: 14, fontWeight: 600,
          cursor: yukleniyor ? 'default' : 'pointer', opacity: yukleniyor ? 0.7 : 1
        }}>
          {yukleniyor ? 'Kontrol ediliyor...' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  )
}
