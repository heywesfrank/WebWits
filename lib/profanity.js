// The core list of words to filter. 
// The filter logic below will catch these words AND any word containing them 
// (e.g., "fuck" will catch "motherfucker", "fucking", "fucks", etc.)
export const BAD_WORDS = [
  "fuck",
  "bitch",
  "cunt",
  "fag",
  "nigger",
  "cock",
  "whore",
  "slut"
];

export const filterProfanity = (text) => {
  if (!text) return "";
  
  // Construct a regex that matches any word containing one of the BAD_WORDS.
  // \b   = word boundary (start of word)
  // \w* = any letters before the bad word (e.g., "mother" in "motherfucker")
  // (...) = one of the bad words
  // \w* = any letters after the bad word (e.g., "ing" in "fucking")
  // \b   = word boundary (end of word)
  const pattern = new RegExp(`\\b\\w*(${BAD_WORDS.join("|")})\\w*\\b`, "gi");

  // Replace found words with asterisks, preserving only first and last letter
  return text.replace(pattern, (match) => {
    if (match.length <= 2) return "*".repeat(match.length);
    return match[0] + "*".repeat(match.length - 2) + match[match.length - 1];
  });
};
