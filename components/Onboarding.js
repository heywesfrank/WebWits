"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Camera, User, Loader2, ArrowRight, Check, Globe } from "lucide-react";

// Extensive list of countries for the dropdown
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "East Timor (Timor-Leste)", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

export default function Onboarding({ session, onComplete }) {
  const [step, setStep] = useState(1); // 1: Avatar, 2: Username, 3: Country
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);

  // Handle Image Upload
  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle Final Submission
  const handleSubmit = async () => {
    if (!username.trim() || !avatarUrl || !country) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          username: username,
          avatar_url: avatarUrl,
          email: session.user.email,
          country: country,
          updated_at: new Date(),
        });

      if (error) throw error;
      onComplete(); // Notify parent to close onboarding
    } catch (error) {
      alert('Error saving profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper for dynamic headings
  const getHeading = () => {
    switch(step) {
      case 1: return "We've seen worse. Pick a pic.";
      case 2: return "What should we call you?";
      case 3: return "Where are you roasting from?";
      default: return "";
    }
  };

  const getSubHeading = () => {
    switch(step) {
      case 1: return "Upload an image to represent you in the arena.";
      case 2: return "This name is permanent - choose wisely.";
      case 3: return "Your country (so that we can send the prize). No stalking.";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl rounded-2xl p-8 animate-in fade-in zoom-in duration-300">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-yellow-400' : 'bg-gray-100'}`} />
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-yellow-400' : 'bg-gray-100'}`} />
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-yellow-400' : 'bg-gray-100'}`} />
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-2 font-display">
          {getHeading()}
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          {getSubHeading()}
        </p>

        {/* STEP 1: AVATAR UPLOAD */}
        {step === 1 && (
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-6 overflow-hidden group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera size={32} className="text-gray-400" />
              )}
              
              <label className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center cursor-pointer transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  disabled={uploading}
                  className="hidden" 
                />
                {uploading && <Loader2 className="animate-spin text-yellow-400" />}
              </label>
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={!avatarUrl}
              className="w-full bg-black text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: USERNAME */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  maxLength={20}
                  onChange={(e) => setUsername(e.target.value.trim())}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none font-bold text-gray-900"
                />
              </div>
              <div className="flex justify-end mt-1">
                 <span className={`text-[10px] font-medium ${username.length === 20 ? 'text-red-500' : 'text-gray-400'}`}>
                    {username.length}/20
                 </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={!username}
                className="flex-[2] px-4 py-3 bg-black text-white font-bold rounded-xl disabled:opacity-50 hover:bg-gray-800 transition flex items-center justify-center gap-2"
              >
                Next Step <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: COUNTRY DROPDOWN */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className="relative">
                <Globe className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" size={20} />
                <select 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none font-bold text-gray-900 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select a country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {/* Custom arrow if desired, though native select arrows vary by browser */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
              >
                Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!country || saving}
                className="flex-[2] px-4 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : (
                   <>Finish <Check size={18} /></>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
