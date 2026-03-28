// Detects non-English text by checking for non-Latin script characters.
// Blocks submissions that contain significant amounts of non-Latin characters
// (e.g. Cyrillic, CJK, Arabic, Devanagari, etc.)

const LATIN_RANGE = /[a-zA-Z]/g;
const NON_LATIN_SCRIPTS = /[\u0400-\u04FF\u0500-\u052F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0E00-\u0E7F\u0E80-\u0EFF\u1000-\u109F\u1100-\u11FF\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/g;

/**
 * Returns true if the text appears to be English (Latin-script based).
 * Returns false if significant non-Latin characters are detected.
 */
export function isEnglishText(text) {
  if (!text || !text.trim()) return true;

  // Strip numbers, punctuation, spaces, and emojis to focus on actual letters
  const lettersOnly = text.replace(/[\d\s\p{P}\p{S}]/gu, "");

  // If there are no letters at all (just numbers/emojis/punctuation), allow it
  if (lettersOnly.length === 0) return true;

  const nonLatinMatches = lettersOnly.match(NON_LATIN_SCRIPTS) || [];
  const latinMatches = lettersOnly.match(LATIN_RANGE) || [];

  // If more than 30% of the letters are non-Latin, block it
  const totalLetters = nonLatinMatches.length + latinMatches.length;
  if (totalLetters === 0) return true;

  return nonLatinMatches.length / totalLetters < 0.3;
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
