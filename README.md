# ⚖️ HUKUK·AI — Türk Hukuku Yapay Zeka Asistanı

**GİTEK Yapay Zeka Etkinliği** kapsamında geliştirilen, RAG (Retrieval-Augmented Generation) mimarisi tabanlı yapay zeka destekli hukuk asistanı.

## 🎯 Proje Amacı

Türk vatandaşlarının hukuki bilgiye kolay, hızlı ve güvenilir şekilde erişimini sağlamak. Sistem, kullanıcı sorularını **Anayasa ve 11 temel Türk kanunu** veritabanında arayarak gerçek kanun maddelerine dayalı yanıtlar üretir.

## 🏗️ Mimari

```
Kullanıcı Sorusu
       │
       ▼
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  1. VERİ     │     │  2. RETRIEVAL    │     │  3. GENERATION   │
│  KATMANI     │────▶│  KATMANI         │────▶│  KATMANI         │
│              │     │                  │     │                  │
│ 12 kaynak    │     │ TF-ağırlıklı     │     │ Claude Sonnet    │
│ 6.033 madde  │     │ keyword arama    │     │ 4.5 API          │
│ JSON format  │     │ Top-5 madde      │     │ Kaynaklı cevap   │
└──────────────┘     └──────────────────┘     └──────────────────┘
```

## 📚 Veritabanı Kapsamı

| Kaynak | Kısaltma | Kanun No |
|--------|----------|----------|
| Türkiye Cumhuriyeti Anayasası | Anayasa | 2709 |
| Türk Ceza Kanunu | TCK | 5237 |
| Türk Medeni Kanunu | TMK | 4721 |
| Türk Borçlar Kanunu | TBK | 6098 |
| Hukuk Muhakemeleri Kanunu | HMK | 6100 |
| Ceza Muhakemesi Kanunu | CMK | 5271 |
| İş Kanunu | İK | 4857 |
| Kişisel Verilerin Korunması Kanunu | KVKK | 6698 |
| Türk Ticaret Kanunu | TTK | 6102 |
| İcra ve İflas Kanunu | İİK | 2004 |
| Vergi Usul Kanunu | VUK | 213 |
| Karayolları Trafik Kanunu | KTK | 2918 |

## ✨ Özellikler

- **📖 Soru-Cevap Modu**: Hukuki sorulara kanun maddelerine dayalı yanıtlar
- **📝 Dilekçe Modu**: Hukuki senaryoya göre resmi dilekçe taslağı oluşturma
- **🔗 Tıklanabilir Kaynak Atıfları**: Her yanıttaki `[TCK Madde 86]` gibi atıflar mevzuat.gov.tr PDF'lerine bağlantı içerir
- **🌐 İki Dilli Destek**: Türkçe ve İngilizce arayüz + yanıtlar
- **🛡️ Halüsinasyon Koruması**: Model yalnızca veritabanındaki maddelere dayanır
- **🌗 Karanlık/Aydınlık Tema**: Kullanıcı tercihine göre tema değişimi
- **⚡ Rate Limiting**: Aşırı kullanıma karşı koruma

## 🛠️ Teknoloji Yığını

| Teknoloji | Sürüm | Amaç |
|-----------|-------|------|
| Next.js | 14.2.35 | Full-stack web framework |
| React | 18.x | UI bileşenleri |
| Anthropic Claude SDK | 0.91.1 | LLM API entegrasyonu (Claude Sonnet 4.5) |
| Tailwind CSS | 3.4.1 | Styling |
| Lucide React | 1.14.0 | İkon seti |
| PyMuPDF (fitz) | — | PDF'den metin çıkarma (veri toplama) |
| Python | 3.12 | Veri toplama scriptleri |

## 🚀 Kurulum ve Çalıştırma

```bash
# 1. Repoyu klonlayın
git clone https://github.com/Ebubekir23/anayasa-ai.git
cd anayasa-ai

# 2. Bağımlılıkları yükleyin
npm install

# 3. Ortam değişkenlerini ayarlayın
# .env dosyası oluşturun:
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env

# 4. Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📁 Proje Yapısı

```
anayasa-ai/
├── app/
│   ├── api/chat/route.js   # RAG API endpoint (arama + Claude entegrasyonu)
│   ├── page.js             # Ana chatbot arayüzü
│   ├── layout.js           # Next.js layout
│   └── globals.css         # Global stiller
├── data/
│   ├── constitution.json   # Anayasa maddeleri
│   ├── tck.json           # Türk Ceza Kanunu maddeleri
│   ├── tmk.json           # Türk Medeni Kanunu maddeleri
│   └── ...                # Diğer kanun JSON dosyaları
├── lib/
│   ├── prompts.js         # Sistem prompt'ları (TR/EN × QA/Dilekçe)
│   ├── sanitize.js        # Halüsinasyon filtresi
│   └── rate-limit.js      # Rate limiting modülü
└── package.json
```

## 📄 Lisans

Bu proje GİTEK Yapay Zeka Etkinliği kapsamında eğitim amaçlı geliştirilmiştir.

---

> ⚠️ **Sorumluluk Reddi**: Bu sistem yapay zeka destekli bilgilendirme aracıdır. Gerçek hukuki süreçler için mutlaka bir avukata danışınız.
