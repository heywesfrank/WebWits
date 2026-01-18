import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { filterProfanity } from "@/lib/profanity";

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

  // Check if current user has commented on the active meme
  const hasCommented = session?.user && activeMeme 
    ? captions.some(c => c.user_id === session.user.id) 
    : false;

  // Toast Helper
  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // Helper: Fetch comments for a specific meme
  const fetchMemeComments = useCallback(async (memeId) => {
    if (!memeId) return [];

    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      // Added 'influencer' to the select query
      .select(`*, profiles!comments_user_id_fkey(username, avatar_url, country, influencer)`)
      .eq("meme_id", memeId);
    
    if (commentsError) {
      console.error("Comments fetch error:", commentsError);
      return [];
    }

    let formattedComments = comments || [];

    // If user is logged in, check which ones they voted for
    if (session?.user && formattedComments.length > 0) {
       const { data: myVotes, error: votesError } = await supabase
         .from("comment_votes") 
         .select("comment_id")
         .eq("user_id", session.user.id);

       if (votesError) {
         console.error("Votes fetch error:", votesError);
       }
       
       const myVotedIds = new Set((myVotes || []).map(v => v.comment_id));

       // Mark comments as voted
       formattedComments = formattedComments.map(c => ({
         ...c,
         hasVoted: myVotedIds.has(c.id)
       }));
    }

    return formattedComments;
  }, [session]);

  // 1. Initial Data Fetch
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // A. Fetch User Profile
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUserProfile(profile);
        if (!profile?.username) setShowOnboarding(true);
      } else {
        setUserProfile(null);
      }

      // B. Fetch Active Meme
      let { data: active } = await supabase.from("memes").select("*").eq("status", "active").single();
      setActiveMeme(prev => (prev?.id === active?.id ? prev : active));
      
      // C. Fetch Archives
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

      // D. Fetch Comments & User Votes for Active Meme
      if (active) {
        const comments = await fetchMemeComments(active.id);
        setCaptions(comments);
      }
      
      // E. Fetch Leaderboard
      const { data: topUsers } = await supabase.from("profiles").select("username, weekly_points").order("weekly_points", { ascending: false }).limit(5);
      setLeaderboard(topUsers || []);

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [session, fetchMemeComments]);

  // Realtime Subscription
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleArchiveSelect = async (meme) => {
    setSelectedMeme(meme);
    setViewMode('archive-detail');
    
    // Fetch comments for the archived meme
    setLoading(true);
    const comments = await fetchMemeComments(meme.id);
    setCaptions(comments);
    setLoading(false);
  };

  const handleBackToArena = async () => {
    setSelectedMeme(null);
    setViewMode('active');

    // Re-fetch active meme comments
    if (activeMeme) {
      setLoading(true);
      const comments = await fetchMemeComments(activeMeme.id);
      setCaptions(comments);
      setLoading(false);
    }
  };

  const submitCaption = async (text) => {
    if (!session?.user || !activeMeme) return false;
    
    // Enforce one comment per day
    if (hasCommented) {
      addToast("You've already submitted a caption today! 🚫", "error");
      return false;
    }

    // Filter the text using the utility
    const cleanText = filterProfanity(text);

    try {
      const { error } = await supabase.from('comments').insert({
        meme_id: activeMeme.id,
        user_id: session.user.id,
        content: cleanText
      });
      if (error) throw error;
      
      if (cleanText !== text) {
        addToast("Caption polished & submitted! 🧼", "success");
      } else {
        addToast("Caption submitted!", "success");
      }
      
      // We only strictly need to re-fetch comments here, but fetchData is fine
      fetchData();
      return true;
    } catch (err) {
      console.error(err);
      addToast("Failed to submit", "error");
      return false;
    }
  };

const castVote = async (commentId) => {
    if (!session?.user) {
        addToast("Please login to vote!", "error");
        return;
    }

    // Determine intent: Are we adding or removing?
    const targetComment = captions.find(c => c.id === commentId);
    const isRemoving = targetComment?.hasVoted;

    // 1. Optimistic UI Update
    setCaptions((current) => 
      current.map((c) => 
        c.id === commentId 
          ? { 
              ...c, 
              // If removing, subtract 1. If adding, add 1.
              vote_count: Math.max(0, (c.vote_count || 0) + (isRemoving ? -1 : 1)), 
              hasVoted: !isRemoving 
            } 
          : c
      )
    );

    try {
      // 2. Call the new TOGGLE function
      const { error } = await supabase.rpc('toggle_vote', { 
        vote_comment_id: commentId, 
        vote_user_id: session.user.id 
      });
      
      if (error) throw error;
      
      // Optional: Different toast messages
      // if (isRemoving) addToast("Vote removed", "success");
      // else addToast("Vote cast!", "success");

    } catch (err) {
      console.error("Vote failed:", err);
      addToast("Failed to update vote", "error");
      
      // 3. Revert Optimistic Update if it failed
      setCaptions((current) => 
        current.map((c) => 
          c.id === commentId 
            ? { 
                ...c, 
                vote_count: (c.vote_count || 0) + (isRemoving ? 1 : -1), 
                hasVoted: isRemoving 
              } 
            : c
        )
      );
    }
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
    loading, viewMode, toasts, showOnboarding, hasCommented,
    setViewMode, setToasts, setShowOnboarding,
    fetchData, handleArchiveSelect, handleBackToArena, 
    submitCaption, castVote, shareCaption, reportCaption
  };
}
