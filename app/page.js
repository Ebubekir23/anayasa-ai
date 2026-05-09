"use client";

import React, { useState, useRef, useEffect } from "react";
import { Scale, Moon, Sun, Send, Globe, Loader2, Copy, Check, FileText, MessageSquare } from "lucide-react";

// =========================================================
// KANUN VERİTABANI
// =========================================================
const LAW_DB = {
  anayasa: { code_tr: "Anayasa", full_tr: "Türkiye Cumhuriyeti Anayasası", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2709.pdf", accent: "#8B2635" },
  tck:     { code_tr: "TCK",     full_tr: "Türk Ceza Kanunu",                url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5237.pdf", accent: "#B83E2D" },
  cmk:     { code_tr: "CMK",     full_tr: "Ceza Muhakemesi Kanunu",           url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5271.pdf", accent: "#A8443B" },
  tmk:     { code_tr: "TMK",     full_tr: "Türk Medeni Kanunu",               url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4721.pdf", accent: "#2C5C7A" },
  tbk:     { code_tr: "TBK",     full_tr: "Türk Borçlar Kanunu",              url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6098.pdf", accent: "#3F7A8C" },
  hmk:     { code_tr: "HMK",     full_tr: "Hukuk Muhakemeleri Kanunu",        url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6100.pdf", accent: "#1F6B5E" },
  ttk:     { code_tr: "TTK",     full_tr: "Türk Ticaret Kanunu",              url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6102.pdf", accent: "#7A5A2C" },
  ik:      { code_tr: "İş K.",   full_tr: "İş Kanunu",                        url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4857.pdf", accent: "#5C4A8C" },
  kvkk:    { code_tr: "KVKK",    full_tr: "Kişisel Verilerin Korunması K.",   url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6698.pdf", accent: "#7A2C6B" },
  iik:     { code_tr: "İİK",     full_tr: "İcra ve İflas Kanunu",             url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.3.2004.pdf", accent: "#8C5A2C" },
  vuk:     { code_tr: "VUK",     full_tr: "Vergi Usul Kanunu",                url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.4.213.pdf",  accent: "#5C7A4A" },
  ktk:     { code_tr: "KTK",     full_tr: "Karayolları Trafik Kanunu",        url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2918.pdf", accent: "#5A5A5A" },
};

// =========================================================
// İ18N
// =========================================================
const i18n = {
  tr: {
    title: "HUKUK·AI",
    subtitle: "Türk Hukuku Asistanı",
    modeQA: "Soru–Cevap",
    modePetition: "Dilekçe Hazırla",
    // Soru-Cevap hoşgeldin
    qaWelcomeTitle: "Hukuki Asistanınıza Hoş Geldiniz",
    qaWelcomeDesc: "Türk hukuku, anayasa ve mevzuat hakkında her türlü soruyu sorabilirsiniz.",
    qaExamplesTitle: "Örnek Sorular",
    qaExamples: [
      "Kasten yaralama suçunun cezası nedir?",
      "Boşanma davasında mal paylaşımı nasıl yapılır?",
      "İşveren keyfi olarak işten çıkarabilir mi?",
      "KVKK kapsamında veri saklama yükümlülükleri nelerdir?",
    ],
    qaPlaceholder: "Hukuki sorunuzu buraya yazın...",
    // Dilekçe hoşgeldin
    petitionWelcomeTitle: "Dilekçe Hazırlama Modu",
    petitionWelcomeDesc: "Durumunuzu açıklayın; taraflar, olaylar ve talebinizi belirtin. Size resmi bir dilekçe taslağı hazırlayalım.",
    petitionExamplesTitle: "Örnek Senaryolar",
    petitionExamples: [
      "Haksız yere işten çıkarıldım, işe iade dilekçesi istiyorum.",
      "Kiracı kira ödemiyor, tahliye dilekçesi hazırla.",
      "Trafik kazasında karşı taraf kusurlu, tazminat dilekçesi istiyorum.",
      "Komşu gürültü yapıyor, şikayet dilekçesi hazırla.",
    ],
    petitionPlaceholder: "Durumu açıklayın: taraflar, olay, talebiniz...",
    errorGeneric: "Bir hata oluştu. Lütfen tekrar deneyin.",
    footer: "Yapay zeka destekli bilgilendirmedir. Gerçek hukuki süreçler için avukata danışınız.",
    sourcesLabel: "Veritabanı Kaynakları",
    thinking: "Mevzuat taranıyor...",
  },
  en: {
    title: "HUKUK·AI",
    subtitle: "Turkish Law Assistant",
    modeQA: "Q & A",
    modePetition: "Draft Petition",
    qaWelcomeTitle: "Welcome to Your Legal Assistant",
    qaWelcomeDesc: "Ask any question about Turkish law, the constitution, and legislation.",
    qaExamplesTitle: "Example Questions",
    qaExamples: [
      "What is the penalty for intentional injury?",
      "How is property divided in a divorce case?",
      "Can an employer dismiss an employee arbitrarily?",
      "What are data retention obligations under KVKK?",
    ],
    qaPlaceholder: "Type your legal question here...",
    petitionWelcomeTitle: "Petition Drafting Mode",
    petitionWelcomeDesc: "Describe your situation — parties, events, and your request. We'll draft a formal petition for you.",
    petitionExamplesTitle: "Example Scenarios",
    petitionExamples: [
      "I was wrongfully dismissed. I need a reinstatement petition.",
      "My tenant isn't paying rent. Draft an eviction petition.",
      "I was in a traffic accident. Draft a compensation petition.",
      "My neighbor is noisy. Draft a complaint petition.",
    ],
    petitionPlaceholder: "Describe the situation: parties, events, your request...",
    errorGeneric: "An error occurred. Please try again.",
    footer: "AI-generated information. Consult a licensed attorney for real legal matters.",
    sourcesLabel: "Database Sources",
    thinking: "Scanning legislation...",
  },
};

// =========================================================
// MARKDOWN TEMİZLEYİCİ — * ve # işaretlerini temizle
// =========================================================
function cleanMarkdown(text) {
  if (!text) return "";
  return text
    // **bold** → bold (sadece metni bırak)
    .replace(/\*\*(.+?)\*\*/g, "$1")
    // *italic* → italic
    .replace(/\*(.+?)\*/g, "$1")
    // ### Başlık → Başlık (satır başındaki # işaretleri)
    .replace(/^#{1,6}\s+/gm, "")
    // - liste → • liste
    .replace(/^[\-\*]\s+/gm, "• ")
    // Çoklu boş satırları tek satıra indir
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// =========================================================
// ATIF PARSE — [TCK Madde 86] → tıklanabilir badge
// =========================================================
const CITATION_REGEX = /\[(Anayasa|TCK|CMK|TMK|TBK|HMK|TTK|İK|IK|KVKK|İİK|IIK|VUK|KTK|Madde)\s*(?:Madde)?\s*(\d+)\]/giu;

function renderTextWithCitations(rawText, theme) {
  const text = cleanMarkdown(rawText);
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  CITATION_REGEX.lastIndex = 0;
  let match;

  while ((match = CITATION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`} style={{ whiteSpace: "pre-wrap" }}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    let keyStr = match[1].toLowerCase().replace(".", "").replace("i̇", "i").replace("İ", "i").replace("ı", "i");
    if (keyStr === "ik") keyStr = "ik";
    if (keyStr === "iik") keyStr = "iik";
    if (keyStr === "madde") keyStr = "anayasa";

    const law = LAW_DB[keyStr] || LAW_DB.anayasa;
    const article = match[2];

    parts.push(
      <a
        key={`c-${match.index}`}
        href={law.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 px-2 py-0.5 mx-0.5 rounded-sm text-xs font-semibold no-underline transition-opacity hover:opacity-75"
        style={{
          backgroundColor: theme === "dark" ? "#1A1F2E" : "#F5EDD9",
          color: theme === "dark" ? "#D4B068" : law.accent,
          border: `1px solid ${theme === "dark" ? "#3A4054" : "#D9CFB8"}`,
          fontFamily: "'Cormorant Garamond', serif",
        }}
      >
        {law.code_tr} Md.{article}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`t-end`} style={{ whiteSpace: "pre-wrap" }}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return parts;
}

// =========================================================
// TEMA
// =========================================================
const THEMES = {
  light: {
    bg: "radial-gradient(ellipse at top, #FAF6EE 0%, #F2EBDC 100%)",
    text: "#1A1F2E",
    textMuted: "#5C5648",
    textFaint: "#8C8470",
    surface: "rgba(255,255,255,0.75)",
    surfaceMuted: "rgba(250,247,236,0.6)",
    border: "#D9CFB8",
    accent: "#8B2635",
    gold: "#B8935A",
    userBubble: "#1A1F2E",
    userText: "#F5EDD9",
    aiBubble: "#FBF7EC",
    aiBorder: "#E5DAB8",
    input: "#FFFFFF",
    modeActive: "#1A1F2E",
    modeActiveTxt: "#F5EDD9",
    modeInactive: "transparent",
    modeBar: "#EDE3CC",
    sourceCard: "#F5EDD9",
    sourceCardBorder: "#D9CFB8",
    sourceCardText: "#8B2635",
  },
  dark: {
    bg: "radial-gradient(ellipse at top, #1F2433 0%, #0F1218 100%)",
    text: "#EDE3CC",
    textMuted: "#A89F8C",
    textFaint: "#7A7466",
    surface: "rgba(31,36,51,0.85)",
    surfaceMuted: "rgba(20,24,34,0.6)",
    border: "#3A3F4F",
    accent: "#D4B068",
    gold: "#D4B068",
    userBubble: "#D4B068",
    userText: "#1A1F2E",
    aiBubble: "#262C3D",
    aiBorder: "#3A4054",
    input: "#1A1F2E",
    modeActive: "#D4B068",
    modeActiveTxt: "#1A1F2E",
    modeInactive: "transparent",
    modeBar: "#1A1F2E",
    sourceCard: "#1A1F2E",
    sourceCardBorder: "#3A4054",
    sourceCardText: "#D4B068",
  },
};

// =========================================================
// BUBBLE BİLEŞENİ
// =========================================================
function Bubble({ msg, themeMode, t }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const th = THEMES[themeMode];

  if (msg.isWelcome) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col mb-5 ${isUser ? "items-end" : "items-start"}`}>
      {/* Mesaj balonu */}
      <div
        className={`relative max-w-[88%] px-4 py-3 shadow-sm ${
          isUser ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm"
        }`}
        style={{
          backgroundColor: msg.isError
            ? (themeMode === "dark" ? "#3B1F22" : "#FDE8E8")
            : isUser
            ? th.userBubble
            : th.aiBubble,
          color: msg.isError
            ? (themeMode === "dark" ? "#FCA5A5" : "#9B1C1C")
            : isUser
            ? th.userText
            : th.text,
          border: isUser ? "none" : `1px solid ${th.aiBorder}`,
        }}
      >
        {/* Kopyala butonu (sadece AI cevabı) */}
        {!isUser && !msg.isError && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1 rounded opacity-30 hover:opacity-70 transition-opacity"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}

        {/* İçerik */}
        <div
          className="leading-relaxed text-sm pr-4"
          style={{
            fontFamily: isUser ? "'DM Sans', sans-serif" : "'Cormorant Garamond', serif",
            fontSize: isUser ? "0.9rem" : "1.05rem",
            lineHeight: 1.7,
          }}
        >
          {isUser || msg.isError
            ? msg.content
            : renderTextWithCitations(msg.content, themeMode)}
        </div>
      </div>

      {/* Kaynak maddeler */}
      {!isUser && !msg.isError && msg.sources && msg.sources.length > 0 && (
        <div className="mt-2 max-w-[88%]">
          <p
            className="text-xs mb-1.5 uppercase tracking-widest"
            style={{ color: th.textFaint, letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif" }}
          >
            {t.sourcesLabel}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {msg.sources.map((src, i) => (
              <a
                key={i}
                href={src.url || "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2709.pdf"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs no-underline transition-opacity hover:opacity-75"
                style={{
                  backgroundColor: th.sourceCard,
                  border: `1px solid ${th.sourceCardBorder}`,
                  color: th.sourceCardText,
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 600,
                }}
              >
                {src.law_short || "Anayasa"} Md.{src.id}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// ANA UYGULAMA
// =========================================================
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState("tr");
  const [mode, setMode] = useState("qa");
  const [themeMode, setThemeMode] = useState("light");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const t = i18n[lang];
  const th = THEMES[themeMode];

  // Mod değişince sohbeti sıfırla
  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [mode, lang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const newMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages
            .filter((m) => !m.isWelcome && !m.isError)
            .map((m) => ({ role: m.role, content: m.content })),
          mode,
          lang,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message || t.errorGeneric, isError: true },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.text, sources: data.sources || [] },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t.errorGeneric, isError: true },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const hasChat = messages.length > 0;
  const isQA = mode === "qa";
  const welcomeTitle = isQA ? t.qaWelcomeTitle : t.petitionWelcomeTitle;
  const welcomeDesc = isQA ? t.qaWelcomeDesc : t.petitionWelcomeDesc;
  const examplesTitle = isQA ? t.qaExamplesTitle : t.petitionExamplesTitle;
  const examples = isQA ? t.qaExamples : t.petitionExamples;
  const placeholder = isQA ? t.qaPlaceholder : t.petitionPlaceholder;

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-6 transition-colors duration-300"
      style={{ background: th.bg, fontFamily: "'DM Sans', sans-serif", color: th.text }}
    >
      {/* Üst şerit */}
      <div
        className="fixed top-0 left-0 w-full h-1 z-50"
        style={{ background: `linear-gradient(90deg, ${th.accent} 0%, ${th.gold} 100%)` }}
      />

      <div className="w-full max-w-3xl flex flex-col h-[92vh]">

        {/* HEADER */}
        <header className="flex justify-between items-center pb-5 mb-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: th.accent, color: th.gold }}
            >
              <Scale size={18} strokeWidth={1.8} />
            </div>
            <div>
              <h1
                className="text-xl font-bold leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: th.text, letterSpacing: "-0.01em" }}
              >
                {t.title}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: th.accent, letterSpacing: "0.06em" }}>
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang((l) => (l === "tr" ? "en" : "tr"))}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
              style={{ borderColor: th.border, color: th.textMuted, backgroundColor: "transparent" }}
            >
              {lang === "tr" ? "EN" : "TR"}
            </button>
            <button
              onClick={() => setThemeMode((m) => (m === "light" ? "dark" : "light"))}
              className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors"
              style={{ borderColor: th.border, color: th.textMuted }}
            >
              {themeMode === "light" ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
        </header>

        {/* MOD SEÇİCİ */}
        <div
          className="flex p-1 rounded-xl mb-4 gap-1"
          style={{ backgroundColor: th.modeBar }}
        >
          <button
            onClick={() => setMode("qa")}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: mode === "qa" ? th.modeActive : th.modeInactive,
              color: mode === "qa" ? th.modeActiveTxt : th.textMuted,
            }}
          >
            <MessageSquare size={14} />
            {t.modeQA}
          </button>
          <button
            onClick={() => setMode("petition")}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: mode === "petition" ? th.modeActive : th.modeInactive,
              color: mode === "petition" ? th.modeActiveTxt : th.textMuted,
            }}
          >
            <FileText size={14} />
            {t.modePetition}
          </button>
        </div>

        {/* SOHBET ALANI */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">

          {/* HOŞGELDİN EKRANI — mod değişince değişiyor */}
          {!hasChat && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{ backgroundColor: mode === "qa" ? th.aiBubble : (themeMode === "dark" ? "#1A2040" : "#EEF2FF"), border: `2px solid ${th.border}` }}
              >
                {mode === "qa"
                  ? <Scale size={28} style={{ color: th.accent }} strokeWidth={1.5} />
                  : <FileText size={28} style={{ color: "#5C4A8C" }} strokeWidth={1.5} />
                }
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: th.text }}
              >
                {welcomeTitle}
              </h2>
              <p className="text-sm max-w-sm mb-8" style={{ color: th.textMuted }}>
                {welcomeDesc}
              </p>

              <div className="w-full max-w-lg">
                <p className="text-xs uppercase tracking-widest mb-3 text-left" style={{ color: th.textFaint, letterSpacing: "0.15em" }}>
                  {examplesTitle}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => send(ex)}
                      className="text-left p-3 rounded-xl border text-sm transition-all hover:-translate-y-0.5 hover:shadow-sm"
                      style={{
                        borderColor: th.border,
                        backgroundColor: th.surfaceMuted,
                        color: th.textMuted,
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1rem",
                      }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MESAJLAR */}
          {hasChat && (
            <div className="py-2">
              {messages.map((m, i) => (
                <Bubble key={i} msg={m} themeMode={themeMode} t={t} />
              ))}

              {/* Yükleniyor */}
              {loading && (
                <div className="flex items-start mb-5">
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 rounded-2xl rounded-tl-sm text-sm"
                    style={{ backgroundColor: th.aiBubble, border: `1px solid ${th.aiBorder}`, color: th.textMuted }}
                  >
                    <Loader2 size={14} className="animate-spin" />
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
                      {t.thinking}
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* INPUT */}
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${th.border}` }}>
          <div
            className="flex items-end gap-2 rounded-2xl border px-4 py-2.5 transition-shadow focus-within:shadow-md"
            style={{ backgroundColor: th.input, borderColor: th.border }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={placeholder}
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed"
              style={{
                color: th.text,
                fontFamily: "'DM Sans', sans-serif",
                maxHeight: "120px",
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ backgroundColor: th.accent, color: "#FFF" }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        <footer
          className="text-center mt-3 text-xs"
          style={{ color: th.textFaint, fontFamily: "'DM Sans', sans-serif" }}
        >
          {t.footer}
        </footer>
      </div>

      {/* GLOBAL STİLLER */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: ${themeMode === "dark" ? "#3A4054" : "#E5DAB8"}; border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      ` }} />
    </div>
  );
}