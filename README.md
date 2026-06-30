# Analist AI Local — İşletme Tarayıcı

KOBİ'lerin Google İşletme Profili eksikliklerini tespit eden ve müşteri adayı bulan AI destekli platform.

## Kurulum

### Gereksinimler
- Python 3.10+
- Node.js 18+
- Google Places API anahtarı
- Google Gemini API anahtarı

---

### 1. Repoyu klonla

```bash
git clone https://github.com/lazerabdullah-star/analist-ai-local.git
cd analist-ai-local
```

### 2. API anahtarlarını ayarla

```bash
cp .env.example .env
```

`.env` dosyasını aç ve kendi API anahtarlarını yaz.

**Gemini API:** https://aistudio.google.com  
**Google Places API:** https://console.cloud.google.com → Places API'yi etkinleştir

---

### 3. Backend'i başlat

```bash
# Sanal ortam oluştur
python -m venv venv

# Aktif et (Windows)
venv\Scripts\activate

# Aktif et (Mac/Linux)
source venv/bin/activate

# Kütüphaneleri yükle
pip install -r backend/requirements.txt

# Sunucuyu başlat
cd backend
uvicorn main:app --reload
```

Backend çalışınca: http://localhost:8000

---

### 4. Frontend'i başlat

Yeni bir terminal aç:

```bash
cd frontend/client
npm install
npm run dev
```

Frontend çalışınca: http://localhost:5173

---

## Kullanım

1. **İşletme Tarayıcı** — Şehir + kategori seçip tara, eksik profilli işletmeleri bul
2. **Filtrele** — Telefonu yok / fotoğrafı yok gibi kriterlere göre filtrele
3. **Excel'e İndir** — Satış listeni indir
4. **Müşteri Ekranı** — Abonelik alan işletmenin göreceği dashboard (sağ üstteki buton)

## Canlıya Alma (İnternet Linki ile Paylaşma)

Kurulum yapmadan herkesin tarayıcıdan açabileceği bir link istiyorsan:

1. **Backend → Railway.app**
   - Railway'de "New Project" → "Deploy from GitHub repo" → bu repoyu seç
   - Root Directory: `backend`
   - Environment Variables: `GEMINI_API_KEY`, `GOOGLE_PLACES_API_KEY` ekle
   - Railway otomatik `backend/Procfile` dosyasını kullanır, deploy sonunda bir `https://...railway.app` adresi verir

2. **Frontend → Vercel.com**
   - Vercel'de "New Project" → bu repoyu seç
   - Root Directory: `frontend/client`
   - Framework: Vite (otomatik algılanır)
   - Environment Variable: `VITE_API_URL` = Railway'den aldığın backend adresi
   - Deploy sonunda `https://...vercel.app` linki verir — bu, paylaşacağın link

**Not:** Backend'deki SQLite veritabanı Railway'de kalıcı değildir; her yeni deploy'da taranan veriler sıfırlanır. Bu demo/MVP aşaması için sorun değil.

## Proje Yapısı

```
ai_asistan/
├── backend/
│   ├── main.py                    # FastAPI sunucu
│   ├── modules/scanner/           # Google Places tarayıcı
│   └── database/                  # SQLite veritabanı katmanı
├── frontend/client/src/
│   ├── App.jsx                    # İşletme tarayıcı ekranı
│   └── Dashboard.jsx              # Müşteri dashboard ekranı
├── database/                      # businesses.db buraya oluşur
└── .env.example                   # API anahtarı şablonu
```
