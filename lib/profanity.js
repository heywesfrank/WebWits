// Map of words to their sanitized versions
// Add new words here to update the filter
export const BAD_WORDS = {
  "fuck": "fu**",
  "shit": "sh*t",
  "bitch": "bi*ch",
  "ass": "a**",
  "asshole": "a**hole",
  "dick": "d*ck",
  "pussy": "p*ssy",
  "bastard": "ba*tard",
  "crap": "cr*p",
  "damn": "d*mn"
};

export const filterProfanity = (text) => {
  if (!text) return "";
  
  // Create a regex that searches for these words (case-insensitive, whole words only)
  const pattern = new RegExp(`\\b(${Object.keys(BAD_WORDS).join("|")})\\b`, "gi");

  // Replace found words with the mapped value
  return text.replace(pattern, (match) => {
    return BAD_WORDS[match.toLowerCase()] || match;
  });
};
