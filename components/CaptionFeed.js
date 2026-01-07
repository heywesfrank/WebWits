import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Flag, Trophy, ThumbsUp } from "lucide-react";

// Helper: Map Country Names to ISO Codes for Emoji Generation
const COUNTRY_CODES = {
  "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Andorra": "AD", "Angola": "AO", 
  "Antigua and Barbuda": "AG", "Argentina": "AR", "Armenia": "AM", "Australia": "AU", "Austria": "AT", 
  "Azerbaijan": "AZ", "Bahamas": "BS", "Bahrain": "BH", "Bangladesh": "BD", "Barbados": "BB", 
  "Belarus": "BY", "Belgium": "BE", "Belize": "BZ", "Benin": "BJ", "Bhutan": "BT", "Bolivia": "BO", 
  "Bosnia and Herzegovina": "BA", "Botswana": "BW", "Brazil": "BR", "Brunei": "BN", "Bulgaria": "BG", 
  "Burkina Faso": "BF", "Burundi": "BI", "Cabo Verde": "CV", "Cambodia": "KH", "Cameroon": "CM", 
  "Canada": "CA", "Central African Republic": "CF", "Chad": "TD", "Chile": "CL", "China": "CN", 
  "Colombia": "CO", "Comoros": "KM", "Congo (Congo-Brazzaville)": "CG", "Costa Rica": "CR", 
  "Croatia": "HR", "Cuba": "CU", "Cyprus": "CY", "Czechia (Czech Republic)": "CZ", 
  "Democratic Republic of the Congo": "CD", "Denmark": "DK", "Djibouti": "DJ", "Dominica": "DM", 
  "Dominican Republic": "DO", "East Timor (Timor-Leste)": "TL", "Ecuador": "EC", "Egypt": "EG", 
  "El Salvador": "SV", "Equatorial Guinea": "GQ", "Eritrea": "ER", "Estonia": "EE", "Eswatini": "SZ", 
  "Ethiopia": "ET", "Fiji": "FJ", "Finland": "FI", "France": "FR", "Gabon": "GA", "Gambia": "GM", 
  "Georgia": "GE", "Germany": "DE", "Ghana": "GH", "Greece": "GR", "Grenada": "GD", "Guatemala": "GT", 
  "Guinea": "GN", "Guinea-Bissau": "GW", "Guyana": "GY", "Haiti": "HT", "Honduras": "HN", 
  "Hungary": "HU", "Iceland": "IS", "India": "IN", "Indonesia": "ID", "Iran": "IR", "Iraq": "IQ", 
  "Ireland": "IE", "Israel": "IL", "Italy": "IT", "Ivory Coast": "CI", "Jamaica": "JM", "Japan": "JP", 
  "Jordan": "JO", "Kazakhstan": "KZ", "Kenya": "KE", "Kiribati": "KI", "Kuwait": "KW", 
  "Kyrgyzstan": "KG", "Laos": "LA", "Latvia": "LV", "Lebanon": "LB", "Lesotho": "LS", "Liberia": "LR", 
  "Libya": "LY", "Liechtenstein": "LI", "Lithuania": "LT", "Luxembourg": "LU", "Madagascar": "MG", 
  "Malawi": "MW", "Malaysia": "MY", "Maldives": "MV", "Mali": "ML", "Malta": "MT", 
  "Marshall Islands": "MH", "Mauritania": "MR", "Mauritius": "MU", "Mexico": "MX", "Micronesia": "FM", 
  "Moldova": "MD", "Monaco": "MC", "Mongolia": "MN", "Montenegro": "ME", "Morocco": "MA", 
  "Mozambique": "MZ", "Myanmar (formerly Burma)": "MM", "Namibia": "NA", "Nauru": "NR", "Nepal": "NP", 
  "Netherlands": "NL", "New Zealand": "NZ", "Nicaragua": "NI", "Niger": "NE", "Nigeria": "NG", 
  "North Korea": "KP", "North Macedonia": "MK", "Norway": "NO", "Oman": "OM", "Pakistan": "PK", 
  "Palau": "PW", "Palestine State": "PS", "Panama": "PA", "Papua New Guinea": "PG", "Paraguay": "PY", 
  "Peru": "PE", "Philippines": "PH", "Poland": "PL", "Portugal": "PT", "Qatar": "QA", "Romania": "RO", 
  "Russia": "RU", "Rwanda": "RW", "Saint Kitts and Nevis": "KN", "Saint Lucia": "LC", 
  "Saint Vincent and the Grenadines": "VC", "Samoa": "WS", "San Marino": "SM", 
  "Sao Tome and Principe": "ST", "Saudi Arabia": "SA", "Senegal": "SN", "Serbia": "RS", 
  "Seychelles": "SC", "Sierra Leone": "SL", "Singapore": "SG", "Slovakia": "SK", "Slovenia": "SI", 
  "Solomon Islands": "SB", "Somalia": "SO", "South Africa": "ZA", "South Korea": "KR", 
  "South Sudan": "SS", "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD", "Suriname": "SR", 
  "Sweden": "SE", "Switzerland": "CH", "Syria": "SY", "Taiwan": "TW", "Tajikistan": "TJ", 
  "Tanzania": "TZ", "Thailand": "TH", "Togo": "TG", "Tonga": "TO", "Trinidad and Tobago": "TT", 
  "Tunisia": "TN", "Turkey": "TR", "Turkmenistan": "TM", "Tuvalu": "TV", "Uganda": "UG", 
  "Ukraine": "UA", "United Arab Emirates": "AE", "United Kingdom": "GB", 
  "United States of America": "US", "Uruguay": "UY", "Uzbekistan": "UZ", "Vanuatu": "VU", 
  "Vatican City": "VA", "Venezuela": "VE", "Vietnam": "VN", "Yemen": "YE", "Zambia": "ZM", 
  "Zimbabwe": "ZW"
};

