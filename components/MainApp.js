// components/MainApp.js
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Send, Loader2, Flame, History, Trophy, ArrowLeft, Gift, BookOpen, AlertTriangle, X, Users, Copy, ShoppingBag, Gavel } from "lucide-react";

// Components
import Header from "./Header";
import ArchiveSection from "./ArchiveSection";
import ToastContainer from "./ToastContainer";
import UserProfileModal from "./UserProfileModal";
import HowToPlayButton from "./HowToPlayButton";
import PrizesButton from "./PrizesButton";
import Onboarding from "./Onboarding"; 
import LeaderboardWidget, { LeaderboardModal } from "./LeaderboardWidget";
import MemeStage from "./MemeStage";
import CaptionFeed from "./CaptionFeed";
import NotificationModal from "./NotificationModal"; 
import DailySpin from "./DailySpin"; 
import WinnerModal from "./WinnerModal"; 

// Hooks
import { useGameLogic } from "@/hooks/useGameLogic";

export default function MainApp({ initialMeme, initialLeaderboard }) {
  // 1. Handle Session State locally
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Pass initial data
  const {
    activeMeme, selectedMeme, captions, leaderboard, archivedMemes, userProfile,
    loading, viewMode, setViewMode, toasts, setToasts, submitReply,
    showOnboarding, setShowOnboarding, hasCommented, hasVotedOnAny, fetchData,
    handleArchiveSelect, handleBackToArena, submitCaption, castVote, shareCaption, reportCaption, editCaption
  } = useGameLogic(session, initialMeme, initialLeaderboard);

  const [newCaption, setNewCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // [NEW] Lifted Editing State for Mulligan Confirmation
  const [editingId, setEditingId] = useState(null);
  const [pendingEdit, setPendingEdit] = useState(null); // { id, text }

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  
  // Confirmation & Invite Popups
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(false);

  // New State for Winner Modal & Spin Control
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [spinAllowed, setSpinAllowed] = useState(false); // Defaults to false

  // Effect to check rank on load and block spin
  useEffect(() => {
    // Only run this logic if userProfile is actually loaded
    if (userProfile) {
        // If they have a rank (1, 2, or 3), show Winner Modal and BLOCK spin
        if (userProfile.daily_rank && userProfile.daily_rank > 0) {
           setShowWinnerModal(true);
           setSpinAllowed(false); 
        } else {
           // Otherwise, they are safe to spin
           setSpinAllowed(true); 
        }
    }
  }, [userProfile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCaption.trim()) return;
    setShowConfirm(true);
  };

  // [NEW] Wrapper to handle Edit requests from CaptionFeed
  const handleEditRequest = (id, text) => {
    setPendingEdit({ id, text });
    setShowConfirm(true);
  };

  // [CHANGED] Renamed/Updated to handle both Post and Edit confirmations
  const handleConfirmAction = async () => {
    setShowConfirm(false);
    setSubmitting(true);

    if (pendingEdit) {
       // --- Handle Edit Confirmation ---
       const success = await editCaption(pendingEdit.id, pendingEdit.text);
       if (success) {
          setPendingEdit(null);
          setEditingId(null); // Close the edit box in CaptionFeed
       }
    } else {
       // --- Handle New Post Confirmation ---
       const success = await submitCaption(newCaption);
       if (success) {
         setNewCaption("");

         // Start: Check for First-Time Invite Popup
         if (userProfile && !userProfile.has_seen_invite_popup) {
            setShowInvitePopup(true);
            
            if (session?.user?.id) {
              await supabase
                .from('profiles')
                .update({ has_seen_invite_popup: true })
                .eq('id', session.user.id);
                
              userProfile.has_seen_invite_popup = true;
            }
         }
       }
    }
    
    setSubmitting(false);
  };

  const handleInviteFriends = async () => {
    const shareData = {
        title: 'WebWits',
        text: "I just dropped a caption on WebWits. Come beat me if you can.",
        url: 'https://itswebwits.com'
    };

    if (navigator.share) {
        try { await navigator.share(shareData); } catch (err) {}
    } else {
        navigator.clipboard.writeText('https://itswebwits.com');
        setToasts(prev => [...prev, { id: Date.now(), msg: "Link copied! Send it.", type: "success" }]);
    }
    setShowInvitePopup(false);
  };

  // Notification Check Logic
  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!session?.user || showOnboarding) return;
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

      const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      if (!isPWA) return;

      if (Notification.permission === 'denied') return;

      if (Notification.permission === 'default') {
         setTimeout(() => setShowNotifModal(true), 2000);
         return;
      }

      if (Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            const sub = await registration.pushManager.getSubscription();
            if (!sub) {
               setTimeout(() => setShowNotifModal(true), 2000);
            }
          }
        } catch (err) {
          console.error("Error checking subscription:", err);
        }
      }
    };

    checkNotificationStatus();
  }, [session, showOnboarding]);

  const currentMeme = viewMode === 'active' ? activeMeme : selectedMeme;

  // Gatekeeper Logic: Must vote before commenting (unless you are the first)
  const needsToVote = viewMode === 'active' && captions.length > 0 && !hasVotedOnAny;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-yellow-200 selection:text-black pb-24 md:pb-0">
      <Header 
        session={session} 
        profile={userProfile} 
        onOpenProfile={() => setShowProfileModal(true)} 
        onOpenInvite={() => setShowInvitePopup(true)} 
      />

      {/* Winner Modal displayed if daily_rank exists */}
      {showWinnerModal && session && (
        <WinnerModal 
           rank={userProfile.daily_rank} 
           userId={session.user.id}
           onClose={() => {
              setShowWinnerModal(false);
              setSpinAllowed(true); // NOW allow spin to run
              fetchData(); // Refresh to ensure rank is cleared in local state
           }} 
        />
      )}
      
      {/* Daily Spin controlled by spinAllowed */}
      <DailySpin 
        session={session} 
        userProfile={userProfile} 
        canSpin={spinAllowed}
        onSpinComplete={(newTotal) => {
           setToasts(prev => [...prev, { id: Date.now(), msg: `WitCoins updated! Total: ${newTotal}`, type: "success" }]);
           fetchData();
        }}
      />
      
      {showOnboarding && (
        <Onboarding 
          session={session} 
          onComplete={() => { 
            setShowOnboarding(false); 
            window.location.reload(); 
          }} 
        />
      )}
      
      <NotificationModal 
        session={session} 
        isOpen={showNotifModal} 
        onClose={() => setShowNotifModal(false)} 
      />

      {showInvitePopup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 relative animate-in zoom-in-95 duration-300 text-center">
             
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Users size={32} className="text-blue-600" />
            </div>

            <h2 className="text-2xl font-black text-gray-900 font-display mb-2">
               You're funny. <br/> Are your friends?
            </h2>
            
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
               If your caption is this good, your circle must be witty too. Don't hoard the laughter—invite them to the arena.
            </p>

            <div className="space-y-3">
               <button 
                 onClick={handleInviteFriends}
                 className="w-full py-3.5 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition shadow-sm flex items-center justify-center gap-2"
               >
                 <span>Invite the Crew</span> <Users size={18} />
               </button>
               
               <button 
                 onClick={() => setShowInvitePopup(false)}
                 className="text-gray-400 text-xs font-bold hover:text-gray-600 transition"
               >
                 I prefer to ride solo (Skip)
               </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setShowConfirm(false); setPendingEdit(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-4 pt-2">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} className="text-yellow-600" />
              </div>
              
              <h2 className="text-xl font-black text-gray-900 font-display">
                {pendingEdit ? "Confirm Edit?" : "Are you sure?"}
              </h2>
              
              <p className="text-gray-500 text-sm leading-relaxed">
                {pendingEdit 
                  ? "This will consume your Mulligan. There are no second chances." 
                  : "There is no edit button in the arena. Once this drops, it's eternal. Is this your funniest work?"
                }
              </p>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-800 font-medium italic text-sm break-words relative">
                <span className="text-gray-300 font-serif text-4xl absolute -top-2 left-2">“</span>
                {pendingEdit ? pendingEdit.text : newCaption}
                <span className="text-gray-300 font-serif text-4xl absolute -bottom-4 right-2">”</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setShowConfirm(false); setPendingEdit(null); }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  Wait
                </button>
                <button 
                  onClick={handleConfirmAction}
                  className="flex-1 px-4 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition shadow-sm"
                >
                  {pendingEdit ? "Save Edit" : "Post It! 🚀"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <UserProfileModal user={session?.user} profile={userProfile} isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      
      <LeaderboardModal leaderboard={leaderboard} isOpen={showLeaderboardModal} onClose={() => setShowLeaderboardModal(false)} />

      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="hidden md:flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit">
            <button onClick={handleBackToArena} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${viewMode === 'active' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              <Flame size={16} /> Active Battle
            </button>
            <button onClick={() => setViewMode('archive')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${viewMode === 'archive' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              <History size={16} /> Archive
            </button>
          </div>

          {viewMode === 'archive' ? (
             <ArchiveSection archives={archivedMemes} onSelectMeme={handleArchiveSelect} />
          ) : (
            <>
              {viewMode === 'archive-detail' && (
                <button onClick={() => setViewMode('archive')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black mb-2 transition-colors">
                  <ArrowLeft size={16} /> Back to Archives
                </button>
              )}

              <div className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden relative">
                <MemeStage 
                  meme={currentMeme} 
                  isActive={viewMode === 'active'} 
                  loading={loading && !currentMeme} 
                />
                
                {viewMode === 'active' && currentMeme && (
                  session ? (
                    hasCommented ? (
                        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm font-bold text-gray-500 flex items-center justify-center gap-2">
                            <span>You've fired your shot today! Check back tomorrow.</span>
                        </div>
                    ) : needsToVote ? (
                         // THE "MUST VOTE" TOLL BOOTH
                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col items-center text-center animate-in fade-in duration-300">
                           <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                              <Gavel size={20} className="text-yellow-600" />
                           </div>
                           <h3 className="font-black font-display text-gray-900 uppercase tracking-wide mb-1">
                              Judge before you get Judged
                           </h3>
                           <p className="text-sm text-gray-500 max-w-sm mx-auto">
                              The arena has a toll fee: <strong>1 Vote</strong>. <br/>
                              Rate a caption below to unlock the mic.
                           </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-4 flex gap-2 bg-gray-50 border-t border-gray-200">
                            <input type="text" value={newCaption} onChange={(e) => setNewCaption(e.target.value)} placeholder="Write a witty caption..." disabled={submitting} className="flex-1 p-3 rounded-lg bg-white border border-gray-300 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all placeholder:text-gray-500 text-gray-900" />
                            <button type="submit" disabled={submitting || !newCaption.trim()} className="bg-yellow-400 text-black font-bold p-3 rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition shadow-sm">
                            {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </form>
                    )
                  ) : (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-yellow-600 hover:text-yellow-700 hover:underline">
                           <span>Sign in to play & join the battle!</span> <Send size={14} />
                        </Link>
                    </div>
                  )
                )}
                {viewMode === 'archive-detail' && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500 font-medium">This contest has ended. All glory is eternal.</div>
                )}
              </div>

              <CaptionFeed 
                captions={captions}
                meme={currentMeme} 
                session={session} 
                viewMode={viewMode}
                onVote={castVote}
                onShare={shareCaption}
                onReport={reportCaption}
                onReply={submitReply}
                onEdit={handleEditRequest} // Pass wrapper
                editingId={editingId}      // Pass state
                setEditingId={setEditingId}// Pass setter
              />
            </>
          )}
        </div>

        <div className="hidden md:block md:col-span-1 space-y-6 sticky top-24 h-fit">
          <LeaderboardWidget initialLeaders={leaderboard} />
          <HowToPlayButton />
          <PrizesButton />
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-6 pt-2 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-5 items-end justify-items-center w-full px-2">
          <button onClick={handleBackToArena} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${viewMode === 'active' ? 'text-yellow-500 scale-105' : 'text-gray-400'}`}>
            <Flame size={20} /> <span>Battle</span>
          </button>
          <button onClick={() => setShowLeaderboardModal(true)} className="flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-gray-400 active:text-gray-900 transition-all">
            <Trophy size={20} /> <span>Rank</span>
          </button>
          <Link href="/prizes" className="flex flex-col items-center justify-center gap-1 text-xs font-black text-yellow-600 animate-pulse transition-all hover:text-yellow-700 scale-110 -mt-2">
            <Gift size={28} className="fill-yellow-100" /> 
            <span className="whitespace-nowrap leading-none">Free Prizes</span>
          </Link>
          <button onClick={() => setViewMode('archive')} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${viewMode === 'archive' || viewMode === 'archive-detail' ? 'text-yellow-500 scale-105' : 'text-gray-400'}`}>
            <History size={20} /> <span>Archive</span>
          </button>
<Link href="/store" className="flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-gray-400 active:text-gray-900 transition-all">
            <ShoppingBag size={20} /> <span className="whitespace-nowrap">WitCoin Store</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
