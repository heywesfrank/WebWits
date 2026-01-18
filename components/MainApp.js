"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Loader2, Flame, History, Trophy, ArrowLeft, Gift, BookOpen } from "lucide-react";

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

// Hooks
import { useGameLogic } from "@/hooks/useGameLogic";

export default function MainApp({ session }) {
  const {
    activeMeme, selectedMeme, captions, leaderboard, archivedMemes, userProfile,
    loading, viewMode, setViewMode, toasts, setToasts, submitReply,
    showOnboarding, setShowOnboarding, hasCommented,
    handleArchiveSelect, handleBackToArena, submitCaption, castVote, shareCaption, reportCaption
  } = useGameLogic(session);

  const [newCaption, setNewCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await submitCaption(newCaption);
    if (success) setNewCaption("");
    setSubmitting(false);
  };

  // [!code fix] IMPROVED NOTIFICATION CHECK
  useEffect(() => {
    const checkNotificationStatus = async () => {
      // 1. Must be logged in and done with onboarding
      if (!session?.user || showOnboarding) return;
      
      // 2. Browser must support it
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

      // 3. PWA Check: Only show if running in standalone mode (PWA)
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      if (!isPWA) return;

      // 4. If blocked, don't annoy them
      if (Notification.permission === 'denied') return;

      // 5. If 'default', ask for permission
      if (Notification.permission === 'default') {
         setTimeout(() => setShowNotifModal(true), 2000);
         return;
      }

      // 6. If 'granted', check if we ACTUALLY have a subscription
      if (Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            const sub = await registration.pushManager.getSubscription();
            // If no subscription exists, show the modal again so they can retry!
            if (!sub) {
               console.log("Permission granted but no subscription found. Prompting user...");
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

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-yellow-200 selection:text-black pb-24 md:pb-0">
      <Header session={session} profile={userProfile} onOpenProfile={() => setShowProfileModal(true)} />
      
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
      
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <UserProfileModal user={session?.user} profile={userProfile} isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      
      <LeaderboardModal leaderboard={leaderboard} isOpen={showLeaderboardModal} onClose={() => setShowLeaderboardModal(false)} />

      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Column */}
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
          <Link href="/how-it-works" className="flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-gray-400 active:text-gray-900 transition-all">
            <BookOpen size={20} /> <span className="whitespace-nowrap">How to Play</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
