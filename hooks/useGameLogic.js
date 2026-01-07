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
  const [showOnboarding, setShowOnboarding] = useState(false);
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
        if (!profile?.username) setShowOnboarding(true);
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
        // UPDATED: Now selecting country along with username and avatar_url
        const { data } = await supabase
          .from("comments")
          .select(`*, profiles(username, avatar_url, country)`)
          .eq("meme_id", active.id);
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

  // Realtime Subscription
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleArchiveSelect = (meme) => {
    setSelectedMeme(meme);
    setViewMode('archive-detail');
  };

  const handleBackToArena = () => {
    setSelectedMeme(null);
    setViewMode('active');
  };

  const submitCaption = async (text) => {
    if (!session?.user || !activeMeme) return false;
    try {
      const { error } = await supabase.from('comments').insert({
        meme_id: activeMeme.id,
        user_id: session.user.id,
        content: text
      });
      if (error) throw error;
      addToast("Caption submitted!", "success");
      fetchData();
      return true;
    } catch (err) {
      console.error(err);
      addToast("Failed to submit", "error");
      return false;
    }
  };

  const castVote = async (commentId) => {
    if (!session?.user) return;
    // Note: Actual voting logic/RPC would go here
    addToast("Vote cast!", "success");
  };

  const shareCaption = async (text) => {
    if (navigator.share) {
      try { await navigator.share({ title: 'WebWits', text }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(text);
      addToast("Copied to clipboard!", "success");
    }
  };

  const reportCaption = async (commentId) => {
    addToast("Reported. Thanks for keeping it clean.", "success");
  };

  return {
    activeMeme, selectedMeme, captions, leaderboard, archivedMemes, userProfile,
    loading, viewMode, toasts, showOnboarding,
    setViewMode, setToasts, setShowOnboarding,
    fetchData, handleArchiveSelect, handleBackToArena, 
    submitCaption, castVote, shareCaption, reportCaption
  };
}
