import { useState, useEffect } from 'react'

// ─── Demo veri ────────────────────────────────────────────────────────────────
const DEMO = {
  isletme: {
    ad: 'Güler Diş Kliniği',
    kategori: 'Diş Hekimi',
    sehir: 'İstanbul', ilce: 'Kadıköy',
    telefon: '0216 418 72 33',
    adres: 'Moda Cd. No:12, 34710 Kadıköy/İstanbul',
    puan: 68,
    yildiz: 4.3,
    yorumSayisi: 47,
    fotografSayisi: 3,
    webSitesi: false,
    sonFotografGun: 42,
  },
  istatistik: {
    goruntulenme: { deger: 342, degisim: +18 },
    telefon:      { deger: 11,  degisim: +3  },
    yon:          { deger: 24,  degisim: -2  },
    tiklanma:     { deger: 58,  degisim: +9  },
  },
  rakip: {
    ad: 'Smile Dental Kadıköy',
    yildiz: 4.7, yorum: 112, fotograf: 18,
    benimPuanim: 4.3, benimYorum: 47, benimFotograf: 3,
  },
  yorumlar: [
    { id: 1, ad: 'Mehmet Y.', yildiz: 5, metin: 'Çok memnun kaldım, doktor son derece ilgili ve profesyoneldi. Kesinlikle tavsiye ederim.', tarih: '2 gün önce', cevapVar: false },
    { id: 2, ad: 'Ayşe K.',   yildiz: 4, metin: 'Hizmet genel olarak iyiydi ancak bekleme süresi biraz uzundu.', tarih: '5 gün önce',  cevapVar: false },
    { id: 3, ad: 'Can D.',    yildiz: 3, metin: 'Fiyatlar biraz yüksek ama işini iyi yapıyor.', tarih: '1 hafta önce', cevapVar: true  },
    { id: 4, ad: 'Fatma Ş.',  yildiz: 5, metin: 'Harika bir klinik! Çok temiz ve modern. Herkese öneririm.', tarih: '2 hafta önce', cevapVar: true  },
  ],
  gorevler: [
    { id: 1, baslik: '3 yoruma cevap verilmedi',          aciklama: 'Cevapsız yorumlar müşteri güvenini düşürür.',  oncelik: 'yüksek', ikon: '💬' },
    { id: 2, baslik: '42 gündür fotoğraf yüklenmedi',     aciklama: 'Rakibiniz bu hafta 5 yeni fotoğraf ekledi.',   oncelik: 'yüksek', ikon: '📷' },
    { id: 3, baslik: 'Web sitesi bağlantısı eksik',        aciklama: 'Web sitesi olan işletmeler %35 daha fazla tıklanıyor.', oncelik: 'orta', ikon: '🌐' },
    { id: 4, baslik: 'Hizmet listesi güncellenmeli',       aciklama: 'Sunduğunuz tüm hizmetleri ekleyin.',           oncelik: 'düşük', ikon: '📋' },
  ],
  aiCevaplar: {
    1: 'Değerli Mehmet Bey, güzel yorumunuz için teşekkür ederiz. Sizi kliniğimizde ağırlamaktan mutluluk duyduk. Tekrar görüşmek dileğiyle! 😊',
    2: 'Sayın Ayşe Hanım, değerli geri bildiriminiz için teşekkür ederiz. Bekleme sürelerini kısaltmak için randevu sistemimizi güncelliyoruz. Anlayışınız için teşekkürler.',
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

// ─── İstatistik Kartı ─────────────────────────────────────────────────────────
function StatKart({ ikon, baslik, deger, degisim }) {
  const pozitif = degisim >= 0
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 20px',
      border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)'
    }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{ikon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{deger}</div>
      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{baslik}</div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 8,
        fontSize: 12, fontWeight: 600,
        color: pozitif ? '#16A34A' : '#DC2626',
        background: pozitif ? '#F0FDF4' : '#FEF2F2',
        padding: '2px 8px', borderRadius: 99
      }}>
        {pozitif ? '↑' : '↓'} {Math.abs(degisim)} bu hafta
      </div>
    </div>
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

