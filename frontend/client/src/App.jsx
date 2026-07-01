import { useState, useMemo } from 'react'
import Dashboard from './Dashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function excelIndir(isletmeler, sehir, ilce) {
  const baslik = [
    'İşletme Adı', 'Telefon', 'Web Sitesi', 'Adres', 'Şehir', 'İlçe',
    'Kategori', 'Profil Puanı', 'Öncelik', 'Yıldız Puanı', 'Yorum Sayısı',
    'Fotoğraf Sayısı', 'Çalışma Saati', 'Eksikler'
  ]

  const satirlar = isletmeler.map(b => [
    b.name                    ?? '',
    b.phone                   ?? '',
    b.website                 ?? '',
    b.address                 ?? '',
    sehir,
    ilce                      ?? '',
    b.category                ?? '',
    b.completeness_score      ?? 0,
    b.priority                ?? '',
    b.rating                  ?? '',
    b.review_count            ?? 0,
    b.photo_count             ?? 0,
    b.has_hours ? 'Var' : 'Yok',
    (b.missing_items ?? []).join(' | ')
  ])

  const satiraDonustur = (satir) =>
    satir.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';')

  const icerik = [baslik, ...satirlar].map(satiraDonustur).join('\r\n')

  // UTF-8 BOM ekle — Excel Türkçe karakterleri düzgün okusun
  const blob = new Blob(['﻿' + icerik], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `analist_ai_${sehir}_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const HIZLI_KATEGORILER = [
  'Dişçi', 'Oto Servis', 'Elektrikçi', 'Tesisatçı', 'Restoran',
  'Kafe', 'Kuaför', 'Veteriner', 'Spor Salonu', 'Eczane',
  'Muhasebeci', 'Avukat', 'Dönerci', 'Fırın', 'Market'
]

const ONCELIK = {
  'YÜKSEK': { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: 'Yüksek Öncelik' },
  'ORTA':   { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: 'Orta Öncelik'   },
  'DÜŞÜK':  { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', label: 'Düşük Öncelik'  },
}

const FILTRELER = [
  { key: 'no_phone',   label: 'Telefonu yok',        icon: '📵' },
  { key: 'no_photo',   label: 'Fotoğrafı yok',        icon: '🖼' },
  { key: 'no_website', label: 'Web sitesi yok',       icon: '🌐' },
  { key: 'no_hours',   label: 'Çalışma saati yok',    icon: '🕐' },
  { key: 'no_reviews', label: 'Yorumu yok / az',      icon: '💬' },
]

function filtreGec(isletme, aktif) {
  if (aktif.size === 0) return true
  if (aktif.has('no_phone')   && isletme.phone)               return false
  if (aktif.has('no_photo')   && isletme.photo_count > 0)     return false
  if (aktif.has('no_website') && isletme.website)             return false
  if (aktif.has('no_hours')   && isletme.has_hours)           return false
  if (aktif.has('no_reviews') && isletme.review_count >= 5)   return false
  return true
}

function PuanDairesi({ puan }) {
  const renk = puan < 40 ? '#EF4444' : puan < 70 ? '#F59E0B' : '#22C55E'
  const r = 20, cevre = 2 * Math.PI * r
  const dolu = (puan / 100) * cevre
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E2E8F0" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={renk} strokeWidth="5"
          strokeDasharray={`${dolu} ${cevre}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: renk, lineHeight: 1 }}>{puan}</span>
        <span style={{ fontSize: 9, color: '#94A3B8', lineHeight: 1, marginTop: 1 }}>/100</span>
      </div>
    </div>
  )
}

