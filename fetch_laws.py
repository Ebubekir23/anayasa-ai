"""
Türk Kanunları Çekici
mevzuat.gov.tr'den temel kanunları çekip JSON formatında kaydeder.

Kullanım:
  pip install requests beautifulsoup4
  python fetch_laws.py

Çıktı: data/ klasörüne her kanun için ayrı JSON dosyası
"""

import requests
import json
import re
import time
import os
from bs4 import BeautifulSoup

# =========================================================
# ÇEKILECEK KANUNLAR
# =========================================================
LAWS = [
    {"name": "Türk Ceza Kanunu",                    "no": "5237", "tertip": "5", "short": "TCK"},
    {"name": "Türk Medeni Kanunu",                   "no": "4721", "tertip": "5", "short": "TMK"},
    {"name": "Türk Borçlar Kanunu",                  "no": "6098", "tertip": "5", "short": "TBK"},
    {"name": "Hukuk Muhakemeleri Kanunu",             "no": "6100", "tertip": "5", "short": "HMK"},
    {"name": "Ceza Muhakemesi Kanunu",                "no": "5271", "tertip": "5", "short": "CMK"},
    {"name": "İş Kanunu",                            "no": "4857", "tertip": "5", "short": "IK"},
    {"name": "Kişisel Verilerin Korunması Kanunu",   "no": "6698", "tertip": "5", "short": "KVKK"},
    {"name": "Türk Ticaret Kanunu",                  "no": "6102", "tertip": "5", "short": "TTK"},
    {"name": "İcra ve İflas Kanunu",                 "no": "2004", "tertip": "3", "short": "IIK"},
    {"name": "Vergi Usul Kanunu",                    "no": "213",  "tertip": "4", "short": "VUK"},
    {"name": "Karayolları Trafik Kanunu",             "no": "2918", "tertip": "5", "short": "KTK"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    "Referer": "https://www.mevzuat.gov.tr/",
    "Connection": "keep-alive",
}

OUTPUT_DIR = "data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# =========================================================
# YARDIMCI FONKSİYONLAR
# =========================================================
def fetch_law_html(law_no, tertip):
    """mevzuat.gov.tr'den kanun HTML'ini çek"""
    url = f"https://www.mevzuat.gov.tr/mevzuat?MevzuatNo={law_no}&MevzuatTur=1&MevzuatTertip={tertip}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        if r.status_code == 200:
            return r.text
        print(f"  HTTP {r.status_code} — alternatif URL deneniyor...")
    except Exception as e:
        print(f"  Bağlantı hatası: {e}")

    # Alternatif URL formatı
    url2 = f"https://www.mevzuat.gov.tr/MevzuatMetin/{tertip}.{law_no}.pdf"
    try:
        # PDF yerine text versiyonu
        url3 = f"https://www.mevzuat.gov.tr/mevzuatmetin/{tertip}.{law_no}.htm"
        r = requests.get(url3, headers=HEADERS, timeout=30)
        if r.status_code == 200:
            return r.text
    except:
        pass

    return None


def clean_text(text):
    """Metni temizle"""
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    return text


def parse_articles(html, law):
    """HTML'den maddeleri parse et"""
    soup = BeautifulSoup(html, "html.parser")

    # Script ve style taglerini kaldır
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()

    full_text = soup.get_text(separator="\n")
    full_text = clean_text(full_text)

    # Maddeleri bul — "Madde X –" veya "MADDE X –" formatı
    pattern = r'(?:MADDE|Madde)\s+(\d+)\s*[–\-—]\s*(.*?)(?=(?:MADDE|Madde)\s+\d+\s*[–\-—]|EK MADDE|GEÇİCİ MADDE|$)'
    matches = re.finditer(pattern, full_text, re.DOTALL | re.IGNORECASE)

    articles = []
    seen = set()

    for match in matches:
        no = match.group(1).strip()
        content = clean_text(match.group(2))

        if not content or len(content) < 20:
            continue

        key = f"{no}-{content[:50]}"
        if key in seen:
            continue
        seen.add(key)

        articles.append({
            "id": no,
            "title": f"Madde {no}",
            "content": content,
        })

    # Geçici maddeler
    gecici_pattern = r'GEÇİCİ MADDE\s+(\d+)\s*[–\-—]\s*(.*?)(?=(?:MADDE|Madde|GEÇİCİ MADDE)\s+\d+|$)'
    gecici_matches = re.finditer(gecici_pattern, full_text, re.DOTALL | re.IGNORECASE)

    for match in gecici_matches:
        no = f"Geçici-{match.group(1).strip()}"
        content = clean_text(match.group(2))
        if content and len(content) > 20:
            articles.append({
                "id": no,
                "title": f"Geçici Madde {match.group(1)}",
                "content": content,
            })

    return articles


def save_law(law, articles):
    """Kanunu JSON olarak kaydet"""
    output = {
        "law_name": law["name"],
        "law_no": law["no"],
        "law_short": law["short"],
        "url": f"https://www.mevzuat.gov.tr/mevzuatmetin/1.{law['tertip']}.{law['no']}.pdf",
        "article_count": len(articles),
        "articles": articles,
    }

    filename = os.path.join(OUTPUT_DIR, f"{law['short'].lower()}.json")
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    return filename


# =========================================================
# ANA SCRIPT
# =========================================================
def main():
    print("=" * 60)
    print("TÜRK KANUNLARI VERİ ÇEKME ARACI")
    print("=" * 60)
    print()

    results = []

    for law in LAWS:
        print(f"[{law['short']}] {law['name']} ({law['no']}) çekiliyor...")

        html = fetch_law_html(law["no"], law["tertip"])

        if not html:
            print(f"  ❌ HTML alınamadı, atlanıyor.")
            results.append({"law": law["short"], "status": "failed", "articles": 0})
            continue

        articles = parse_articles(html, law)

        if not articles:
            print(f"  ⚠️  Madde parse edilemedi (HTML geldi ama madde bulunamadı)")
            results.append({"law": law["short"], "status": "no_articles", "articles": 0})
            # Yine de kaydet (debug için)
            save_law(law, [])
            time.sleep(2)
            continue

        filename = save_law(law, articles)
        print(f"  ✅ {len(articles)} madde → {filename}")
        results.append({"law": law["short"], "status": "ok", "articles": len(articles)})

        # Rate limit — sunucuyu bunaltma
        time.sleep(2)

    # Özet
    print()
    print("=" * 60)
    print("ÖZET")
    print("=" * 60)
    total = 0
    for r in results:
        icon = "✅" if r["status"] == "ok" else "❌"
        print(f"  {icon} {r['law']}: {r['articles']} madde")
        total += r["articles"]
    print(f"\nToplam: {total} madde, {len([r for r in results if r['status'] == 'ok'])} kanun")
    print()
    print("Sonraki adım: route.js'i güncelle (multi-law JSON okuyacak şekilde)")


if __name__ == "__main__":
    main()
