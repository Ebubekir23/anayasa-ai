"use client";

import React, { useState, useRef, useEffect } from "react";
import { Scale, Moon, Sun, Send, Globe, AlertTriangle, RefreshCw, Loader2, Copy, Check } from "lucide-react";

const LAW_DB = {
  anayasa: { code_tr: "Anayasa", full_tr: "Türkiye Cumhuriyeti Anayasası", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2709.pdf", accent: "#8B2635" },
  tck: { code_tr: "TCK", full_tr: "Türk Ceza Kanunu", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5237.pdf", accent: "#B83E2D" },
  cmk: { code_tr: "CMK", full_tr: "Ceza Muhakemesi Kanunu", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5271.pdf", accent: "#A8443B" },
  tmk: { code_tr: "TMK", full_tr: "Türk Medeni Kanunu", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4721.pdf", accent: "#2C5C7A" },
  tbk: { code_tr: "TBK", full_tr: "Türk Borçlar Kanunu", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6098.pdf", accent: "#3F7A8C" },
  hmk: { code_tr: "HMK", full_tr: "Hukuk Muhakemeleri Kanunu", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6100.pdf", accent: "#1F6B5E" },
  ttk: { code_tr: "TTK", full_tr: "Türk Ticaret Kanunu", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6102.pdf", accent: "#7A5A2C" },
  ik: { code_tr: "İş K.", full_tr: "İş Kanunu", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4857.pdf", accent: "#5C4A8C" },
  kvkk: { code_tr: "KVKK", full_tr: "Kişisel Verilerin Korunması Kanunu", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6698.pdf", accent: "#7A2C6B" },
};

const i18n = {
  tr: {
    title: "LEXBOT AI",
    modeQA: "Soru-Cevap",
    modePetition: "Dilekçe",
    welcomeTitle: "Hukuki Asistanınıza Hoş Geldiniz",
    welcomeDesc: "Anayasa hukuku ve mevzuat hakkında sorular sorabilir veya dilekçe taslağı oluşturabilirsiniz.",
    examplesTitle: "Örnek Sorular",
    examples: [
      "Kasten yaralama suçunun cezası nedir?",
      "Boşanma davasında mal paylaşımı nasıl yapılır?",
      "İşveren keyfi olarak işten çıkarabilir mi?",
      "KVKK kapsamında bir şirket veriyi nasıl saklamalı?"
    ],
    placeholder: "Hukuki sorunuzu buraya yazın...",
    errorGeneric: "Bir hata oluştu. Lütfen tekrar deneyin.",
    footer: "Kararlar ve analizler yapay zeka tarafından üretilmektedir. Kesin hukuki tavsiye yerine geçmez.",
  },
  en: {
    title: "LEXBOT AI",
    modeQA: "Q&A",
    modePetition: "Petition",
    welcomeTitle: "Welcome to your Legal Assistant",
    welcomeDesc: "You can ask questions about constitutional law and legislation, or draft a petition.",
    examplesTitle: "Example Queries",
    examples: [
      "What is the penalty for intentional injury?",
      "How is property division handled in a divorce case?",
      "Can an employer arbitrarily dismiss an employee?",
      "How should a company store data under KVKK?"
    ],
    placeholder: "Type your legal question here...",
    errorGeneric: "An error occurred. Please try again.",
    footer: "Decisions and analysis are AI-generated. Does not constitute definitive legal advice.",
  }
};

const CITATION_REGEX = /\[(Anayasa|TCK|CMK|TMK|TBK|HMK|TTK|İK|IK|KVKK|Madde)\s*(?:Madde)?\s*(\d+)\]/giu;

const renderTextWithCitations = (text, theme) => {
  if (!text) return null;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = CITATION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
    
    let keyStr = match[1].toLowerCase();
    if (keyStr === "ik" || keyStr === "ik") keyStr = "ik";
    if (keyStr === "madde") keyStr = "anayasa"; 
    
    const lawData = LAW_DB[keyStr] || LAW_DB.anayasa;
const article = match[2];
const href = lawData.url;

parts.push(
  <a 
    key={match.index} href={href} target="_blank"
        className="inline-flex items-center px-2 py-0.5 mx-1 rounded text-xs font-semibold no-underline shadow-sm transition-opacity hover:opacity-80"
        style={{ 
          backgroundColor: theme === 'dark' ? '#262C3D' : '#F5EDD9',
          color: theme === 'dark' ? '#D4B068' : lawData.accent,
          border: `1px solid ${theme === 'dark' ? '#3A4054' : '#E5DAB8'}`
        }}
      >
        {lawData.code_tr} Md. {article}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return parts;
};

const Bubble = ({ msg, theme, onRetry }) => {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.isWelcome) return null;

  return (
    <div className={`flex flex-col mb-6 ${isUser ? 'items-end' : 'items-start'}`}>
      <div 
        className={`relative max-w-[85%] rounded-lg p-4 shadow-sm ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}
        style={{
          backgroundColor: msg.isError ? (theme === 'dark' ? '#4A1C1C' : '#FDE8E8') : 
                           isUser ? '#1A1F2E' : (theme === 'dark' ? '#262C3D' : '#FBF7EC'),
          color: msg.isError ? (theme === 'dark' ? '#FCA5A5' : '#9B1C1C') : 
                 isUser ? '#F5EDD9' : (theme === 'dark' ? '#EDE3CC' : '#1A1F2E'),
          border: isUser ? 'none' : `1px solid ${theme === 'dark' ? '#3A4054' : '#E5DAB8'}`
        }}
      >
        {!isUser && !msg.isError && (
          <button onClick={handleCopy} className="absolute top-2 right-2 p-1 opacity-50 hover:opacity-100 transition-opacity">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
        <div className={`whitespace-pre-wrap ${!isUser && "font-serif text-[1.05rem] leading-relaxed"}`} style={{ fontFamily: !isUser ? '"Cormorant Garamond", serif' : '"DM Sans", sans-serif' }}>
           {isUser || msg.isError ? msg.content : renderTextWithCitations(msg.content, theme)}
        </div>
      </div>
    {!isUser && !msg.isError && msg.sources && msg.sources.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {msg.sources.map((src, i) => (
            <a key={i}
              href={`https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2709.pdf`}
              target="_blank" rel="noopener noreferrer"
              className="px-2 py-1 rounded text-xs no-underline"
              style={{ backgroundColor: '#F5EDD9', color: '#8B2635', border: '1px solid #E5DAB8' }}
            >
              Madde {src.id}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

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

  useEffect(() => {
    // Claude için başlangıç rolü "assistant" olarak ayarlandı
    if (messages.length === 0) setMessages([{ isWelcome: true, role: "assistant" }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.filter(m => !m.isWelcome && !m.isError).map(m => ({ role: m.role, content: m.content })),
          mode, lang,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Hata durumunda rol "assistant"
        setMessages(prev => [...prev, { role: "assistant", content: data.error || t.errorGeneric, isError: true }]);
      } else {
        // Başarı durumunda rol "assistant"
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.text,
          sources: data.sources || [],
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: t.errorGeneric, isError: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const toggleTheme = () => setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'tr' ? 'en' : 'tr');
  const bgStyle = themeMode === 'light' 
    ? { background: 'radial-gradient(ellipse at top, #FAF6EE 0%, #F2EBDC 100%)', color: '#1A1F2E' } 
    : { background: 'radial-gradient(ellipse at top, #1F2433 0%, #0F1218 100%)', color: '#EDE3CC' };
  const hasChat = messages.filter(m => !m.isWelcome).length > 0;

  return (
    <div style={{...bgStyle, fontFamily: '"DM Sans", sans-serif'}} className="min-h-screen flex flex-col items-center py-6 px-4 transition-colors duration-300">
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8B2635] to-[#B8935A] z-50"></div>
      <div className="w-full max-w-4xl flex flex-col flex-1 h-[90vh]">
        
        <header className="flex justify-between items-center pb-6 border-b border-opacity-20" style={{ borderColor: themeMode === 'dark' ? '#3A4054' : '#E5DAB8' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: themeMode === 'dark' ? '#D4B068' : '#8B2635' }}>
              <Scale size={20} />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-wide" style={{ color: themeMode === 'dark' ? '#D4B068' : '#1A1F2E' }}>{t.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="p-2 rounded-full hover:bg-black hover:bg-opacity-5"><Globe size={18} opacity={0.7} /></button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black hover:bg-opacity-5">
              {themeMode === 'light' ? <Moon size={18} opacity={0.7} /> : <Sun size={18} opacity={0.7} />}
            </button>
          </div>
        </header>

        <div className="flex justify-between items-center py-4">
          <div className="flex p-1 rounded-lg" style={{ backgroundColor: themeMode === 'dark' ? '#1A1F2E' : '#E5DAB8' }}>
            <button onClick={() => setMode('qa')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${mode === 'qa' ? 'shadow-sm' : 'opacity-70'}`} style={{ backgroundColor: mode === 'qa' ? (themeMode === 'dark' ? '#262C3D' : '#FBF7EC') : 'transparent' }}>{t.modeQA}</button>
            <button onClick={() => setMode('petition')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${mode === 'petition' ? 'shadow-sm' : 'opacity-70'}`} style={{ backgroundColor: mode === 'petition' ? (themeMode === 'dark' ? '#262C3D' : '#FBF7EC') : 'transparent' }}>{t.modePetition}</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col" style={{ maxHeight: '58vh' }}>
          {!hasChat && (
            <div className="flex-1 flex flex-col items-center justify-center mt-10 animate-fade-in">
              <Scale size={48} opacity={0.2} className="mb-4" />
              <h2 className="font-serif text-3xl mb-2 text-center">{t.welcomeTitle}</h2>
              <p className="text-center opacity-70 max-w-md mb-8">{t.welcomeDesc}</p>
              <div className="w-full max-w-2xl">
                <p className="text-sm font-semibold opacity-60 mb-3 ml-1">{t.examplesTitle}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {t.examples.map((ex, idx) => (
                    <button key={idx} onClick={() => send(ex)} className="text-left p-3 rounded-lg border text-sm hover:-translate-y-0.5 transition-transform" style={{ borderColor: themeMode === 'dark' ? '#3A4054' : '#E5DAB8', backgroundColor: themeMode === 'dark' ? '#262C3D' : '#FBF7EC' }}>
                      "{ex}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hasChat && (
             <div className="flex-1 pb-4">
                {messages.map((m, i) => <Bubble key={i} msg={m} theme={themeMode} onRetry={send} />)}
                {loading && (
                   <div className="flex items-start mb-6">
                     <div className="p-4 rounded-lg rounded-tl-none border shadow-sm flex items-center gap-3" style={{ backgroundColor: themeMode === 'dark' ? '#262C3D' : '#FBF7EC', borderColor: themeMode === 'dark' ? '#3A4054' : '#E5DAB8' }}>
                       <Loader2 size={16} className="animate-spin opacity-60" />
                       <span className="text-sm opacity-60 font-serif">Arşivler taranıyor...</span>
                     </div>
                   </div>
                )}
                <div ref={chatEndRef} />
             </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-opacity-20" style={{ borderColor: themeMode === 'dark' ? '#3A4054' : '#E5DAB8' }}>
          <div className="relative flex items-end shadow-sm rounded-xl overflow-hidden border focus-within:ring-2 focus-within:ring-opacity-50" style={{ backgroundColor: themeMode === 'dark' ? '#1A1F2E' : '#FFFFFF', borderColor: themeMode === 'dark' ? '#3A4054' : '#E5DAB8', '--tw-ring-color': themeMode === 'dark' ? '#D4B068' : '#8B2635' }}>
            <textarea
              ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={t.placeholder} className="w-full max-h-32 p-4 bg-transparent resize-none outline-none text-[0.95rem]" rows={1}
              style={{ color: themeMode === 'dark' ? '#EDE3CC' : '#1A1F2E' }} disabled={loading}
            />
            <button onClick={() => send(input)} disabled={!input.trim() || loading} className="p-3 m-2 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-30 hover:opacity-90" style={{ backgroundColor: themeMode === 'dark' ? '#D4B068' : '#1A1F2E', color: themeMode === 'dark' ? '#1A1F2E' : '#F5EDD9' }}>
              <Send size={18} />
            </button>
          </div>
        </div>
        <footer className="text-center mt-4 pb-2 opacity-50 text-xs">{t.footer}</footer>
      </div>
      <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap'); .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: ${themeMode === 'dark' ? '#3A4054' : '#E5DAB8'}; border-radius: 10px; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }`}} />
    </div>
  );
}