function IsletmeKarti({ isletme, index }) {
  const [acik, setAcik] = useState(false)
  const onc = ONCELIK[isletme.priority] || ONCELIK['ORTA']
  return (
    <div style={{
      background: '#fff', border: `1px solid #E2E8F0`,
      borderRadius: 14, marginBottom: 10, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* Numara */}
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: '#F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#64748B', flexShrink: 0, marginTop: 2
          }}>{index + 1}</div>

          {/* İçerik */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                background: onc.bg, color: onc.text, border: `1px solid ${onc.border}`,
                letterSpacing: 0.3
              }}>{onc.label}</span>
              {isletme.category && (
                <span style={{ fontSize: 11, color: '#94A3B8', background: '#F8FAFC',
                  border: '1px solid #E2E8F0', borderRadius: 99, padding: '2px 8px' }}>
                  {isletme.category}
                </span>
              )}
            </div>

            <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isletme.name}
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {isletme.address && (
                <span style={{ fontSize: 12, color: '#64748B' }}>📍 {isletme.address}</span>
              )}
              {isletme.rating > 0 && (
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  ⭐ {isletme.rating} <span style={{ color: '#94A3B8' }}>({isletme.review_count} yorum)</span>
                </span>
              )}
              {isletme.phone && (
                <span style={{ fontSize: 12, color: '#64748B' }}>📞 {isletme.phone}</span>
              )}
            </div>

            {/* Eksik etiketler — mini */}
            {isletme.missing_items.length > 0 && (
              <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                {isletme.missing_items.slice(0, 3).map((e, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: '2px 7px', borderRadius: 6,
                    background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA'
                  }}>✕ {e}</span>
                ))}
                {isletme.missing_items.length > 3 && (
                  <span style={{ fontSize: 11, color: '#94A3B8', padding: '2px 7px' }}>
                    +{isletme.missing_items.length - 3} daha
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Puan dairesi + detay butonu */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <PuanDairesi puan={isletme.completeness_score} />
            <button onClick={() => setAcik(!acik)} style={{
              fontSize: 11, color: '#64748B', background: '#F8FAFC',
              border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 10px',
              cursor: 'pointer', whiteSpace: 'nowrap'
            }}>{acik ? '▲ Kapat' : '▼ Detay'}</button>
          </div>
        </div>
      </div>

      {/* Detay paneli */}
      {acik && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '14px 20px 16px', background: '#FAFAFA' }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Tüm Eksikler</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {isletme.missing_items.map((e, i) => (
                  <span key={i} style={{ fontSize: 13, color: '#EF4444' }}>✕ {e}</span>
                ))}
                {isletme.missing_items.length === 0 && (
                  <span style={{ fontSize: 13, color: '#22C55E' }}>✓ Profil eksiksiz görünüyor</span>
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Bağlantılar</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {isletme.phone && (
                  <a href={`tel:${isletme.phone}`} style={{ fontSize: 13, color: '#3B5BDB', textDecoration: 'none' }}>
                    📞 {isletme.phone}
                  </a>
                )}
                {isletme.website && (
                  <a href={isletme.website} target="_blank" rel="noreferrer"
                    style={{ fontSize: 13, color: '#3B5BDB', textDecoration: 'none' }}>
                    🌐 Web sitesini aç
                  </a>
                )}
                {!isletme.phone && !isletme.website && (
                  <span style={{ fontSize: 13, color: '#94A3B8' }}>Bağlantı bilgisi yok</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [sayfa, setSayfa] = useState('tarayici')
  const [sehir, setSehir]           = useState('İstanbul')
  const [ilce, setIlce]             = useState('')
  const [kategoriYazisi, setKategoriYazisi] = useState('')
  const [secilenler, setSecilenler] = useState(new Set())
  const [yukleniyor, setYukleniyor] = useState(false)
  const [tumIsletmeler, setTumIsletmeler] = useState([])
  const [hata, setHata]             = useState('')
  const [tarandiMi, setTarandiMi]   = useState(false)
  const [siralama, setSiralama]         = useState('asc')
  const [aktifFiltreler, setAktifFiltreler] = useState(new Set())

  const liste = useMemo(() => {
    const filtreli = tumIsletmeler.filter(b => filtreGec(b, aktifFiltreler))
    return [...filtreli].sort((a, b) =>
      siralama === 'asc'
        ? a.completeness_score - b.completeness_score
        : b.completeness_score - a.completeness_score
    )
  }, [tumIsletmeler, siralama, aktifFiltreler])

  if (sayfa === 'dashboard') return (
    <div>
      <div style={{ background: '#0F172A', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setSayfa('tarayici')} style={{
          fontSize: 12, color: '#94A3B8', background: 'none', border: '1px solid #334155',
          borderRadius: 6, padding: '4px 10px', cursor: 'pointer'
        }}>← Tarayıcıya Dön</button>
        <span style={{ fontSize: 12, color: '#475569' }}>Demo Müşteri Ekranı</span>
      </div>
      <Dashboard />
    </div>
  )

  const kategoriToggle = (k) => {
    setSecilenler(prev => {
      const s = new Set(prev)
      s.has(k) ? s.delete(k) : s.add(k)
      return s
    })
  }

  const filtreToggle = (k) => {
    setAktifFiltreler(prev => {
      const s = new Set(prev)
      s.has(k) ? s.delete(k) : s.add(k)
      return s
    })
  }

  const tara = async () => {
    const sorgular = [
      ...Array.from(secilenler),
      ...(kategoriYazisi.trim() ? [kategoriYazisi.trim()] : [])
    ]
    if (!sehir.trim() || sorgular.length === 0) {
      setHata('Şehir ve en az bir kategori gerekli.')
      return
    }
    setHata('')
    setYukleniyor(true)
    setTumIsletmeler([])
    setTarandiMi(false)

    const sonuclar = []
    for (const sorgu of sorgular) {
      const aramaMetni = ilce.trim() ? `${sorgu} ${ilce} ${sehir}` : `${sorgu} ${sehir}`
      try {
        const res = await fetch(`${API_URL}/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: sessionStorage.getItem('authHeader') || ''
          },
          body: JSON.stringify({ city: sehir, category: aramaMetni, max_results: 20 })
        })
        const data = await res.json()
        if (data.businesses) sonuclar.push(...data.businesses)
      } catch {
        setHata('Sunucuya bağlanılamadı.')
      }
    }

    // Tekrar edenleri kaldır (aynı place ID)
    const tekSiz = Object.values(
      sonuclar.reduce((acc, b) => { acc[b.id] = b; return acc }, {})
    )
    setTumIsletmeler(tekSiz)
    setTarandiMi(true)
    setYukleniyor(false)
    setAktifFiltreler(new Set())
  }

  const yuksek = liste.filter(b => b.priority === 'YÜKSEK').length
  const orta   = liste.filter(b => b.priority === 'ORTA').length

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
        padding: '0 32px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(30,58,138,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16
          }}>🔍</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Analist AI</span>
          <span style={{
            fontSize: 11, color: '#93C5FD', background: 'rgba(255,255,255,0.1)',
            padding: '2px 8px', borderRadius: 99, marginLeft: 2
          }}>İşletme Tarayıcı</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {tarandiMi && (
            <span style={{ fontSize: 12, color: '#93C5FD' }}>
              {tumIsletmeler.length} işletme veritabanında
            </span>
          )}
          <button onClick={() => setSayfa('dashboard')} style={{
            fontSize: 12, fontWeight: 700, color: '#1E40AF',
            background: '#fff', border: 'none', borderRadius: 8,
            padding: '6px 14px', cursor: 'pointer'
          }}>👤 Müşteri Ekranı</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px' }}>

        {/* Arama Kartı */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: 28,
          boxShadow: '0 2px 12px rgba(15,23,42,0.07)', marginBottom: 20,
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
            İşletme Ara
          </div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 22 }}>
            Şehir ve kategori seçin — birden fazla kategori seçebilirsiniz
          </div>

          {/* Şehir + İlçe */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Şehir <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input value={sehir} onChange={e => setSehir(e.target.value)} placeholder="İstanbul"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box', color: '#0F172A',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#3B5BDB'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                İlçe <span style={{ color: '#94A3B8', fontWeight: 400 }}>(opsiyonel)</span>
              </label>
              <input value={ilce} onChange={e => setIlce(e.target.value)} placeholder="Kadıköy, Beşiktaş..."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box', color: '#0F172A'
                }}
                onFocus={e => e.target.style.borderColor = '#3B5BDB'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
          </div>

          {/* Kategori serbest yazma */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Kategori yaz <span style={{ color: '#94A3B8', fontWeight: 400 }}>(dönerci, hamburgerci, tamirci...)</span>
            </label>
            <input
              value={kategoriYazisi}
              onChange={e => setKategoriYazisi(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tara()}
              placeholder="Arama yapmak istediğiniz işletme türünü yazın..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none',
                boxSizing: 'border-box', color: '#0F172A'
              }}
              onFocus={e => e.target.style.borderColor = '#3B5BDB'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          {/* Hızlı kategori seçimi */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Hızlı seçim
              {secilenler.size > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 11, background: '#EEF2FF', color: '#3B5BDB',
                  padding: '1px 7px', borderRadius: 99, fontWeight: 700
                }}>{secilenler.size} seçili</span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {HIZLI_KATEGORILER.map(k => {
                const sec = secilenler.has(k)
                return (
                  <button key={k} onClick={() => kategoriToggle(k)} style={{
                    padding: '6px 13px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                    border: sec ? '2px solid #3B5BDB' : '1.5px solid #E2E8F0',
                    background: sec ? '#EEF2FF' : '#F8FAFC',
                    color: sec ? '#3B5BDB' : '#475569',
                    fontWeight: sec ? 700 : 400,
                    transition: 'all 0.15s'
                  }}>{sec ? '✓ ' : ''}{k}</button>
                )
              })}
            </div>
          </div>

          {hata && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
              padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 14
            }}>{hata}</div>
          )}

          <button onClick={tara} disabled={yukleniyor} style={{
            width: '100%', padding: '13px', borderRadius: 10, border: 'none',
            background: yukleniyor
              ? '#93C5FD'
              : 'linear-gradient(135deg, #3B5BDB 0%, #1E40AF 100%)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: yukleniyor ? 'not-allowed' : 'pointer',
            boxShadow: yukleniyor ? 'none' : '0 4px 12px rgba(59,91,219,0.35)',
            transition: 'all 0.2s'
          }}>
            {yukleniyor
              ? '⏳ Taranıyor...'
              : secilenler.size + (kategoriYazisi.trim() ? 1 : 0) > 1
                ? `🔍 ${secilenler.size + (kategoriYazisi.trim() ? 1 : 0)} Kategoriyi Tara`
                : '🔍 Tara'
            }
          </button>
        </div>

        {/* Filtre & Sıralama */}
        {tarandiMi && (
          <div style={{
            background: '#fff', borderRadius: 14, padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(15,23,42,0.06)', marginBottom: 18,
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Sıralama
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { val: 'asc',  label: '⬆ En eksik önce' },
                    { val: 'desc', label: '⬇ En tamamlı önce' },
                  ].map(s => (
                    <button key={s.val} onClick={() => setSiralama(s.val)} style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                      border: siralama === s.val ? '2px solid #3B5BDB' : '1.5px solid #E2E8F0',
                      background: siralama === s.val ? '#EEF2FF' : '#F8FAFC',
                      color: siralama === s.val ? '#3B5BDB' : '#475569',
                      fontWeight: siralama === s.val ? 700 : 400
                    }}>{s.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ width: 1, background: '#F1F5F9', alignSelf: 'stretch' }} />

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Sadece göster
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {FILTRELER.map(f => {
                    const sec = aktifFiltreler.has(f.key)
                    return (
                      <label key={f.key} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                        border: sec ? '2px solid #EF4444' : '1.5px solid #E2E8F0',
                        background: sec ? '#FEF2F2' : '#F8FAFC',
                        color: sec ? '#DC2626' : '#475569',
                        fontWeight: sec ? 700 : 400, userSelect: 'none',
                        transition: 'all 0.15s'
                      }}>
                        <input type="checkbox" checked={sec} onChange={() => filtreToggle(f.key)}
                          style={{ accentColor: '#EF4444', cursor: 'pointer' }} />
                        {f.icon} {f.label}
                      </label>
                    )
                  })}
                  {aktifFiltreler.size > 0 && (
                    <button onClick={() => setAktifFiltreler(new Set())} style={{
                      fontSize: 12, color: '#94A3B8', background: 'none', border: 'none',
                      cursor: 'pointer', padding: '5px 8px', textDecoration: 'underline'
                    }}>Temizle</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Özet Kartları */}
        {tarandiMi && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { sayi: liste.length, label: 'Gösterilen İşletme', bg: '#fff', numRenk: '#1E40AF', altRenk: '#64748B' },
              { sayi: yuksek, label: 'Yüksek Öncelikli Aday', bg: '#FEF2F2', numRenk: '#DC2626', altRenk: '#9B1C1C' },
              { sayi: orta,   label: 'Orta Öncelikli Aday',   bg: '#FFFBEB', numRenk: '#D97706', altRenk: '#78350F' },
            ].map((k, i) => (
              <div key={i} style={{
                background: k.bg, borderRadius: 12, padding: '16px 20px', textAlign: 'center',
                border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)'
              }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: k.numRenk, lineHeight: 1 }}>{k.sayi}</div>
                <div style={{ fontSize: 12, color: k.altRenk, marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Liste başlık */}
        {tarandiMi && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
              {liste.length} işletme{aktifFiltreler.size > 0 ? ' (filtrelenmiş)' : ''} —{' '}
              <span style={{ color: '#64748B', fontWeight: 400 }}>
                {siralama === 'asc' ? 'en eksik önce' : 'en tamamlı önce'}
              </span>
            </div>
            {liste.length > 0 && (
              <button
                onClick={() => excelIndir(liste, sehir, ilce)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 9, border: '1.5px solid #22C55E',
                  background: '#F0FDF4', color: '#16A34A', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(34,197,94,0.15)',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
                onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}
              >
                📥 Excel'e İndir ({liste.length} işletme)
              </button>
            )}
          </div>
        )}

        {/* İşletme Listesi */}
        {liste.length === 0 && tarandiMi && (
          <div style={{
            textAlign: 'center', padding: '48px 20px', color: '#94A3B8',
            background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Sonuç bulunamadı</div>
            <div style={{ fontSize: 13 }}>Bu filtreyle eşleşen işletme yok.</div>
          </div>
        )}

        {liste.map((isletme, i) => (
          <IsletmeKarti key={isletme.id} isletme={isletme} index={i} />
        ))}

      </div>
    </div>
  )
}
