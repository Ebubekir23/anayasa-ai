"""
mevzuat.gov.tr HTML yapısını incele
Çalıştır: python debug_law.py
"""

import requests
from bs4 import BeautifulSoup
import re

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    "Referer": "https://www.mevzuat.gov.tr/",
}

# TCK çek
url = "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=5237&MevzuatTur=1&MevzuatTertip=5"
print(f"URL: {url}")
r = requests.get(url, headers=HEADERS, timeout=30)
print(f"Status: {r.status_code}")
print(f"Content-Type: {r.headers.get('Content-Type', 'unknown')}")
print(f"HTML boyutu: {len(r.text)} karakter")
print()

# Ham HTML ilk 3000 karakter
print("=== HAM HTML (ilk 3000 karakter) ===")
print(r.text[:3000])
print()

# BeautifulSoup ile parse et
soup = BeautifulSoup(r.text, "html.parser")

# Tüm text
full_text = soup.get_text(separator="\n")
print("=== FULL TEXT (ilk 2000 karakter) ===")
print(full_text[:2000])
print()

# "Madde" kelimesini ara
print("=== 'Madde' geçen satırlar (ilk 20) ===")
lines = [l.strip() for l in full_text.split("\n") if "adde" in l and l.strip()]
for line in lines[:20]:
    print(repr(line))
