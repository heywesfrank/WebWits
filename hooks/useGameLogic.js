import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useGameLogic(session) {
  const [activeMeme, setActiveMeme] = useState(null);
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [archivedMemes, setArchivedMemes] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("active");
  // REMOVED: const [showOnboarding, setShowOnboarding] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // 1. Initial Data Fetch
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUserProfile(profile);
        // REMOVED: if (!profile?.username || !profile?.avatar_url) setShowOnboarding(true);
      } else {
        setUserProfile(null);
      }

      let { data: active } = await supabase.from("memes").select("*").eq("status", "active").single();
      setActiveMeme(prev => (prev?.id === active?.id ? prev : active));

      let { data: archives } = await supabase
        .from("memes")
        .select(`*, comments (content, vote_count)`)
        .neq("status", "active")
        .order("created_at", { ascending: false });
      
      const processedArchives = (archives || []).map(archive => {
        if (archive.winning_caption) return archive;
        if (archive.comments?.length > 0) {
           const topComment = archive.comments.reduce((p, c) => (p.vote_count > c.vote_count) ? p : c);
           return { ...archive, winning_caption: topComment.content };
        }
        return archive;
      });
      setArchivedMemes(processedArchives);

      if (active) {
        const { data } = await supabase.from("comments").select(`*, profiles(username)`).eq("meme_id", active.id);
        setCaptions(data || []);
      }
      
      const { data: topUsers } = await supabase.from("profiles").select("username, weekly_points").order("weekly_points", { ascending: false }).limit(5);
      setLeaderboard(topUsers || []);

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // 2. Realtime Subscription
  useEffect(() => {
    if (!activeMeme) return;
    const channel = supabase.channel('public:comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, async (payload) => {
        if(payload.new.meme_id !== activeMeme.id) return;
        setCaptions(curr => {
            if (curr.some(c => c.id === payload.new.id)) return curr;
            supabase.from('comments').select(`*, profiles(username)`).eq('id', payload.new.id).single()
              .then(({ data: newComment }) => {
                 if(newComment) {
                    setCaptions(prev => [newComment, ...prev]);
                    addToast(`New caption from @${newComment.profiles?.username || 'anon'}!`, 'info');
                 }
              });
            return curr;
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comments' }, (payload) => {
        setCaptions(curr => curr.map(c => c.id === payload.new.id ? { ...c, vote_count: payload.new.vote_count } : c));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeMeme, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Actions
  const handleArchiveSelect = async (archiveMeme) => {
    setLoading(true);
    setSelectedMeme(archiveMeme);
    setViewMode('archive-detail');
    const { data } = await supabase.from("comments").select(`*, profiles(username)`).eq("meme_id", archiveMeme.id).order("vote_count", { ascending: false });
    setCaptions(data || []);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToArena = () => {
    setViewMode('active');
    setSelectedMeme(null);
    fetchData();
  };

  const submitCaption = async (text) => {
    if (!session || !text.trim()) return false;
    
    const { data: insertedComment, error } = await supabase.from("comments").insert({
      user_id: session.user.id,
      meme_id: activeMeme.id,
      content: text,
    }).select().single();
    
    if (error) {
      addToast(error.message, 'error');
      return false;
    } else {
      const commentForUI = {
         ...insertedComment,
         profiles: userProfile || { username: session.user.email.split('@')[0] },
         vote_count: 0
      };
      setCaptions(prev => [commentForUI, ...prev]);
      addToast("Caption submitted successfully!");
      return true;
    }
  };

  const castVote = async (commentId) => {
    if (viewMode === 'archive-detail') return; 
    if (!session) { addToast("Please sign in to vote!", "error"); return; }
    
    const prevCaptions = [...captions];
    setCaptions(curr => curr.map(c => c.id === commentId ? { ...c, vote_count: c.vote_count + 1, hasVoted: true } : c));
    
    const { error } = await supabase.from("votes").insert({ user_id: session.user.id, comment_id: commentId });
    if (error) {
      setCaptions(prevCaptions);
      addToast("You already voted for this!", "error");
    } else {
      await supabase.rpc("increment_vote", { row_id: commentId });
      addToast("Vote cast!", "success");
    }
  };

  const shareCaption = async (text) => {
    const url = "https://web-wits.vercel.app";
    const content = `WebWits Daily Challenge:\n"${text}"\n\nJoin the battle: ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'WebWits', text: content }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(content);
      addToast("Copied to clipboard!");
    }
  };

  const reportCaption = (id) => {
    setCaptions(curr => curr.filter(c => c.id !== id));
    addToast("Caption reported and hidden.", "info");
  };

  return {
    activeMeme, selectedMeme, captions, leaderboard, archivedMemes, userProfile,
    loading, viewMode, toasts, // REMOVED: showOnboarding
    setViewMode, setToasts, // REMOVED: setShowOnboarding
    fetchData, handleArchiveSelect, handleBackToArena, 
    submitCaption, castVote, shareCaption, reportCaption
  };
}
