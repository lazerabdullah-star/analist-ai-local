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
