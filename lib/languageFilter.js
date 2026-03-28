// English-only language filter.
// Three-layer detection:
// 1. Non-Latin scripts (Cyrillic, CJK, Arabic, etc.)
// 2. Accented Latin character density (catches French, Spanish, German, etc.)
// 3. Common non-English word blacklist (catches accent-free foreign phrases)

const NON_LATIN_SCRIPTS = /[\u0400-\u04FF\u0500-\u052F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0E00-\u0E7F\u0E80-\u0EFF\u1000-\u109F\u1100-\u11FF\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/;

// Accented/extended Latin characters uncommon in English
const ACCENTED_LATIN = /[àâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿœšžß]/gi;
const BASIC_LATIN = /[a-zA-Z]/g;

// Common words/patterns from major non-English languages.
// These are words that almost never appear in English sentences.
const NON_ENGLISH_WORDS = [
  // French
  "bonjour", "salut", "merci", "oui", "une", "avec", "dans",
  "pour", "vous", "nous", "mais", "pas", "les", "des",
  "ses", "ces", "sont", "tout", "bien", "fait", "comme", "aussi",
  "très", "peut", "cette", "être", "avoir", "elle", "ils", "elles",
  "mon", "ton", "sur", "mec", "clin",
  // Spanish
  "hola", "gracias", "por", "que", "como", "pero", "para", "con",
  "una", "los", "las", "del", "muy", "más", "también", "puede",
  "tiene", "esta", "esto", "ese", "aquí", "donde", "cuando",
  "porque", "todo", "bueno", "malo", "amigo", "señor",
  // German
  "und", "ist", "ein", "eine", "nicht", "ich", "auf", "das", "die",
  "der", "mit", "sie", "sich", "von", "den", "dem", "auch", "nach",
  "noch", "aus", "aber", "kann", "nur", "schon", "wenn", "sein",
  "mein", "dein", "sehr", "gut", "nein", "danke", "bitte",
  // Portuguese
  "obrigado", "obrigada", "bom", "sim", "não", "muito", "como",
  "está", "isso", "aqui", "voce", "você", "ele", "ela", "nós",
  "por", "mais", "também", "quando", "onde",
  // Italian
  "ciao", "grazie", "buono", "buona", "come", "questo", "questa",
  "quello", "sono", "siamo", "anche", "perché", "quando", "sempre",
  "molto", "bene", "tutti", "ogni", "cosa", "fatto",
  // Dutch
  "goed", "niet", "een", "het", "van", "dat", "wat", "maar",
  "ook", "nog", "wel", "kan", "moet", "naar", "voor", "bij",
  // Turkish
  "bir", "için", "ile", "ama", "çok", "var", "yok", "değil",
  "nasıl", "neden", "nerede", "teşekkür", "merhaba", "güzel",
  // Indonesian/Malay
  "saya", "anda", "kami", "mereka", "sangat", "tidak", "bisa",
  "sudah", "akan", "bagus", "terima", "kasih",
];

// Build a Set of lowercase words for O(1) lookup
const NON_ENGLISH_SET = new Set(NON_ENGLISH_WORDS);

/**
 * Returns true if the text appears to be English.
 * Returns false if non-English signals are detected.
 */
export function isEnglishText(text) {
  if (!text || !text.trim()) return true;

  // Layer 1: Non-Latin script detection (instant block)
  if (NON_LATIN_SCRIPTS.test(text)) return false;

  // Strip everything except letters for density checks
  const lettersOnly = text.replace(/[\d\s\p{P}\p{S}]/gu, "");
  if (lettersOnly.length === 0) return true;

  // Layer 2: Accented character density
  // English very rarely uses accented characters (café, résumé, naïve are exceptions).
  // Allow up to 1 accented character as a freebie (common English borrowings),
  // then block if >5% of remaining letters are accented.
  const accentedCount = (lettersOnly.match(ACCENTED_LATIN) || []).length;
  const basicCount = (lettersOnly.match(BASIC_LATIN) || []).length;
  const totalLetters = accentedCount + basicCount;
  const effectiveAccented = Math.max(0, accentedCount - 1);

  if (totalLetters > 0 && effectiveAccented / totalLetters > 0.05) return false;

  // Layer 3: Common non-English word detection
  // Extract words, lowercase, and check against blacklist.
  // If 2+ distinct non-English words are found, block it.
  const words = text.toLowerCase().match(/[a-zà-öø-ÿ]+/gi) || [];
  const foundForeignWords = new Set();

  for (const word of words) {
    const lower = word.toLowerCase();
    // Skip very short words (1-2 chars) — too ambiguous across languages
    if (lower.length <= 2) continue;
    if (NON_ENGLISH_SET.has(lower)) {
      foundForeignWords.add(lower);
      if (foundForeignWords.size >= 2) return false;
    }
  }

  return true;
}

// Fun rejection messages for non-English captions
const REJECTION_MESSAGES = [
  "English only, wit warrior! 🇬🇧",
  "This arena speaks English! Try again. 🗣️",
  "Lost in translation! English captions only. 🔤",
  "Sir, this is an English-speaking meme battle. 🧐",
  "English or bust! Rewrite that caption. ✍️",
];

export function getRandomRejectionMessage() {
  return REJECTION_MESSAGES[Math.floor(Math.random() * REJECTION_MESSAGES.length)];
}
