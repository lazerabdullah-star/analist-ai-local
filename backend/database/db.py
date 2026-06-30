import sqlite3
import json
import os

if os.environ.get("RAILWAY_ENVIRONMENT"):
    DB_PATH = "/tmp/businesses.db"
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "../../database/businesses.db")
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Veritabanı tablolarını oluştur (ilk çalıştırmada)"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS businesses (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            website TEXT,
            rating REAL,
            review_count INTEGER DEFAULT 0,
            photo_count INTEGER DEFAULT 0,
            has_hours INTEGER DEFAULT 0,
            completeness_score INTEGER DEFAULT 0,
            missing_items TEXT DEFAULT '[]',
            priority TEXT,
            city TEXT,
            category TEXT,
            scanned_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

def save_business(business: dict):
    """İşletmeyi veritabanına kaydet (varsa güncelle)"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR REPLACE INTO businesses
        (id, name, address, phone, website, rating, review_count, photo_count,
         has_hours, completeness_score, missing_items, priority, city, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        business["id"],
        business["name"],
        business.get("address"),
        business.get("phone"),
        business.get("website"),
        business.get("rating"),
        business.get("review_count", 0),
        business.get("photo_count", 0),
        1 if business.get("has_hours") else 0,
        business.get("completeness_score", 0),
        json.dumps(business.get("missing_items", []), ensure_ascii=False),
        business.get("priority"),
        business.get("city"),
        business.get("category")
    ))

    conn.commit()
    conn.close()

def get_all_businesses(city=None, category=None, max_score=None):
    """Filtrelenmiş işletme listesi getir"""
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM businesses WHERE 1=1"
    params = []

    if city:
        query += " AND city = ?"
        params.append(city)
    if category:
        query += " AND category = ?"
        params.append(category)
    if max_score is not None:
        query += " AND completeness_score <= ?"
        params.append(max_score)

    query += " ORDER BY completeness_score ASC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        item = dict(row)
        item["missing_items"] = json.loads(item["missing_items"])
        item["has_hours"] = bool(item["has_hours"])
        result.append(item)

    return result

def get_stats():
    """Özet istatistikler"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM businesses")
    total = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as high FROM businesses WHERE priority = 'YÜKSEK'")
    high = cursor.fetchone()["high"]

    cursor.execute("SELECT COUNT(*) as mid FROM businesses WHERE priority = 'ORTA'")
    mid = cursor.fetchone()["mid"]

    cursor.execute("SELECT AVG(completeness_score) as avg_score FROM businesses")
    avg = cursor.fetchone()["avg_score"]

    conn.close()

    return {
        "total_businesses": total,
        "high_priority_leads": high,
        "mid_priority_leads": mid,
        "average_score": round(avg, 1) if avg else 0
    }
