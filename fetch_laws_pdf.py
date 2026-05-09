"""
Türk Kanunları PDF'den Çekici
mevzuat.gov.tr PDF'lerini indirir, metin çıkarır, JSON'a dönüştürür.

Kurulum:
  pip install requests pymupdf

Çalıştır:
  python fetch_laws_pdf.py
"""

import requests
import json
import re
import os

# pymupdf (fitz) kütüphanesi
try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF kurulu değil. Şunu çalıştır:")
    print("  pip install pymupdf")
    exit(1)

# =========================================================
# KANUNLAR VE PDF LİNKLERİ
# =========================================================
LAWS = [
    {
        "name": "Türk Ceza Kanunu",
        "no": "5237",
        "short": "TCK",
        "pdf_url": "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5237.pdf",
    },
    {
        "name": "Türk Medeni Kanunu",
        "no": "4721",
        "short": "TMK",
        "pdf_url": "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4721.pdf",
    },
    {
        "name": "Türk Borçlar Kanunu",
        "no": "6098",
        "short": "TBK",
        "pdf_url": "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6098.pdf",
    },
    {
        "name": "Hukuk Muhakemeleri Kanunu",
        "no": "6100",
        "short": "HMK",
        "pdf_url": "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6100.pdf",
    },
    {
        "name": "Ceza Muhakemesi Kanunu",
        "no": "5271",
        "short": "CMK",
        "pdf_url": "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5271.pdf",
    },
    {
        "name": "İş Kanunu",
        "no": "4857",
        "short": "IK",
        "pdf_url": "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4857.pdf",
    },
    {
        "name": "Kişisel Verilerin Korunması Kanunu",
        "no": "6698",
        "short": "KVKK",
        "pdf_url": "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6698.pdf",
    },
    {
        "name": "Türk Ticaret Kanunu",
        "no": "6102",
        "short": "TTK",
        "pdf_url": "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6102.pdf",
    },
    {
        "name": "İcra ve İflas Kanunu",
        "no": "2004",
        "short": "IIK",
        "pdf_url": "https://www.mevzuat.gov.tr/mevzuatmetin/1.3.2004.pdf",
    },
    {
        "name": "Vergi Usul Kanunu",
        "no": "213",
        "short": "VUK",
        "pdf_url": "https://www.mevzuat.gov.tr/mevzuatmetin/1.4.213.pdf",
    },
    {
        "name": "Karayolları Trafik Kanunu",
        "no": "2918",
        "short": "KTK",
        "pdf_url": "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2918.pdf",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.mevzuat.gov.tr/",
}

OUTPUT_DIR = "data"
PDF_DIR = os.path.join(OUTPUT_DIR, "pdfs")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PDF_DIR, exist_ok=True)


# =========================================================
# PDF İNDİR
# =========================================================
def download_pdf(law):
    pdf_path = os.path.join(PDF_DIR, f"{law['short'].lower()}.pdf")

    # Zaten indirilmişse atla
    if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 10000:
        print(f"  PDF zaten var: {pdf_path}")
        return pdf_path

    print(f"  PDF indiriliyor: {law['pdf_url']}")
    try:
        r = requests.get(law["pdf_url"], headers=HEADERS, timeout=60, stream=True)
        if r.status_code == 200:
            with open(pdf_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
            size = os.path.getsize(pdf_path)
            print(f"  İndirildi: {size // 1024} KB")
            return pdf_path
        else:
            print(f"  HTTP {r.status_code} — PDF indirilemedi")
            return None
    except Exception as e:
        print(f"  Hata: {e}")
        return None


# =========================================================
# PDF'DEN METİN ÇIKAR
# =========================================================
def extract_text_from_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"  PDF okuma hatası: {e}")
        return None


