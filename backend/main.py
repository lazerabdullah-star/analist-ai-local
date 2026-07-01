import secrets
import uuid
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

from modules.scanner.google_places import search_businesses
from modules.scanner.completeness import check_completeness
from modules.auth.security import hash_password, verify_password
from database.db import (
    init_db, save_business, get_all_businesses, get_stats,
    create_customer, get_customer_by_email, create_session, get_customer_by_token,
    create_customer_request, get_all_customer_requests
)

load_dotenv()

gemini_key = os.getenv("GEMINI_API_KEY")
places_key = os.getenv("GOOGLE_PLACES_API_KEY")
APP_USERNAME = os.getenv("APP_USERNAME", "atoprak")
APP_PASSWORD = os.getenv("APP_PASSWORD", "atoprak2121")

UPLOAD_DIR = "/tmp/uploads" if os.environ.get("RAILWAY_ENVIRONMENT") else os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

genai.configure(api_key=gemini_key)

security = HTTPBasic()

def verify_user(credentials: HTTPBasicCredentials = Depends(security)):
    dogru_kullanici = secrets.compare_digest(credentials.username, APP_USERNAME)
    dogru_sifre = secrets.compare_digest(credentials.password, APP_PASSWORD)
    if not (dogru_kullanici and dogru_sifre):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı veya şifre hatalı",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield

def verify_customer(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Giriş gerekli")
    token = authorization.split(" ", 1)[1]
    customer = get_customer_by_token(token)
    if not customer:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Oturum geçersiz, tekrar giriş yapın")
    return customer

app = FastAPI(title="Analist AI Local", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- Mevcut: Yorum Analizi ---

class CommentRequest(BaseModel):
    comment: str

@app.post("/analyze-comment", dependencies=[Depends(verify_user)])
async def analyze(data: CommentRequest):
    try:
        model = genai.GenerativeModel('models/gemini-1.5-flash')
        prompt = f"Müşteri yorumu: '{data.comment}'. Bu yoruma kısa, profesyonel bir cevap hazırla."
        response = model.generate_content(prompt)
        return {"analysis": response.text}
    except Exception as e:
        return {"analysis": f"AI Analizi başarısız oldu: {str(e)}"}

# --- Yeni: İşletme Tarama ---

class ScanRequest(BaseModel):
    city: str
    category: str
    max_results: int = 20

@app.post("/scan", dependencies=[Depends(verify_user)])
async def scan_businesses(data: ScanRequest):
    """Google'ı tara, işletmeleri bul, eksiklerini puanla ve kaydet"""

    places = search_businesses(data.city, data.category, places_key, data.max_results)

    if not places:
        return {
            "success": False,
            "message": "İşletme bulunamadı. Şehir veya kategori adını kontrol edin.",
            "count": 0,
            "businesses": []
        }

    saved = []
    for place in places:
        completeness = check_completeness(place)

        business = {
            "id": place.get("id"),
            "name": place.get("displayName", {}).get("text", "İsimsiz"),
            "address": place.get("formattedAddress"),
            "phone": place.get("nationalPhoneNumber"),
            "website": place.get("websiteUri"),
            "rating": place.get("rating"),
            "review_count": place.get("userRatingCount", 0),
            "photo_count": completeness["photo_count"],
            "has_hours": completeness["has_hours"],
            "completeness_score": completeness["score"],
            "missing_items": completeness["missing"],
            "priority": completeness["priority"],
            "city": data.city,
            "category": data.category
        }

        save_business(business)
        saved.append(business)

    return {
        "success": True,
        "message": f"{len(saved)} işletme tarandı ve kaydedildi.",
        "count": len(saved),
        "businesses": saved
    }

@app.get("/businesses", dependencies=[Depends(verify_user)])
async def list_businesses(city: str = None, category: str = None, max_score: int = None):
    """Taranan tüm işletmeleri listele"""
    businesses = get_all_businesses(city=city, category=category, max_score=max_score)
    return {
        "count": len(businesses),
        "businesses": businesses
    }

@app.get("/businesses/leads", dependencies=[Depends(verify_user)])
async def get_leads():
    """Satış için en iyi adayları getir (puanı 60'ın altındakiler)"""
    businesses = get_all_businesses(max_score=60)
    return {
        "count": len(businesses),
        "message": f"{len(businesses)} potansiyel müşteri adayı bulundu.",
        "businesses": businesses
    }

@app.get("/stats", dependencies=[Depends(verify_user)])
async def stats():
    """Genel istatistikler"""
    return get_stats()

# --- Müşteri Hesapları (Admin oluşturur) ---

class MusteriEkleRequest(BaseModel):
    email: str
    password: str
    business_name: str
    phone: str = None

@app.post("/admin/musteriler", dependencies=[Depends(verify_user)])
async def musteri_ekle(data: MusteriEkleRequest):
    """Admin, yeni bir müşteri hesabı (email + şifre) oluşturur"""
    if get_customer_by_email(data.email):
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")

    salt, pw_hash = hash_password(data.password)
    create_customer(data.email, pw_hash, salt, data.business_name, data.phone)
    return {"success": True, "message": f"{data.business_name} için müşteri hesabı oluşturuldu"}

# --- Müşteri Girişi ve Paneli ---

class MusteriGirisRequest(BaseModel):
    email: str
    password: str

@app.post("/musteri/giris")
async def musteri_giris(data: MusteriGirisRequest):
    """Müşteri kendi email/şifresiyle giriş yapar"""
    customer = get_customer_by_email(data.email)
    if not customer or not verify_password(data.password, customer["salt"], customer["password_hash"]):
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")

    token = create_session(customer["id"])
    return {
        "token": token,
        "business_name": customer["business_name"],
        "phone": customer["phone"],
        "email": customer["email"]
    }

@app.get("/musteri/panel")
async def musteri_panel(customer: dict = Depends(verify_customer)):
    """Giriş yapmış müşterinin kendi bilgilerini getirir"""
    return {
        "business_name": customer["business_name"],
        "phone": customer["phone"],
        "email": customer["email"]
    }

# --- Müşteri Talepleri (fotoğraf / web sitesi / hizmet ekleme) ---

class MusteriIstekRequest(BaseModel):
    type: str
    value: str

@app.post("/musteri/istek")
async def musteri_istek(data: MusteriIstekRequest, customer: dict = Depends(verify_customer)):
    """Müşteri, web sitesi/hizmet gibi metin tabanlı bir güncelleme talebi gönderir"""
    create_customer_request(customer["id"], data.type, data.value)
    return {"success": True, "message": "Talebiniz alındı"}

@app.post("/musteri/istek/foto")
async def musteri_foto_istek(file: UploadFile = File(...), customer: dict = Depends(verify_customer)):
    """Müşteri bir fotoğraf yükleme talebi gönderir"""
    uzanti = os.path.splitext(file.filename)[1]
    dosya_adi = f"{uuid.uuid4().hex}{uzanti}"
    with open(os.path.join(UPLOAD_DIR, dosya_adi), "wb") as f:
        f.write(await file.read())

    create_customer_request(customer["id"], "foto", dosya_adi)
    return {"success": True, "message": "Fotoğraf alındı"}

@app.get("/admin/istekler", dependencies=[Depends(verify_user)])
async def admin_istekler():
    """Admin, müşterilerden gelen tüm güncelleme taleplerini görür"""
    return {"requests": get_all_customer_requests()}
