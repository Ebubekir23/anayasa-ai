import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// =========================================================
// VERİTABANI — Anayasa JSON'unu yükle ve işle
// =========================================================
let ARTICLES = null;

function loadArticles() {
  if (ARTICLES) return ARTICLES;
  try {
    const filePath = join(process.cwd(), "data", "constitution.json");
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    const all = [];
    for (const part of raw.structure.parts) {
      for (const article of part.articles) {
        all.push({
          id: String(article.id),
          title: article.title,
          content: article.content,
        });
      }
    }
    // Tekrarlananları kaldır (aynı id + aynı içerik başlangıcı)
    const seen = new Set();
    ARTICLES = all.filter((a) => {
      const key = `${a.id}::${a.content.slice(0, 80)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    console.log(`[DB] ${ARTICLES.length} anayasa maddesi yüklendi.`);
    return ARTICLES;
  } catch (err) {
    console.error("[DB] JSON yüklenemedi:", err.message);
    return [];
  }
}

// =========================================================
// ARAMA — Keyword tabanlı madde bul (BM25 yaklaşımı)
// =========================================================
const STOP_WORDS = new Set([
  "ve", "ile", "bir", "bu", "da", "de", "mi", "mu", "mı", "mü",
  "ne", "için", "olan", "gibi", "kadar", "göre", "her", "veya",
  "ise", "nasıl", "nedir", "var", "mı", "acaba", "ya", "ki",
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function scoreArticle(article, queryTokens) {
  const text = (article.title + " " + article.content).toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    // Madde numarasına doğrudan erişim (örn: "madde 10" → id 10)
    if (token === article.id) {
      score += 10;
      continue;
    }
    // Token eşleşmesi — kaç kez geçiyor?
    const count = (text.match(new RegExp(token, "gi")) || []).length;
    if (count > 0) {
      score += 1 + Math.log(count); // TF benzeri ağırlık
    }
  }
  return score;
}

function searchArticles(query, topK = 5) {
  const articles = loadArticles();
  if (!articles.length) return [];

  // "madde 10" veya "10. madde" formatındaki doğrudan madde referansı
  const directMatch = query.match(/madde\s*(\d+)|(\d+)\s*\.?\s*madde/gi);
  const directIds = (directMatch || []).map((m) =>
    m.replace(/madde|\s|\./gi, "")
  );

  const queryTokens = tokenize(query);
  if (directIds.length) {
    queryTokens.push(...directIds);
  }

  const scored = articles
    .map((a) => ({ article: a, score: scoreArticle(a, queryTokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map((x) => x.article);
}

// =========================================================
// SİSTEM PROMPT'LARI
// =========================================================
function buildSystemPrompt(mode, lang, articles) {
  const articlesText = articles.length
    ? articles
        .map((a) => `[Madde ${a.id}]\n${a.content}`)
        .join("\n\n---\n\n")
    : "İlgili madde bulunamadı.";

  const context = `
ANAYASA VERİTABANINDAN BULUNAN İLGİLİ MADDELER:
================================================
${articlesText}
================================================
`;

  const rules =
    lang === "tr"
      ? `
KURALLAR:
1. Cevaplarını SADECE yukarıdaki veritabanı maddelerine dayandır.
2. Veritabanında olmayan bir bilgi için "Bu konuda veritabanımda bilgi bulunamadı." de.
3. Her atıfta [Madde X] formatını kullan. Örnek: [Madde 10], [Madde 26]
4. Net, anlaşılır, hukuki bir dil kullan.
5. Cevap sonunda: "Bu yapay zeka destekli bilgilendirmedir; gerçek hukuki süreçler için avukata danışınız."
`
      : `
RULES:
1. Base your answers ONLY on the database articles above.
2. If the information is not in the database, say "This topic was not found in our database."
3. Use [Article X] format for all citations. Example: [Article 10], [Article 26]
4. Use clear, accessible legal language.
5. End with: "This is AI-generated information; consult a licensed attorney for real legal matters."
`;

  if (mode === "petition") {
    return (
      context +
      (lang === "tr"
        ? `
Sen Türk hukukuna uygun resmi dilekçe hazırlayan bir uzmansın.
${rules}
FORMAT (zorunlu):
1. EN ÜSTTE: "⚠️ Bu bir taslaktır — gerçek dava süreci için avukat danışmanlığı zorunludur."
2. Mahkeme/Kurum başlığı
3. DAVACI / DAVALI / KONU / AÇIKLAMALAR / HUKUKİ NEDENLER / DELİLLER / SONUÇ VE TALEP
4. HUKUKİ NEDENLER'de sadece veritabanındaki maddelere atıf yap: [Madde X]
5. Tarih / Ad-Soyad / İmza alanları
`
        : `
You prepare formal petitions based on Turkish constitutional law.
${rules}
FORMAT:
1. TOP: "⚠️ This is a draft — consult an attorney."
2. Court/Institution heading
3. PLAINTIFF / DEFENDANT / SUBJECT / FACTS / LEGAL GROUNDS / EVIDENCE / CONCLUSION
4. In LEGAL GROUNDS cite only database articles: [Article X]
5. Date / Name / Signature
`)
    );
  }

  return (
    context +
    (lang === "tr"
      ? `Sen Türkiye Cumhuriyeti Anayasası uzmanı bir hukuki asistansın. ANAYASA-AI projesinin parçasısın.\n${rules}\nCEVAPLARIN HER ZAMAN TÜRKÇE OLSUN.`
      : `You are a legal assistant specialized in the Turkish Constitution. Part of ANAYASA-AI.\n${rules}\nALWAYS RESPOND IN ENGLISH.`)
  );
}

// =========================================================
// API ROUTE
// =========================================================
const HISTORY_LIMIT = 6;
const MAX_TOKENS = 4096;
const MODEL = "claude-sonnet-4-5";

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages, mode, lang } = body || {};

    if (!Array.isArray(messages) || !messages.length) {
      return NextResponse.json({ error: "messages gerekli" }, { status: 400 });
    }

    // Son kullanıcı mesajını al (arama için)
    const lastUserMsg =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";

    // VERİTABANI ARAMASI
    const relevantArticles = searchArticles(lastUserMsg, 5);

    console.log(
      `[RAG] "${lastUserMsg.slice(0, 50)}..." → ${relevantArticles.length} madde bulundu: ${relevantArticles.map((a) => "Madde " + a.id).join(", ")}`
    );

    // Sistem promptunu veritabanı maddeleriyle oluştur
    const systemPrompt = buildSystemPrompt(mode, lang, relevantArticles);

    // Geçmiş mesajları kısalt
    const recentMessages = messages
      .filter((m) => !m.isWelcome && !m.isError)
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content }));

    // CLAUDE API
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: recentMessages,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n\n");

    return NextResponse.json({
      text: text || "(Boş cevap)",
      // Kullanılan maddeleri frontend'e gönder
      sources: relevantArticles.map((a) => ({
        id: a.id,
        title: a.title,
        preview: a.content.slice(0, 120) + "...",
        url: `https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2709.pdf`,
      })),
      wasTruncated: response.stop_reason === "max_tokens",
      usage: {
        input_tokens: response.usage?.input_tokens || 0,
        output_tokens: response.usage?.output_tokens || 0,
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);

    let errorKind = "generic";
    let status = 500;
    let message = "Beklenmeyen bir hata oluştu.";

    if (err.status === 429) {
      errorKind = "rate_limit";
      status = 429;
      message = "API rate limit aşıldı. 30 saniye bekleyip tekrar deneyin.";
    } else if (err.status === 529) {
      errorKind = "overloaded";
      status = 529;
      message = "Sunucular yoğun. Birkaç saniye sonra tekrar deneyin.";
    }

    return NextResponse.json({ error: errorKind, message }, { status });
  }
}

export async function GET() {
  const articles = loadArticles();
  return NextResponse.json({
    status: "ok",
    service: "anayasa-ai",
    model: MODEL,
    database: `${articles.length} anayasa maddesi`,
  });
}