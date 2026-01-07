import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Save, User, Globe, Sparkles } from 'lucide-react'

export default function Onboarding({ session, onComplete }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatar_url, setAvatarUrl] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let ignore = false
    async function getProfile() {
      setLoading(true)
      const { user } = session

      // Now that columns exist, this select will work
      const { data, error } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', user.id)
        .maybeSingle() // Use maybeSingle to avoid 406 errors if row is missing

      if (!ignore && data) {
        setUsername(data.username || '')
        setWebsite(data.website || '')
        setAvatarUrl(data.avatar_url || '')
      }
      setLoading(false)
    }

    getProfile()
    return () => { ignore = true }
  }, [session])

  async function updateProfile(event) {
    event.preventDefault()
    setSaving(true)
    setErrorMsg('')

    const { user } = session

    // Generate a default avatar if none exists, so the user isn't stuck in the loop
    const finalAvatar = avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`

    const updates = {
      id: user.id,
      username,
      website,
      avatar_url: finalAvatar,
      updated_at: new Date(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)

    if (error) {
      setErrorMsg(error.message)
      setSaving(false)
    } else {
      // SUCCESS: Call onComplete to close the modal
      if (onComplete) onComplete() 
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <Loader2 className="animate-spin text-yellow-500 w-10 h-10" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-2xl relative">
        
        {/* Header */}
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Welcome to WebWits!</h2>
            <p className="text-gray-500 text-sm">Create your handle to enter the arena.</p>
        </div>

        <form onSubmit={updateProfile} className="space-y-6">
          
          {/* Email (Read Only) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
            <input 
                type="text" 
                value={session.user.email} 
                disabled 
                className="w-full p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    maxLength={20}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 pl-10 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all font-bold"
                    placeholder="FunnyGuy123"
                />
                <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
            <div className="flex justify-between text-[10px] mt-1 text-gray-400 font-medium">
                <span>Unique handle visible on leaderboards</span>
                <span className={username.length === 20 ? 'text-red-500' : ''}>{username.length}/20</span>
            </div>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Website (Optional)</label>
            <div className="relative">
                <input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full p-3 pl-10 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all"
                    placeholder="https://..."
                />
                <Globe size={18} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          {errorMsg && (
             <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
                {errorMsg}
             </div>
          )}

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-lg p-4 rounded-xl shadow-lg shadow-yellow-200 hover:shadow-yellow-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            <span>{saving ? 'Joining...' : 'Enter Arena'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
