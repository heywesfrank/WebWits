"use client";
import { useState } from "react";
import Link from "next/link";
import { Send, Loader2, Flame, History, Trophy, ArrowLeft } from "lucide-react";

// Components
import Header from "./Header";
import ArchiveSection from "./ArchiveSection";
import ToastContainer from "./ToastContainer";
import UserProfileModal from "./UserProfileModal";
import HowToPlayButton from "./HowToPlayButton";
import Onboarding from "./Onboarding";
import LeaderboardWidget, { LeaderboardModal } from "./LeaderboardWidget";
import MemeStage from "./MemeStage";
import CaptionFeed from "./CaptionFeed";

// Hooks
import { useGameLogic } from "@/hooks/useGameLogic";

export default function MainApp({ session }) {
  const {
    activeMeme, selectedMeme, captions, leaderboard, archivedMemes, userProfile,
    loading, viewMode, setViewMode, showOnboarding, setShowOnboarding, toasts, setToasts,
    handleArchiveSelect, handleBackToArena, submitCaption, castVote, shareCaption, reportCaption
  } = useGameLogic(session);

  const [newCaption, setNewCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await submitCaption(newCaption);
    if (success) setNewCaption("");
    setSubmitting(false);
  };

  if (loading && !activeMeme && viewMode === 'active') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
         <Loader2 className="animate-spin text-yellow-500 w-10 h-10" />
         <p className="text-gray-500 animate-pulse font-mono">Summoning content...</p>
      </div>
    );
  }

  const currentMeme = viewMode === 'active' ? activeMeme : selectedMeme;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-yellow-200 selection:text-black pb-20 md:pb-0">
      <Header session={session} profile={userProfile} onOpenProfile={() => setShowProfileModal(true)} />
      
      {showOnboarding && <Onboarding session={session} onComplete={() => setShowOnboarding(false)} />}
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <UserProfileModal user={session?.user} profile={userProfile} isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <LeaderboardModal leaderboard={leaderboard} isOpen={showLeaderboardModal} onClose={() => setShowLeaderboardModal(false)} />

      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Game Mode Toggles */}
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
              {/* Back Button (Archive Detail) */}
              {viewMode === 'archive-detail' && (
                <button onClick={() => setViewMode('archive')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black mb-2 transition-colors">
                  <ArrowLeft size={16} /> Back to Archives
                </button>
              )}

              {/* Meme Card */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden relative">
                <MemeStage 
                  meme={currentMeme} 
                  isActive={viewMode === 'active'} 
                  loading={loading && !currentMeme} 
                />
                
                {/* Interaction Bar */}
                {viewMode === 'active' && currentMeme && (
                  session ? (
                    <form onSubmit={handleSubmit} className="p-4 flex gap-2 bg-gray-50 border-t border-gray-200">
                        <input type="text" value={newCaption} onChange={(e) => setNewCaption(e.target.value)} placeholder="Write a witty caption..." disabled={submitting} className="flex-1 p-3 rounded-lg bg-white border border-gray-300 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all placeholder:text-gray-500 text-gray-900" />
                        <button type="submit" disabled={submitting || !newCaption.trim()} className="bg-yellow-400 text-black font-bold p-3 rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition shadow-sm">
                          {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
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

              {/* Feed */}
              <CaptionFeed 
                captions={captions} 
                session={session} 
                viewMode={viewMode}
                onVote={castVote}
                onShare={shareCaption}
                onReport={reportCaption}
              />
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden md:block md:col-span-1 space-y-6 sticky top-24 h-fit">
          <LeaderboardWidget initialWeeklyLeaders={leaderboard} />
          <HowToPlayButton />
        </div>
      </div>

      {/* Mobile Nav */}
       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-around z-40 pb-6 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <button onClick={handleBackToArena} className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${viewMode === 'active' ? 'text-yellow-500 scale-105' : 'text-gray-400'}`}>
          <Flame size={20} /> <span>Battle</span>
        </button>
        <button onClick={() => setShowLeaderboardModal(true)} className="flex flex-col items-center gap-1 text-xs font-bold text-gray-400 active:text-gray-900 transition-all">
          <Trophy size={20} /> <span>Rank</span>
        </button>
        <button onClick={() => setViewMode('archive')} className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${viewMode === 'archive' || viewMode === 'archive-detail' ? 'text-yellow-500 scale-105' : 'text-gray-400'}`}>
          <History size={20} /> <span>Archive</span>
        </button>
      </div>
    </div>
  );
}
