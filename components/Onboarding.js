import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient' // Make sure this path matches your project structure

export default function Onboarding({ session }) {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatar_url, setAvatarUrl] = useState(null)

  useEffect(() => {
    let ignore = false
    async function getProfile() {
      setLoading(true)
      const { user } = session

      const { data, error } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', user.id)
        .single()

      if (!ignore && data) {
        setUsername(data.username || '')
        setWebsite(data.website || '')
        setAvatarUrl(data.avatar_url || '')
      }

      setLoading(false)
    }

    getProfile()

    return () => {
      ignore = true
    }
  }, [session])

  async function updateProfile(event) {
    event.preventDefault()

    setLoading(true)
    const { user } = session

    const updates = {
      id: user.id, // Required for the RLS policy (auth.uid() = id)
      username,
      website,
      avatar_url,
      updated_at: new Date(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)

    if (error) {
      alert(error.message)
    } else {
        alert('Profile updated successfully!')
    }
    setLoading(false)
  }

  return (
    <div className="form-widget">
        <h2>Complete your profile</h2>
        <p>Please provide a username to continue.</p>

      <form onSubmit={updateProfile} className="form-widget">
        
        {/* Email Field (Read Only) */}
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="text" value={session.user.email} disabled />
        </div>

        {/* Username Field with 20 Char Limit & Counter */}
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            required
            value={username}
            maxLength={20} // STOP user from typing past 20
            onChange={(e) => setUsername(e.target.value)}
          />
          
          {/* THE CHARACTER COUNTER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '5px' }}>
            <span>
                {/* Optional: Show helper text */}
                Unique handle
            </span>
            <span style={{ color: username.length === 20 ? 'red' : '#666' }}>
                {username.length}/20
            </span>
          </div>
        </div>

        {/* Website Field */}
        <div>
          <label htmlFor="website">Website</label>
          <input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div>
          <button className="button primary block" disabled={loading}>
            {loading ? 'Loading ...' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  )
}