// ─── Yorum Kartı ──────────────────────────────────────────────────────────────
function YorumKarti({ yorum }) {
  const [cevapAcik, setCevapAcik] = useState(false)
  const [cevap, setCevap] = useState(DEMO.aiCevaplar[yorum.id] || '')
  const [gonderildi, setGonderildi] = useState(yorum.cevapVar)

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10,
      border: `1px solid ${!yorum.cevapVar && !gonderildi ? '#FECACA' : '#E2E8F0'}`,
      boxShadow: '0 1px 4px rgba(15,23,42,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#EEF2FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#3B5BDB', flexShrink: 0
            }}>{yorum.ad[0]}</div>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{yorum.ad}</span>
            <Yildiz deger={yorum.yildiz} />
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{yorum.tarih}</span>
          </div>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>{yorum.metin}</p>
        </div>
        {!gonderildi && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, flexShrink: 0,
            background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA'
          }}>Cevap yok</span>
        )}
        {gonderildi && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, flexShrink: 0,
            background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0'
          }}>✓ Cevaplandı</span>
        )}
      </div>

      {!gonderildi && (
        <div style={{ marginTop: 12 }}>
          {!cevapAcik ? (
            <button onClick={() => setCevapAcik(true)} style={{
              fontSize: 13, fontWeight: 600, color: '#3B5BDB', background: '#EEF2FF',
              border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer'
            }}>✨ AI Cevap Öner</button>
          ) : (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
                AI tarafından oluşturulan cevap — düzenleyebilirsiniz:
              </div>
              <textarea
                value={cevap} onChange={e => setCevap(e.target.value)} rows={3}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
                  border: '1.5px solid #C7D2FE', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', lineHeight: 1.5, color: '#374151', fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setGonderildi(true)} style={{
                  fontSize: 13, fontWeight: 700, color: '#fff', background: '#3B5BDB',
                  border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer'
                }}>Gönder</button>
                <button onClick={() => setCevapAcik(false)} style={{
                  fontSize: 13, color: '#64748B', background: '#F8FAFC',
                  border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer'
                }}>Vazgeç</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Ana Sayfa Tab ─────────────────────────────────────────────────────────────
function AnaSayfa({ mobil }) {
  const ist = DEMO.istatistik
  return (
    <div>
      {/* AI Özet */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A, #3B5BDB)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 20, color: '#fff'
      }}>
        <div style={{ fontSize: 12, color: '#93C5FD', marginBottom: 4 }}>✨ Günlük AI Analizi</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, lineHeight: 1.4 }}>
          Günaydın! İşletmenizi analiz ettim.
        </div>
        <div style={{ fontSize: 13, color: '#BFDBFE', lineHeight: 1.7 }}>
          📈 Profil görüntülenmeniz geçen haftaya göre <strong style={{ color: '#fff' }}>%18 arttı.</strong><br />
          💬 <strong style={{ color: '#fff' }}>3 yorumunuz</strong> henüz cevaplanmadı — müşteri güveni için önemli.<br />
          📷 Son fotoğrafınızı <strong style={{ color: '#fff' }}>42 gün önce</strong> yüklediniz. Rakibiniz bu hafta 5 ekledi.<br />
          🌐 Web sitesi bağlantısı eklenmesi %35 daha fazla tıklanma sağlar.
        </div>
        <div style={{
          marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)',
          fontSize: 13, color: '#93C5FD'
        }}>
          Bugün önerin: <strong style={{ color: '#fff' }}>Önce yorumları cevapla, sonra yeni fotoğraf yükle.</strong>
        </div>
      </div>

      {/* İstatistikler */}
      <div style={{ display: 'grid', gridTemplateColumns: mobil ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <StatKart ikon="👁️" baslik="Profil Görüntüleme" deger={ist.goruntulenme.deger} degisim={ist.goruntulenme.degisim} />
        <StatKart ikon="📞" baslik="Telefon Araması"    deger={ist.telefon.deger}      degisim={ist.telefon.degisim}      />
        <StatKart ikon="🗺️" baslik="Yön Tarifi İsteği"  deger={ist.yon.deger}          degisim={ist.yon.degisim}          />
        <StatKart ikon="🖱️" baslik="Web Tıklaması"      deger={ist.tiklanma.deger}     degisim={ist.tiklanma.degisim}     />
      </div>

      {/* Sağlık Puanı + Görevler */}
      <div style={{ display: 'grid', gridTemplateColumns: mobil ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '22px 24px',
          border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)'
        }}>
          <SaglikPuani puan={DEMO.isletme.puan} />
        </div>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '22px 24px',
          border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)'
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 14 }}>Bugünkü Görevler</div>
          {DEMO.gorevler.map(g => {
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
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{g.aciklama}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  background: bg, color: tc, marginLeft: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {g.oncelik}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Son 2 yorum özet */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>Son Yorumlar</div>
          <span style={{ fontSize: 12, background: '#FEF2F2', color: '#DC2626', padding: '2px 9px', borderRadius: 99, fontWeight: 700 }}>
            3 cevapsız
          </span>
        </div>
        {DEMO.yorumlar.slice(0, 2).map(y => <YorumKarti key={y.id} yorum={y} />)}
      </div>
    </div>
  )
}

// ─── Yorumlar Tab ─────────────────────────────────────────────────────────────
function Yorumlar() {
  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #E2E8F0', marginBottom: 16, boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{DEMO.isletme.yildiz}</div>
            <Yildiz deger={DEMO.isletme.yildiz} boyut={18} />
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{DEMO.isletme.yorumSayisi} yorum</div>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            {[5,4,3,2,1].map(s => {
              const adet = DEMO.yorumlar.filter(y => y.yildiz === s).length
              const yuzde = Math.round((adet / DEMO.yorumlar.length) * 100)
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#64748B', width: 12 }}>{s}</span>
                  <span style={{ fontSize: 12, color: '#F59E0B' }}>★</span>
                  <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 99 }}>
                    <div style={{ height: 6, width: `${yuzde}%`, background: '#F59E0B', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#94A3B8', width: 20 }}>{adet}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {DEMO.yorumlar.map(y => <YorumKarti key={y.id} yorum={y} />)}
    </div>
  )
}

// ─── Rakip Tab ────────────────────────────────────────────────────────────────
function Rakip({ mobil }) {
  const r = DEMO.rakip
  const satirlar = [
    { baslik: 'Google Puanı', benim: r.benimPuanim + ' ★', rakip: r.yildiz + ' ★', benimIyi: r.benimPuanim >= r.yildiz },
    { baslik: 'Yorum Sayısı', benim: r.benimYorum, rakip: r.yorum, benimIyi: r.benimYorum >= r.yorum },
    { baslik: 'Fotoğraf Sayısı', benim: r.benimFotograf, rakip: r.fotograf, benimIyi: r.benimFotograf >= r.fotograf },
  ]
  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 20 }}>En Yakın Rakip</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <div style={{ textAlign: 'center', padding: 16, background: '#EEF2FF', borderRadius: 14 }}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>SİZ</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{DEMO.isletme.ad}</div>
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
      <div style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFFBEB)', borderRadius: 14, padding: '16px 20px', border: '1px solid #FDE68A' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E', marginBottom: 8 }}>💡 AI Önerisi</div>
        <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>
          Rakibinizin fotoğraf sayısı sizden <strong>6 kat fazla</strong>. Google, fotoğrafı fazla olan işletmeleri arama sonuçlarında öne çıkarıyor.
          Bu hafta en az <strong>3 fotoğraf</strong> yüklemek sıralamanızı iyileştirebilir.
        </div>
      </div>
    </div>
  )
}

// ─── Ana Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState('ana')
  const { mobil, tablet } = useEkran()

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
            {DEMO.isletme.kategori} • {DEMO.isletme.ilce}, {DEMO.isletme.sehir}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '6px 14px',
            fontSize: 13, color: '#fff', fontWeight: 700
          }}>
            Skor: {DEMO.isletme.puan}/100
          </div>
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
        {tab === 'ana'   && <AnaSayfa mobil={mobil} />}
        {tab === 'yorum' && <Yorumlar />}
        {tab === 'rakip' && <Rakip mobil={mobil} />}
      </div>

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
