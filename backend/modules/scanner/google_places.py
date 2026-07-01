import requests

PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText"

FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.nationalPhoneNumber",
    "places.rating",
    "places.userRatingCount",
    "places.photos",
    "places.regularOpeningHours",
    "places.websiteUri",
    "places.businessStatus",
    "places.location"
])

def search_businesses(city: str, category: str, api_key: str, max_results: int = 20) -> list:
    """Google Places API ile şehir ve kategori bazında işletme ara"""

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK
    }

    body = {
        "textQuery": f"{category} {city}",
        "languageCode": "tr",
        "maxResultCount": min(max_results, 20)
    }

    try:
        response = requests.post(PLACES_API_URL, json=body, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("places", [])
    except requests.exceptions.RequestException as e:
        print(f"Google Places API hatası: {e}")
        return []

def find_business_by_name(name: str, city: str, api_key: str):
    """Bir işletmeyi ismiyle (ve varsa şehriyle) arayıp en iyi eşleşen tek kaydı döner"""
    results = search_businesses(city=city or "", category=name, api_key=api_key, max_results=1)
    return results[0] if results else None

def find_top_competitor(category: str, city: str, exclude_name: str, api_key: str):
    """Aynı kategori+şehirde, kendi işletmesi hariç en öne çıkan rakibi döner"""
    results = search_businesses(city=city, category=category, api_key=api_key, max_results=5)
    exclude = exclude_name.strip().lower()
    for place in results:
        aday_ad = place.get("displayName", {}).get("text", "").strip().lower()
        if aday_ad and exclude not in aday_ad and aday_ad not in exclude:
            return place
    return None
