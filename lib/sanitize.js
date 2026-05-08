// =========================================================
// HALLUCINATION FILTER
// Modelin uydurduğu <function_calls>...</function_output> bloklarını temizler.
// Gerçek MCP tool çağrıları ayrı content block'larında gelir, bu fonksiyon
// onlara dokunmaz — sadece text içine sızan sahte XML'i hedefler.
// =========================================================

export function sanitizeHallucinatedToolCalls(text) {
  if (!text) return { cleaned: "", hadFakeCall: false };
  let cleaned = text;
  let hadFakeCall = false;

  // Tam (kapanmış) blokları sil
  if (/<function_calls>/i.test(cleaned)) {
    hadFakeCall = true;
    cleaned = cleaned.replace(/<function_calls>[\s\S]*?<\/function_calls>/gi, "");
  }
  if (/<function_output>/i.test(cleaned)) {
    hadFakeCall = true;
    cleaned = cleaned.replace(/<function_output>[\s\S]*?<\/function_output>/gi, "");
  }

  // Yarım (kapanışı olmayan) bloklar — model truncate olduysa
  cleaned = cleaned.replace(/<function_calls>[\s\S]*$/gi, "");
  cleaned = cleaned.replace(/<function_output>[\s\S]*$/gi, "");

  // Kalıntı tag'ler
  cleaned = cleaned.replace(/<\/?invoke[^>]*>/gi, "");
  cleaned = cleaned.replace(/<parameter[^>]*>[\s\S]*?<\/parameter>/gi, "");

  // Çoklu boş satırı normale indir
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return { cleaned, hadFakeCall };
}
