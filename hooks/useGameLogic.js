// hooks/useGameLogic.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { filterProfanity } from "@/lib/profanity";

export function useGameLogic(session, initialMeme = null, initialLeaderboard = []) {
  const [activeMeme, setActiveMeme] = useState(initialMeme);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [loading, setLoading] = useState(!initialMeme);

  const [selectedMeme, setSelectedMeme] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [archivedMemes, setArchivedMemes] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [viewMode, setViewMode] = useState("active");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toasts, setToasts] = useState([]);

  const userComments = session?.user && activeMeme 
    ? captions.filter(c => c.user_id === session.user.id) 
    : [];
    
  const hasDoubleBarrel = userProfile?.cosmetics?.consumable_double_meme_id === activeMeme?.id;
  const commentLimit = hasDoubleBarrel ? 2 : 1;
  const hasCommented = userComments.length >= commentLimit;

  const hasVotedOnAny = captions.some(c => c.hasVoted);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const fetchMemeComments = useCallback(async (memeId) => {
    if (!memeId) return [];

    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(`
        *, 
        profiles!comments_user_id_fkey(username, avatar_url, country, influencer, cosmetics, social_link),
        cutter:profiles!comments_mic_cut_by_fkey(username),
        squeezer:profiles!comments_squeezed_by_fkey(username),
        replies(
          id, content, created_at, user_id,
          profiles(username, avatar_url, country, influencer, social_link) 
        )
      `)
      .eq("meme_id", memeId)
      .lte("created_at", new Date().toISOString()) 
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: true }); 
    
    if (commentsError) {
      console.error("Comments fetch error:", commentsError);
      return [];
    }

    let formattedComments = comments || [];

    formattedComments.forEach(comment => {
       if (comment.replies) {
         comment.replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
       }
    });

    if (session?.user && formattedComments.length > 0) {
       const { data: myVotes } = await supabase
         .from("comment_votes") 
         .select("comment_id")
         .eq("user_id", session.user.id);
       
       const myVotedIds = new Set((myVotes || []).map(v => v.comment_id));

       formattedComments = formattedComments.map(c => ({
         ...c,
         hasVoted: myVotedIds.has(c.id)
       }));
    }

    return formattedComments;
  }, [session]);

  const fetchData = useCallback(async () => {
    try {
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUserProfile(profile);
        if (!profile?.username) setShowOnboarding(true);
      } else {
        setUserProfile(null);
      }

      let currentActive = activeMeme;
      if (!currentActive) {
        let { data: active } = await supabase.from("memes").select("*").eq("status", "active").single();
        if (active) {
            currentActive = active;
            setActiveMeme(active);
        }
      }

      if (currentActive) {
        const comments = await fetchMemeComments(currentActive.id);
        setCaptions(comments);
      }

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
      
      if (leaderboard.length === 0) {
        const { data: topUsers } = await supabase
          .from("profiles")
          .select("username, monthly_points")
          .order("monthly_points", { ascending: false })
          .limit(5);
          
        setLeaderboard(topUsers || []);
      }

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [session, fetchMemeComments, activeMeme, leaderboard.length]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const handleArchiveSelect = async (meme) => {
    setSelectedMeme(meme);
    setViewMode('archive-detail');
    setLoading(true);
    const comments = await fetchMemeComments(meme.id);
    setCaptions(comments);
    setLoading(false);
  };

  const handleBackToArena = async () => {
    setSelectedMeme(null);
    setViewMode('active');
    if (activeMeme) {
      const comments = await fetchMemeComments(activeMeme.id);
      setCaptions(comments);
    }
  };

  const submitCaption = async (text) => {
    if (!session?.user || !activeMeme) return false;
    
    if (hasCommented) {
      addToast("You've already hit your caption limit! 🛑", "error");
      return false;
    }

    const cleanText = filterProfanity(text);

    try {
      const { error } = await supabase.from('comments').insert({
        meme_id: activeMeme.id,
        user_id: session.user.id,
        content: cleanText
      });
      if (error) throw error;
      
      fetch('/api/notify-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId: session.user.id, 
            content: cleanText 
        })
      }).catch(err => console.error("Notification trigger failed", err));

      if (cleanText !== text) addToast("Caption polished & submitted! ✨", "success");
      else addToast("Caption submitted!", "success");
      
      const comments = await fetchMemeComments(activeMeme.id);
      setCaptions(comments);
      return true;
    } catch (err) {
      console.error(err);
      addToast("Failed to submit", "error");
      return false;
    }
  };

  const submitReply = async (commentId, text) => {
    if (!session?.user) return false;

    const cleanText = filterProfanity(text);

    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          userId: session.user.id,
          content: cleanText
        })
      });

      if (!res.ok) throw new Error("Reply failed");
      
      const updatedComments = await fetchMemeComments(activeMeme?.id || selectedMeme?.id);
      setCaptions(updatedComments);
      
      return true;
    } catch (err) {
      console.error("Reply failed:", err);
      addToast("Failed to reply", "error");
      return false;
    }
  };

  const castVote = async (commentId) => {
    if (!session?.user) {
        addToast("Please login to vote!", "error");
        return;
    }

    if (hasVotedOnAny) {
        addToast("Votes are permanent! No take-backs. 🔒", "error");
        return;
    }

    const targetComment = captions.find(c => c.id === commentId);
    const isRemoving = targetComment?.hasVoted;

    setCaptions((current) => 
      current.map((c) => 
        c.id === commentId 
          ? { 
              ...c, 
              vote_count: Math.max(0, (c.vote_count || 0) + (isRemoving ? -1 : 1)), 
              hasVoted: !isRemoving 
            } 
          : c
      )
    );

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          userId: session.user.id
        })
      });

      if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Vote failed");
      }

    } catch (err) {
      console.error("Vote failed:", err);
      addToast(err.message, "error");
      
      setCaptions((current) => 
        current.map((c) => 
          c.id === commentId ? { ...c, vote_count: (c.vote_count || 0) + (isRemoving ? 1 : -1), hasVoted: isRemoving } : c
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

  const editCaption = async (commentId, newText) => {
    if (!session?.user) return false;

    try {
      const res = await fetch('/api/comment/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          content: newText,
          userId: session.user.id
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      addToast("Caption updated! Mulligan consumed. ⛳", "success");
      fetchData();
      return true;

    } catch (err) {
      console.error("Edit failed:", err);
      addToast(err.message || "Failed to edit", "error");
      return false;
    }
  };

  const cutMic = async (commentId) => {
    if (!session?.user) return false;

    try {
      const res = await fetch('/api/comment/cut-mic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          userId: session.user.id
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      addToast("Mic successfully cut! 🤐", "success");
      fetchData();
      return true;

    } catch (err) {
      console.error("Cut Mic failed:", err);
      addToast(err.message || "Failed to cut mic", "error");
      return false;
    }
  };

  const squeezeComment = async (commentId) => {
    if (!session?.user) return false;

    try {
      const res = await fetch('/api/comment/squeeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          userId: session.user.id
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      addToast("Comment successfully squeezed! 🤏", "success");
      fetchData();
      return true;

    } catch (err) {
      console.error("Squeeze failed:", err);
      addToast(err.message || "Failed to squeeze comment", "error");
      return false;
    }
  };

  return {
    activeMeme, selectedMeme, captions, leaderboard, archivedMemes, userProfile,
    loading, viewMode, toasts, showOnboarding, hasCommented, hasVotedOnAny,
    setViewMode, setToasts, setShowOnboarding, fetchData,
    handleArchiveSelect, handleBackToArena, 
    submitCaption, submitReply, castVote, shareCaption, reportCaption, editCaption, cutMic, squeezeComment
  };
}
