def check_completeness(place: dict) -> dict:
    """
    Google Places verisine bakarak işletme profilinin
    ne kadar eksiksiz olduğunu puanlar (0-100).
    Düşük puan = çok eksik = satış için iyi aday.
    """

    score = 0
    missing = []

    # Telefon (20 puan)
    phone = place.get("nationalPhoneNumber")
    if phone:
        score += 20
    else:
        missing.append("Telefon numarası eksik")

    # Adres (15 puan)
    address = place.get("formattedAddress")
    if address:
        score += 15
    else:
        missing.append("Adres eksik")

    # Fotoğraf (20 puan)
    photos = place.get("photos", [])
    photo_count = len(photos)
    if photo_count >= 5:
        score += 20
    elif photo_count >= 1:
        score += 10
        missing.append(f"Az fotoğraf var ({photo_count} adet, en az 5 önerilir)")
    else:
        missing.append("Hiç fotoğraf yok")

    # Çalışma saatleri (20 puan)
    hours = place.get("regularOpeningHours")
    if hours:
        score += 20
    else:
        missing.append("Çalışma saatleri girilmemiş")

    # Web sitesi (10 puan)
    website = place.get("websiteUri")
    if website:
        score += 10
    else:
        missing.append("Web sitesi yok")

    # Yorum sayısı (15 puan)
    review_count = place.get("userRatingCount", 0)
    if review_count >= 20:
        score += 15
    elif review_count >= 5:
        score += 8
        missing.append(f"Az yorum var ({review_count} adet)")
    else:
        missing.append(f"Çok az yorum var ({review_count} adet)")

    # Öncelik seviyesi: düşük puan = yüksek öncelik (satış için daha iyi aday)
    if score < 40:
        priority = "YÜKSEK"
    elif score < 70:
        priority = "ORTA"
    else:
        priority = "DÜŞÜK"

    return {
        "score": score,
        "missing": missing,
        "photo_count": photo_count,
        "has_hours": bool(hours),
        "priority": priority
    }