# =========================================================
# MADDELERİ PARSE ET
# =========================================================
def parse_articles(text, law):
    # Metni temizle
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()

    articles = []
    seen = set()

    # Pattern 1: "Madde 86 –" veya "MADDE 86 –" veya "Madde 86-"
    pattern = r'(?:MADDE|Madde)\s+(\d+)\s*[–\-—\.]\s*(.*?)(?=(?:MADDE|Madde)\s+\d+\s*[–\-—\.]|GEÇİCİ MADDE|EK MADDE|$)'
    matches = list(re.finditer(pattern, text, re.DOTALL | re.IGNORECASE))

    if not matches:
        # Pattern 2: "Madde 86." (noktalı format)
        pattern2 = r'(?:MADDE|Madde)\s+(\d+)\.(.*?)(?=(?:MADDE|Madde)\s+\d+\.|GEÇİCİ MADDE|EK MADDE|$)'
        matches = list(re.finditer(pattern2, text, re.DOTALL | re.IGNORECASE))

    if not matches:
        # Pattern 3: sadece "86 –" veya "Md. 86"
        pattern3 = r'\bMd\.\s*(\d+)\s*(.*?)(?=\bMd\.\s*\d+|$)'
        matches = list(re.finditer(pattern3, text, re.DOTALL | re.IGNORECASE))

    for match in matches:
        no = match.group(1).strip()
        content = match.group(2).strip()
        content = re.sub(r'\s+', ' ', content).strip()

        if not content or len(content) < 15:
            continue

        # Max 2000 karakter (çok uzun maddeleri kırp)
        if len(content) > 2000:
            content = content[:2000] + "..."

        key = f"{no}-{content[:40]}"
        if key in seen:
            continue
        seen.add(key)

        articles.append({
            "id": no,
            "title": f"Madde {no}",
            "content": content,
        })

    # Geçici maddeler
    gecici = re.finditer(
        r'GEÇİCİ MADDE\s+(\d+)\s*[–\-—]\s*(.*?)(?=GEÇİCİ MADDE\s+\d+|MADDE\s+\d+|$)',
        text, re.DOTALL | re.IGNORECASE
    )
    for match in gecici:
        no = f"Geçici-{match.group(1).strip()}"
        content = re.sub(r'\s+', ' ', match.group(2)).strip()
        if content and len(content) > 15:
            if len(content) > 2000:
                content = content[:2000] + "..."
            articles.append({
                "id": no,
                "title": f"Geçici Madde {match.group(1)}",
                "content": content,
            })

    return articles


# =========================================================
# KAYDET
# =========================================================
def save_law(law, articles):
    output = {
        "law_name": law["name"],
        "law_no": law["no"],
        "law_short": law["short"],
        "url": law["pdf_url"],
        "article_count": len(articles),
        "articles": articles,
    }

    filename = os.path.join(OUTPUT_DIR, f"{law['short'].lower()}.json")
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    return filename


# =========================================================
# DEBUG — parse edilemeyen PDF için örnek metin göster
# =========================================================
def debug_text(text, law_short):
    debug_path = os.path.join(PDF_DIR, f"{law_short.lower()}_debug.txt")
    with open(debug_path, "w", encoding="utf-8") as f:
        f.write(text[:5000])
    print(f"  Debug metin kaydedildi: {debug_path}")
    print(f"  İlk 500 karakter: {text[:500]}")


# =========================================================
# ANA SCRIPT
# =========================================================
def main():
    print("=" * 60)
    print("TÜRK KANUNLARI PDF ÇEKME ARACI")
    print("=" * 60)
    print()

    results = []

    for law in LAWS:
        print(f"\n[{law['short']}] {law['name']} ({law['no']})")

        # PDF indir
        pdf_path = download_pdf(law)
        if not pdf_path:
            results.append({"law": law["short"], "status": "download_failed", "articles": 0})
            continue

        # Metin çıkar
        text = extract_text_from_pdf(pdf_path)
        if not text or len(text) < 100:
            print(f"  PDF'den metin çıkarılamadı")
            results.append({"law": law["short"], "status": "text_failed", "articles": 0})
            continue

        print(f"  Metin uzunluğu: {len(text)} karakter")

        # Maddeleri parse et
        articles = parse_articles(text, law)

        if not articles:
            print(f"  ⚠️  Madde parse edilemedi — debug dosyası oluşturuluyor")
            debug_text(text, law["short"])
            results.append({"law": law["short"], "status": "parse_failed", "articles": 0})
            continue

        # Kaydet
        filename = save_law(law, articles)
        print(f"  ✅ {len(articles)} madde → {filename}")
        results.append({"law": law["short"], "status": "ok", "articles": len(articles)})

    # Özet
    print()
    print("=" * 60)
    print("ÖZET")
    print("=" * 60)
    total = 0
    for r in results:
        icon = "✅" if r["status"] == "ok" else "❌"
        print(f"  {icon} {r['law']}: {r['articles']} madde ({r['status']})")
        total += r["articles"]

    ok_count = len([r for r in results if r["status"] == "ok"])
    print(f"\nToplam: {total} madde, {ok_count}/{len(LAWS)} kanun başarılı")

    if ok_count < len(LAWS):
        print("\n⚠️  Bazı kanunlar parse edilemedi.")
        print("   data/pdfs/ klasöründeki *_debug.txt dosyalarına bak.")
        print("   Bu dosyaları bana gönder, parse'ı düzeltelim.")


if __name__ == "__main__":
    main()
