import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// =========================================================
// VERİTABANI — Anayasa + 11 Türk Kanunu
// =========================================================
let ARTICLES = null;

const LAW_FILES = [
  { file: "tck.json",  short: "TCK",  name: "Türk Ceza Kanunu",                   no: "5237", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5237.pdf" },
  { file: "tmk.json",  short: "TMK",  name: "Türk Medeni Kanunu",                  no: "4721", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4721.pdf" },
  { file: "tbk.json",  short: "TBK",  name: "Türk Borçlar Kanunu",                 no: "6098", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6098.pdf" },
  { file: "hmk.json",  short: "HMK",  name: "Hukuk Muhakemeleri Kanunu",           no: "6100", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6100.pdf" },
  { file: "cmk.json",  short: "CMK",  name: "Ceza Muhakemesi Kanunu",              no: "5271", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5271.pdf" },
  { file: "ik.json",   short: "İK",   name: "İş Kanunu",                           no: "4857", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4857.pdf" },
  { file: "kvkk.json", short: "KVKK", name: "Kişisel Verilerin Korunması Kanunu",  no: "6698", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6698.pdf" },
  { file: "ttk.json",  short: "TTK",  name: "Türk Ticaret Kanunu",                 no: "6102", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6102.pdf" },
  { file: "iik.json",  short: "İİK",  name: "İcra ve İflas Kanunu",                no: "2004", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.3.2004.pdf" },
  { file: "vuk.json",  short: "VUK",  name: "Vergi Usul Kanunu",                   no: "213",  url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.4.213.pdf" },
  { file: "ktk.json",  short: "KTK",  name: "Karayolları Trafik Kanunu",            no: "2918", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2918.pdf" },
];

function loadArticles() {
  if (ARTICLES) return ARTICLES;
  const all = [];

  // 1) ANAYASA
  try {
    const path = join(process.cwd(), "data", "constitution.json");
    if (existsSync(path)) {
      const raw = JSON.parse(readFileSync(path, "utf-8"));
      const seen = new Set();
      for (const part of raw.structure.parts) {
        for (const a of part.articles) {
          const key = `anayasa-${a.id}-${a.content.slice(0, 40)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          all.push({
            uid: `anayasa-${a.id}`,
            article_no: String(a.id),
            law_short: "Anayasa",
            law_name: "Türkiye Cumhuriyeti Anayasası",
            law_no: "2709",
            url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2709.pdf",
            content: a.content,
          });
        }
      }
      console.log(`[DB] Anayasa: ${all.length} madde`);
    }
  } catch (e) {
    console.error("[DB] Anayasa yüklenemedi:", e.message);
  }

  // 2) KANUNLAR
  for (const law of LAW_FILES) {
    try {
      const path = join(process.cwd(), "data", law.file);
      if (!existsSync(path)) {
        console.log(`[DB] ${law.short}: dosya yok, atlanıyor`);
        continue;
      }
      const raw = JSON.parse(readFileSync(path, "utf-8"));
      const articles = raw.articles || [];
      let added = 0;
      for (const a of articles) {
        if (!a.content || a.content.length < 10) continue;
        all.push({
          uid: `${law.short}-${a.id}`,
          article_no: String(a.id),
          law_short: law.short,
          law_name: law.name,
          law_no: law.no,
          url: law.url,
          content: a.content,
        });
        added++;
      }
      console.log(`[DB] ${law.short}: ${added} madde`);
    } catch (e) {
      console.error(`[DB] ${law.short} yüklenemedi:`, e.message);
    }
  }

  // Tekrarları temizle
  const seen = new Set();
  ARTICLES = all.filter((a) => {
    const key = `${a.uid}-${a.content.slice(0, 60)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[DB] Toplam: ${ARTICLES.length} madde aktif`);
  return ARTICLES;
}

// =========================================================
// ARAMA — Keyword tabanlı
// =========================================================
const STOP_WORDS = new Set([
  "ve", "ile", "bir", "bu", "da", "de", "mi", "mu", "mı", "mü",
  "ne", "için", "olan", "gibi", "kadar", "göre", "her", "veya",
  "ise", "nasıl", "nedir", "var", "acaba", "ya", "ki",
]);

// Kanun kısaltmaları → arama için
const LAW_HINTS = {
  "tck": "TCK", "türk ceza": "TCK", "ceza kanun": "TCK",
  "tmk": "TMK", "medeni kanun": "TMK", "türk medeni": "TMK",
  "tbk": "TBK", "borçlar kanun": "TBK", "türk borç": "TBK",
  "hmk": "HMK", "hukuk muhakeme": "HMK",
  "cmk": "CMK", "ceza muhakeme": "CMK",
  "iş kanun": "İK", "4857": "İK",
  "kvkk": "KVKK", "kişisel veri": "KVKK",
  "ttk": "TTK", "ticaret kanun": "TTK",
  "iik": "İİK", "icra": "İİK", "iflas": "İİK",
  "vuk": "VUK", "vergi usul": "VUK",
  "ktk": "KTK", "trafik kanun": "KTK",
  "anayasa": "Anayasa",
};

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function detectTargetLaws(query) {
  const low = query.toLowerCase();
  const targets = new Set();
  for (const [hint, short] of Object.entries(LAW_HINTS)) {
    if (low.includes(hint)) targets.add(short);
  }
  return targets;
}

function scoreArticle(article, queryTokens, targetLaws) {
  let score = 0;

  // Hedef kanun boost
  if (targetLaws.size > 0 && targetLaws.has(article.law_short)) {
    score += 6;
  }

  // Madde numarası doğrudan eşleşme
  if (queryTokens.includes(article.article_no)) {
    score += 8;
  }

  const text = article.content.toLowerCase();
  for (const token of queryTokens) {
    const matches = (text.match(new RegExp("\\b" + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\b", "gi")) || []).length;
    if (matches > 0) {
      score += 1 + Math.log(matches + 1);
    }
  }

  return score;
}

function searchArticles(query, topK = 5) {
  const articles = loadArticles();
  if (!articles.length) return [];

  const targetLaws = detectTargetLaws(query);

  // "madde 86" gibi doğrudan numaralar
  const directNums = [...(query.matchAll(/madde\s*(\d+)|(\d+)\s*\.?\s*madde/gi))].map(
    (m) => m[1] || m[2]
  );

  const queryTokens = tokenize(query);
  if (directNums.length) queryTokens.push(...directNums);

  const scored = articles
    .map((a) => ({ a, score: scoreArticle(a, queryTokens, targetLaws) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map((x) => x.a);
}

// =========================================================
// SİSTEM PROMPT
// =========================================================
function buildSystemPrompt(mode, lang, articles) {
  const dbText = articles.length
    ? articles
        .map((a) => `[${a.law_short} Madde ${a.article_no}] (${a.law_name})\n${a.content}`)
        .join("\n\n---\n\n")
    : "İlgili madde bulunamadı.";

  const context = `MEVZUAT VERİTABANI:\n${"=".repeat(50)}\n${dbText}\n${"=".repeat(50)}`;

  const rules = lang === "tr" ? `
KURALLAR:
1. Sadece yukarıdaki veritabanı maddelerine dayan.
2. Veritabanında yoksa: "Bu konuda veritabanımda bilgi bulunamadı." de.
3. Atıf formatı: [TCK Madde 86], [Anayasa Madde 10], [TMK Madde 4]
4. Net ve hukuki dil.
5. Son satır: "Bu yapay zeka destekli bilgilendirmedir; gerçek hukuki süreçler için avukata danışınız."
` : `
RULES:
1. Use ONLY the database articles above.
2. If not found: "This topic was not found in our database."
3. Citations: [TCK Madde 86], [Anayasa Madde 10], [TMK Madde 4]
4. Clear legal English.
5. End: "This is AI-generated information; consult a licensed attorney."
`;

  if (mode === "petition") {
    return `${context}\n\n${lang === "tr" ? `Sen Türk hukukuna uygun resmi dilekçe hazırlayan bir uzmansın.\n${rules}\nFORMAT:\n⚠️ Taslak uyarısı → Mahkeme başlığı → DAVACI/DAVALI/KONU/AÇIKLAMALAR/HUKUKİ NEDENLER/DELİLLER/SONUÇ → Tarih/İmza` : `You prepare formal Turkish-law petitions.\n${rules}\nFORMAT:\n⚠️ Draft warning → Court heading → PLAINTIFF/DEFENDANT/SUBJECT/FACTS/LEGAL GROUNDS/EVIDENCE/CONCLUSION → Date/Signature`}`;
  }

  return `${context}\n\n${lang === "tr" ? `Sen Türk hukuku uzmanı bir asistansın. ANAYASA-AI projesinin parçasısın.\n${rules}\nCEVAPLARIN TÜRKÇE OLSUN.` : `You are a Turkish law assistant. Part of ANAYASA-AI.\n${rules}\nALWAYS RESPOND IN ENGLISH.`}`;
}

// =========================================================
// ROUTE
// =========================================================
const HISTORY_LIMIT = 6;
const MAX_TOKENS = 4096;
const MODEL = "claude-sonnet-4-5";

export async function POST(req) {
  try {
    const { messages, mode, lang } = (await req.json()) || {};

    if (!Array.isArray(messages) || !messages.length) {
      return NextResponse.json({ error: "messages gerekli" }, { status: 400 });
    }

    const lastMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const relevant = searchArticles(lastMsg, 5);

    console.log(`[RAG] "${lastMsg.slice(0, 60)}" → ${relevant.map((a) => `${a.law_short}/${a.article_no}`).join(", ")}`);

    const system = buildSystemPrompt(mode, lang, relevant);
    const history = messages
      .filter((m) => !m.isWelcome && !m.isError)
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: history,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n\n");

    return NextResponse.json({
      text: text || "(Boş cevap)",
      sources: relevant.map((a) => ({
        id: a.article_no,
        law_short: a.law_short,
        law_name: a.law_name,
        law_no: a.law_no,
        preview: a.content.slice(0, 150) + "...",
        url: a.url,
      })),
      wasTruncated: response.stop_reason === "max_tokens",
      usage: {
        input_tokens: response.usage?.input_tokens || 0,
        output_tokens: response.usage?.output_tokens || 0,
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    const status = err.status === 429 ? 429 : err.status === 529 ? 529 : 500;
    const errorKind = err.status === 429 ? "rate_limit" : err.status === 529 ? "overloaded" : "generic";
    return NextResponse.json({ error: errorKind, message: err.message || "Hata oluştu" }, { status });
  }
}

export async function GET() {
  const articles = loadArticles();
  const laws = [...new Set(articles.map((a) => a.law_short))];
  return NextResponse.json({
    status: "ok",
    model: MODEL,
    database: {
      total_articles: articles.length,
      laws,
    },
  });
}