import sqlite3
import json
import os
import secrets

VOLUME_DIR = os.environ.get("RAILWAY_VOLUME_MOUNT_PATH")
if VOLUME_DIR:
    DB_PATH = os.path.join(VOLUME_DIR, "businesses.db")
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

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            business_name TEXT,
            phone TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer_sessions (
            token TEXT PRIMARY KEY,
            customer_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            value TEXT,
            status TEXT DEFAULT 'bekliyor',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    for kolon in [
        "google_connected INTEGER DEFAULT 0",
        "google_email TEXT",
        "google_account_name TEXT",
        "google_access_token TEXT",
        "google_refresh_token TEXT",
        "google_token_expiry TEXT",
        "category TEXT",
        "city TEXT",
        "google_account_id TEXT",
    ]:
        try:
            cursor.execute(f"ALTER TABLE customers ADD COLUMN {kolon}")
        except sqlite3.OperationalError:
            pass

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

# --- Müşteri Hesapları ---

def create_customer(email: str, password_hash: str, salt: str, business_name: str, phone: str = None, category: str = None, city: str = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO customers (email, password_hash, salt, business_name, phone, category, city)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (email, password_hash, salt, business_name, phone, category, city))
    conn.commit()
    conn.close()

def get_customer_by_email(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_customers():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, business_name, phone, category, city, created_at,
               google_connected, google_email, google_account_name
        FROM customers ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_customer(customer_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM customer_requests WHERE customer_id = ?", (customer_id,))
    cursor.execute("DELETE FROM customer_sessions WHERE customer_id = ?", (customer_id,))
    cursor.execute("DELETE FROM customers WHERE id = ?", (customer_id,))
    conn.commit()
    conn.close()

def reset_customer_password(customer_id: int, password_hash: str, salt: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE customers SET password_hash = ?, salt = ? WHERE id = ?", (password_hash, salt, customer_id))
    conn.commit()
    conn.close()

def create_session(customer_id: int) -> str:
    token = secrets.token_urlsafe(32)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO customer_sessions (token, customer_id) VALUES (?, ?)", (token, customer_id))
    conn.commit()
    conn.close()
    return token

def get_customer_by_token(token: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT customers.* FROM customer_sessions
        JOIN customers ON customers.id = customer_sessions.customer_id
        WHERE customer_sessions.token = ?
    """, (token,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# --- Google İşletme Profili Bağlantısı ---

def save_google_tokens(customer_id: int, access_token: str, refresh_token: str, expiry_iso: str, email: str, account_name: str = None, account_id: str = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE customers SET
            google_connected = 1,
            google_email = ?,
            google_account_name = ?,
            google_account_id = ?,
            google_access_token = ?,
            google_refresh_token = ?,
            google_token_expiry = ?
        WHERE id = ?
    """, (email, account_name, account_id, access_token, refresh_token, expiry_iso, customer_id))
    conn.commit()
    conn.close()

def update_google_access_token(customer_id: int, access_token: str, expiry_iso: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE customers SET google_access_token = ?, google_token_expiry = ? WHERE id = ?
    """, (access_token, expiry_iso, customer_id))
    conn.commit()
    conn.close()

def clear_google_tokens(customer_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE customers SET
            google_connected = 0,
            google_email = NULL,
            google_account_name = NULL,
            google_account_id = NULL,
            google_access_token = NULL,
            google_refresh_token = NULL,
            google_token_expiry = NULL
        WHERE id = ?
    """, (customer_id,))
    conn.commit()
    conn.close()

# --- Müşteri Talepleri (fotoğraf / web sitesi / hizmet ekleme istekleri) ---

def create_customer_request(customer_id: int, type: str, value: str = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO customer_requests (customer_id, type, value)
        VALUES (?, ?, ?)
    """, (customer_id, type, value))
    conn.commit()
    conn.close()

def get_all_customer_requests():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT customer_requests.*, customers.business_name, customers.email
        FROM customer_requests
        JOIN customers ON customers.id = customer_requests.customer_id
        ORDER BY customer_requests.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