function getCountryFlag(countryName) {
  const code = COUNTRY_CODES[countryName];
  if (!code) return null;
  // Convert 2-letter ISO code to flag emoji
  return code
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

export default function CaptionFeed({ captions, session, viewMode, onVote, onShare, onReport }) {
  const [sortBy, setSortBy] = useState("top");

  const sortedCaptions = [...captions].sort((a, b) => 
    sortBy === "top" ? b.vote_count - a.vote_count : new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div className="space-y-4">
      {/* Feed Controls */}
      <div className="flex justify-between items-center px-1">
        <h3 className="font-bold text-gray-800 font-display text-lg">
          {captions.length} {captions.length === 1 ? 'Caption' : 'Captions'}
        </h3>
        <div className="flex gap-2 text-sm bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button onClick={() => setSortBy('top')} className={`px-3 py-1 rounded transition ${sortBy === 'top' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Top</button>
          {viewMode === 'active' && (
            <button onClick={() => setSortBy('new')} className={`px-3 py-1 rounded transition ${sortBy === 'new' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>New</button>
          )}
        </div>
      </div>

      {/* List */}
      {sortedCaptions.map((caption, index) => {
        const isWinner = viewMode === 'archive-detail' && index === 0 && sortBy === 'top';
        const username = caption.profiles?.username || "anon";
        const avatarUrl = caption.profiles?.avatar_url;
        const country = caption.profiles?.country;

        return (
          <div key={caption.id} className={`relative bg-white border p-4 rounded-xl shadow-sm flex gap-4 transition hover:border-gray-300 group ${isWinner ? 'border-yellow-400 ring-1 ring-yellow-400 bg-yellow-50/30' : 'border-gray-200'}`}>
            {isWinner && (
              <div className="absolute -top-3 -left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
                <Trophy size={10} /> CHAMPION
              </div>
            )}

            {/* Avatar Column */}
            <div className="flex-shrink-0 pt-1">
              <div className="h-9 w-9 bg-gray-100 rounded-full overflow-hidden border border-gray-200 relative shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-yellow-100 text-yellow-600 font-bold text-xs">
                    {username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-bold text-xs ${isWinner ? 'text-black' : 'text-gray-500'} flex items-center gap-1`}>
                  @{username}
                  {country && (
                    <span title={country} className="text-sm cursor-help opacity-90 hover:opacity-100 transition-opacity">
                      {getCountryFlag(country)}
                    </span>
                  )}
                </span>
                {session && caption.user_id === session.user.id && (
                  <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded border border-yellow-200 font-bold">YOU</span>
                )}
                {caption.vote_count > 10 && viewMode === 'active' && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded border border-red-200">🔥 Hot</span>}
              </div>
              <p className="text-lg text-gray-800 leading-snug font-medium">{caption.content}</p>
              
              <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onShare(caption.content)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-800 transition"><Share2 size={12} /> Share</button>
                {viewMode === 'active' && (
                  <button onClick={() => onReport(caption.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition"><Flag size={12} /> Report</button>
                )}
              </div>
            </div>
            
            <motion.button
              whileHover={viewMode === 'active' ? { scale: 1.1 } : {}}
              whileTap={viewMode === 'active' ? { scale: 0.9 } : {}}
              onClick={() => onVote(caption.id)}
              disabled={viewMode === 'archive-detail'} 
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${caption.hasVoted ? 'text-yellow-500' : viewMode === 'archive-detail' ? 'text-gray-400 cursor-default' : 'text-gray-400 hover:text-yellow-500'}`}
            >
              {isWinner ? <Trophy size={24} className="fill-yellow-400 text-yellow-600" /> : <ThumbsUp size={24} className={`transition-all ${caption.vote_count > 0 ? 'fill-yellow-100' : ''}`} />}
              <span className={`font-bold text-sm ${isWinner ? 'text-yellow-700' : ''}`}>{caption.vote_count}</span>
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}
