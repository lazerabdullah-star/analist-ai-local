import secrets
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

from modules.scanner.google_places import search_businesses
from modules.scanner.completeness import check_completeness
from database.db import init_db, save_business, get_all_businesses, get_stats

load_dotenv()

gemini_key = os.getenv("GEMINI_API_KEY")
places_key = os.getenv("GOOGLE_PLACES_API_KEY")
APP_USERNAME = os.getenv("APP_USERNAME", "atoprak")
APP_PASSWORD = os.getenv("APP_PASSWORD", "atoprak2121")

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

app = FastAPI(title="Analist AI Local", lifespan=lifespan, dependencies=[Depends(verify_user)])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mevcut: Yorum Analizi ---

class CommentRequest(BaseModel):
    comment: str

@app.post("/analyze-comment")
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

@app.post("/scan")
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

@app.get("/businesses")
async def list_businesses(city: str = None, category: str = None, max_score: int = None):
    """Taranan tüm işletmeleri listele"""
    businesses = get_all_businesses(city=city, category=category, max_score=max_score)
    return {
        "count": len(businesses),
        "businesses": businesses
    }

@app.get("/businesses/leads")
async def get_leads():
    """Satış için en iyi adayları getir (puanı 60'ın altındakiler)"""
    businesses = get_all_businesses(max_score=60)
    return {
        "count": len(businesses),
        "message": f"{len(businesses)} potansiyel müşteri adayı bulundu.",
        "businesses": businesses
    }

@app.get("/stats")
async def stats():
    """Genel istatistikler"""
    return get_stats()
