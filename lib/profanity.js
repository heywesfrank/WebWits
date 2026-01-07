export const BAD_WORDS = {
  // originals
  "fuck": "fu**",
  "shit": "sh*t",
  "bitch": "bi*ch",
  "ass": "a**",
  "asshole": "a**hole",
  "dick": "d*ck",
  "pussy": "p*ssy",
  "bastard": "ba*tard",
  "crap": "cr*p",
  "damn": "d*mn",

  // fuck variants
  "fucks": "fu**s",
  "fucked": "fu****",
  "fucking": "fu*****",
  "fucker": "fu***r",
  "fuckers": "fu****s",
  "motherfucker": "mo**********r",
  "motherfuckers": "mo***********s",
  "motherfucking": "mo***********g",

  // shit variants / compounds
  "shits": "sh**s",
  "shitty": "sh***y",
  "bullshit": "bu******",
  "horseshit": "ho*******",
  "dipshit": "di*****",
  "shithead": "sh******",
  "shitheads": "sh*******s",
  "shitface": "sh*******",
  "shitbag": "sh*****g",
  "shitbags": "sh******s",

  // bitch variants / compounds
  "bitches": "bi****s",
  "bitchy": "bi***y",
  "sonofabitch": "so*********h",

  // ass variants / compounds
  "asses": "a***s",
  "jackass": "ja****",
  "jackasses": "ja*****s",
  "dumbass": "du****",
  "dumbasses": "du*****s",
  "badass": "ba****",
  "asshat": "a**hat",
  "asshats": "a***hats",
  "asswipe": "a*****e",
  "asswipes": "a******s",

  // dick variants / compounds
  "dicks": "d***s",
  "dickhead": "d******d",
  "dickheads": "d*******s",

  // other common profanity
  "cunt": "c**t",
  "cunts": "c***s",
  "twat": "t**t",
  "twats": "t***s",
  "prick": "pr**k",
  "pricks": "pr***s",
  "cock": "c**k",
  "cocks": "c***s",
  "cocksucker": "co*******r",
  "cocksuckers": "co********s",

  // “crap” family
  "crappy": "cr***y",

  // damn variants
  "goddamn": "go*****",
  "goddamned": "go*******",
  "goddammit": "go*******t",

  // piss variants
  "piss": "p**s",
  "pissed": "p****d",
  "pisses": "p****s",
  "pissing": "p*****g",

  // insults commonly treated as profanity
  "douche": "do****",
  "douches": "do*****s",
  "douchebag": "do*******",
  "douchebags": "do********s",
  "slut": "sl*t",
  "sluts": "sl**s",
  "whore": "wh**e",
  "whores": "wh***s",
  "hoe": "h*e",
  "hoes": "h**s",

  // UK/AU-flavored (optional)
  "wanker": "wa****r",
  "wankers": "wa*****s",
  "bollocks": "bo******",
  "bugger": "bu****r",
  "arse": "a**e",
  "arsehole": "a**ehole"
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
