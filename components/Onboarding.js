import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Save, User, Sparkles, Upload, Camera } from 'lucide-react'

export default function Onboarding({ session, onComplete }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let ignore = false
    async function getProfile() {
      setLoading(true)
      const { user } = session

      const { data } = await supabase
        .from('profiles')
        .select(`username, avatar_url`)
        .eq('id', user.id)
        .maybeSingle()

      if (!ignore && data) {
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || null)
      }
      setLoading(false)
    }

    getProfile()
    return () => { ignore = true }
  }, [session])

  async function uploadAvatar(event) {
    try {
      setUploading(true)
      setErrorMsg('')
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)

    } catch (error) {
      setErrorMsg('Error uploading image: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  async function updateProfile(event) {
    event.preventDefault()
    setSaving(true)
    setErrorMsg('')

    const { user } = session

    // Use uploaded avatar or generate a default one if skipped
    const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`

    const updates = {
      id: user.id,
      username,
      avatar_url: finalAvatar,
      updated_at: new Date(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)

    if (error) {
      setErrorMsg(error.message)
      setSaving(false)
    } else {
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
            <p className="text-gray-500 text-sm">Setup your profile to enter the arena.</p>
        </div>

        <form onSubmit={updateProfile} className="space-y-6">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
             <div className="relative group w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={40} />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={uploadAvatar} 
                    disabled={uploading}
                    className="hidden" 
                  />
                </label>
             </div>
             <p className="text-xs text-gray-500 font-medium">Click image to upload</p>
          </div>

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

          {errorMsg && (
             <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
                {errorMsg}
             </div>
          )}

          <button 
            type="submit" 
            disabled={saving || uploading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-lg p-4 rounded-xl shadow-lg shadow-yellow-200 hover:shadow-yellow-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            <span>{saving ? 'Saving...' : 'Enter Arena'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
