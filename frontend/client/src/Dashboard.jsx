import { useState, useEffect } from 'react'
import GorevIstekModal from './GorevIstekModal'
import GoogleBaglanti from './GoogleBaglanti'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// ─── Varsayılan işletme bilgisi (müşteri hesabından gelen veriyle değiştirilir) ─
const DEMO = {
  isletme: {
    ad: 'İşletmeniz',
    kategori: '',
    sehir: '',
    telefon: '',
  }
}

// ─── Yardımcı hook ────────────────────────────────────────────────────────────
function useEkran() {
  const [mobil, setMobil] = useState(window.innerWidth < 640)
  const [tablet, setTablet] = useState(window.innerWidth < 1024)
  useEffect(() => {
    const f = () => { setMobil(window.innerWidth < 640); setTablet(window.innerWidth < 1024) }
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return { mobil, tablet }
}

// ─── Yıldız ───────────────────────────────────────────────────────────────────
function Yildiz({ deger, boyut = 14 }) {
  return (
    <span style={{ fontSize: boyut, lineHeight: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(deger) ? '#F59E0B' : '#E2E8F0' }}>★</span>
      ))}
    </span>
  )
}

// ─── Sağlık Puanı Göstergesi ──────────────────────────────────────────────────
function SaglikPuani({ puan }) {
  const renk   = puan < 40 ? '#EF4444' : puan < 70 ? '#F59E0B' : '#22C55E'
  const etiket = puan < 40 ? 'Kritik'  : puan < 70 ? 'Gelişiyor' : 'İyi'
  const r = 42, cevre = 2 * Math.PI * r, dolu = (puan / 100) * cevre * 0.75
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
        <svg width="110" height="110" style={{ transform: 'rotate(135deg)' }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke="#F1F5F9" strokeWidth="9"
            strokeDasharray={`${cevre * 0.75} ${cevre * 0.25}`} strokeLinecap="round" />
          <circle cx="55" cy="55" r={r} fill="none" stroke={renk} strokeWidth="9"
            strokeDasharray={`${dolu} ${cevre - dolu}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: renk, lineHeight: 1 }}>{puan}</span>
          <span style={{ fontSize: 10, color: '#94A3B8' }}>/100</span>
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#0F172A' }}>Analist Skoru</div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
          background: renk + '20', color: renk }}>{etiket}</span>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 8, lineHeight: 1.5 }}>
          Profil %{puan} tamamlanmış.<br />
          Önerilen adımları uygulayarak<br />
          skoru artırabilirsiniz.
        </div>
      </div>
    </div>
  )
}

// ─── Görev Ekle Butonu ────────────────────────────────────────────────────────
function GorevEkleButonu({ onClick }) {
  return (
    <button onClick={onClick} title="Ekle" style={{
      width: 26, height: 26, borderRadius: '50%', border: 'none', flexShrink: 0,
      background: '#22C55E', color: '#fff', fontSize: 16, fontWeight: 700,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 0 4px #DCFCE7'
    }}>+</button>
  )
}

// ─── Görev listesi (gerçek eksik verilerden) ──────────────────────────────────
const GOREV_IKON = { 'Telefon numarası eksik': '📞', 'Adres eksik': '📍', 'Çalışma saatleri girilmemiş': '🕒', 'Web sitesi yok': '🌐' }
function eksiklerdenGorevUret(missing) {
  return missing.map((metin, i) => {
    const foto = metin.includes('fotoğraf') || metin.includes('Fotoğraf')
    const yorum = metin.includes('yorum') || metin.includes('Yorum')
    const website = metin.includes('Web sitesi')
    return {
      id: i,
      baslik: metin,
      ikon: GOREV_IKON[metin] || (foto ? '📷' : yorum ? '💬' : website ? '🌐' : '📋'),
      oncelik: i === 0 ? 'yüksek' : i === 1 ? 'orta' : 'düşük',
      tur: foto ? 'foto' : yorum ? 'yorum' : website ? 'website' : 'hizmet'
    }
  })
}

// ─── Ana Sayfa Tab ─────────────────────────────────────────────────────────────
function AnaSayfa({ mobil, setTab, onGorevEkle, gercek, gercekYukleniyor }) {
  const isletme = gercek?.isletme?.found ? gercek.isletme : null
  const gorevler = isletme ? eksiklerdenGorevUret(isletme.missing) : []

  return (
    <div>
      <GoogleBaglanti />

      {/* AI Özet */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A, #3B5BDB)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 20, color: '#fff'
      }}>
        <div style={{ fontSize: 12, color: '#93C5FD', marginBottom: 4 }}>✨ Günlük AI Analizi</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, lineHeight: 1.4 }}>
          Günaydın! İşletmenizi analiz ettim.
        </div>
        {gercekYukleniyor ? (
          <div style={{ fontSize: 13, color: '#BFDBFE' }}>Google Haritalar'daki verileriniz kontrol ediliyor...</div>
        ) : isletme ? (
          <div style={{ fontSize: 13, color: '#BFDBFE', lineHeight: 1.7 }}>
            ⭐ Google puanınız <strong style={{ color: '#fff' }}>{isletme.rating ?? '—'}</strong>, toplam <strong style={{ color: '#fff' }}>{isletme.review_count}</strong> yorumunuz var.<br />
            📊 Profiliniz <strong style={{ color: '#fff' }}>%{isletme.score}</strong> tamamlanmış.<br />
            {isletme.missing.length > 0 ? (
              <>🔧 En önemli eksik: <strong style={{ color: '#fff' }}>{isletme.missing[0]}</strong></>
            ) : (
              <>✅ Profilinizde eksik bulunamadı, harika durumdasınız.</>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#BFDBFE' }}>
            İşletmeniz Google Haritalar'da henüz eşleştirilemedi. İşletme adı/şehir bilgilerini kontrol etmemiz gerekebilir.
          </div>
        )}
      </div>

      {/* İstatistikler */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 20,
        border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
        fontSize: 13, color: '#64748B'
      }}>
        📈 Profil görüntülenme, telefon araması ve yön tarifi gibi etkileşim istatistikleri, Google ile bağlantınız tamamlandıktan sonra burada gösterilecek.
      </div>

      {/* Sağlık Puanı + Görevler */}
      <div style={{ display: 'grid', gridTemplateColumns: mobil ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '22px 24px',
          border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)'
        }}>
          {isletme ? <SaglikPuani puan={isletme.score} /> : (
            <div style={{ fontSize: 13, color: '#64748B' }}>Analist Skoru için işletme verisi bekleniyor.</div>
          )}
        </div>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '22px 24px',
          border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)'
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 14 }}>Bugünkü Görevler</div>
          {gorevler.length === 0 && (
            <div style={{ fontSize: 13, color: '#64748B' }}>
              {isletme ? 'Şu an önerilecek bir görev yok.' : 'İşletme verisi bulunamadığı için görev üretilemedi.'}
            </div>
          )}
          {gorevler.map(g => {
            const renkler = { yüksek: ['#FEF2F2','#DC2626'], orta: ['#FFFBEB','#D97706'], düşük: ['#F0FDF4','#16A34A'] }
            const [bg, tc] = renkler[g.oncelik]
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 10, background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0
                }}>{g.ikon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{g.baslik}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  background: bg, color: tc, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'auto' }}>
                  {g.oncelik}
                </span>
                <GorevEkleButonu onClick={() => g.tur === 'yorum' ? setTab('yorum') : onGorevEkle(g)} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Yorumlar Tab ─────────────────────────────────────────────────────────────
function Yorumlar({ gercek, gercekYukleniyor }) {
  const isletme = gercek?.isletme?.found ? gercek.isletme : null

  if (gercekYukleniyor) {
    return <div style={{ fontSize: 13, color: '#64748B' }}>Yükleniyor...</div>
  }

  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #E2E8F0', marginBottom: 16, boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
        {isletme ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{isletme.rating ?? '—'}</div>
            {isletme.rating != null && <Yildiz deger={isletme.rating} boyut={18} />}
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{isletme.review_count} yorum</div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#64748B' }}>İşletmeniz Google Haritalar'da henüz eşleştirilemedi.</div>
        )}
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
        <div style={{ fontSize: 13, color: '#64748B' }}>
          Yorumları tek tek görüntüleme ve AI ile yanıtlama özelliği, Google Yorum Yönetimi entegrasyonu tamamlanınca burada olacak.
        </div>
      </div>
    </div>
  )
}

// ─── Rakip Tab ────────────────────────────────────────────────────────────────
function Rakip({ mobil, gercek, gercekYukleniyor, isletmeAdi }) {
  if (gercekYukleniyor) {
    return <div style={{ fontSize: 13, color: '#64748B' }}>Yükleniyor...</div>
  }

  const isletme = gercek?.isletme?.found ? gercek.isletme : null
  const r = gercek?.rakip?.found ? gercek.rakip : null

  if (!isletme || !r) {
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
        <div style={{ fontSize: 13, color: '#64748B' }}>
          Rakip karşılaştırması için işletme ve şehir/kategori bilgilerinizin Google Haritalar'da eşleşmesi gerekiyor. Şu an yeterli veri bulunamadı.
        </div>
      </div>
    )
  }

  const satirlar = [
    { baslik: 'Google Puanı', benim: (isletme.rating ?? '—') + ' ★', rakip: (r.rating ?? '—') + ' ★', benimIyi: (isletme.rating ?? 0) >= (r.rating ?? 0) },
    { baslik: 'Yorum Sayısı', benim: isletme.review_count, rakip: r.review_count, benimIyi: isletme.review_count >= r.review_count },
    { baslik: 'Fotoğraf Sayısı', benim: isletme.photo_count, rakip: r.photo_count, benimIyi: isletme.photo_count >= r.photo_count },
  ]
  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 20 }}>En Yakın Rakip</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <div style={{ textAlign: 'center', padding: 16, background: '#EEF2FF', borderRadius: 14 }}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>SİZ</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{isletmeAdi}</div>
          </div>
          <div style={{ fontSize: 20, color: '#94A3B8', textAlign: 'center' }}>VS</div>
          <div style={{ textAlign: 'center', padding: 16, background: '#F8FAFC', borderRadius: 14 }}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>RAKİP</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{r.ad}</div>
          </div>
        </div>
        {satirlar.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              padding: '10px 14px', borderRadius: 10, textAlign: 'center', fontWeight: 700, fontSize: 15,
              background: s.benimIyi ? '#F0FDF4' : '#FEF2F2',
              color: s.benimIyi ? '#16A34A' : '#DC2626'
            }}>{s.benim}</div>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#64748B' }}>{s.baslik}</div>
            <div style={{
              padding: '10px 14px', borderRadius: 10, textAlign: 'center', fontWeight: 700, fontSize: 15,
              background: !s.benimIyi ? '#F0FDF4' : '#FEF2F2',
              color: !s.benimIyi ? '#16A34A' : '#DC2626'
            }}>{s.rakip}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Ana Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ musteri, onCikis }) {
  const [tab, setTab] = useState('ana')
  const [gorevAcik, setGorevAcik] = useState(null)
  const [gercek, setGercek] = useState(null)
  const [gercekYukleniyor, setGercekYukleniyor] = useState(true)
  const { mobil, tablet } = useEkran()

  useEffect(() => {
    const getir = async () => {
      try {
        const token = sessionStorage.getItem('musteriToken')
        const res = await fetch(`${API_URL}/musteri/gercek-veri`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) setGercek(await res.json())
      } finally {
        setGercekYukleniyor(false)
      }
    }
    getir()
  }, [])

  if (musteri) {
    DEMO.isletme.ad = musteri.business_name || DEMO.isletme.ad
    DEMO.isletme.telefon = musteri.phone || DEMO.isletme.telefon
    DEMO.isletme.kategori = musteri.category || DEMO.isletme.kategori
    DEMO.isletme.sehir = musteri.city || DEMO.isletme.sehir
  }

  const skor = gercek?.isletme?.found ? gercek.isletme.score : null

  const tablar = [
    { id: 'ana',    ikon: '🏠', baslik: 'Ana Sayfa' },
    { id: 'yorum',  ikon: '💬', baslik: 'Yorumlar'  },
    { id: 'rakip',  ikon: '📊', baslik: 'Rakip'     },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: mobil ? 72 : 0 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
        padding: mobil ? '14px 16px' : '0 32px',
        height: mobil ? 'auto' : 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        boxShadow: '0 2px 12px rgba(30,58,138,0.25)'
      }}>
        <div>
          <div style={{ fontSize: mobil ? 15 : 17, fontWeight: 800, color: '#fff' }}>
            {DEMO.isletme.ad}
          </div>
          <div style={{ fontSize: 12, color: '#93C5FD' }}>
            {DEMO.isletme.kategori}{DEMO.isletme.sehir ? ` • ${DEMO.isletme.sehir}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '6px 14px',
            fontSize: 13, color: '#fff', fontWeight: 700
          }}>
            Skor: {skor != null ? `${skor}/100` : '—'}
          </div>
          {onCikis && (
            <button onClick={onCikis} style={{
              fontSize: 12, color: '#93C5FD', background: 'none',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6,
              padding: '5px 10px', cursor: 'pointer'
            }}>Çıkış</button>
          )}
          {!mobil && (
            <div style={{ display: 'flex', gap: 4 }}>
              {tablar.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
                  background: tab === t.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: tab === t.id ? '#fff' : '#93C5FD', fontWeight: tab === t.id ? 700 : 400
                }}>{t.ikon} {t.baslik}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: mobil ? '16px 12px' : '24px 16px' }}>
        {tab === 'ana'   && <AnaSayfa mobil={mobil} setTab={setTab} onGorevEkle={setGorevAcik} gercek={gercek} gercekYukleniyor={gercekYukleniyor} />}
        {tab === 'yorum' && <Yorumlar gercek={gercek} gercekYukleniyor={gercekYukleniyor} />}
        {tab === 'rakip' && <Rakip mobil={mobil} gercek={gercek} gercekYukleniyor={gercekYukleniyor} isletmeAdi={DEMO.isletme.ad} />}
      </div>

      {gorevAcik && <GorevIstekModal gorev={gorevAcik} onKapat={() => setGorevAcik(null)} />}

      {/* Mobil alt navigasyon */}
      {mobil && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
          background: '#fff', borderTop: '1px solid #E2E8F0',
          display: 'flex', boxShadow: '0 -4px 12px rgba(15,23,42,0.08)'
        }}>
          {tablar.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 4, border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: tab === t.id ? '#3B5BDB' : '#94A3B8'
            }}>
              <span style={{ fontSize: 20 }}>{t.ikon}</span>
              <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400 }}>{t.baslik}</span>
              {tab === t.id && (
                <div style={{ position: 'absolute', bottom: 0, width: 32, height: 3, background: '#3B5BDB', borderRadius: '3px 3px 0 0' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
