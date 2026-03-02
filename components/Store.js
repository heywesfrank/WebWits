// components/Store.js
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Wallet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Define Store Items Configuration
const ITEMS = [
    {
        id: "effect_fire",
        type: "meme_bound", 
        name: "Ring of Fire",
        description: "Ignite your active caption. Burns until the battle ends.",
        cost: 100,
        image: "/ringoffire.png"
    },
    {
        id: "consumable_edit",
        type: "consumable",
        name: "The Mulligan",
        description: "We all make mistakes. Fix yours. Grants one caption edit.",
        cost: 150,
        image: "/mulligan.png"
    },
    {
        id: "effect_pin",
        type: "meme_bound", 
        name: "Thumbtack of Glory",
        description: "Glue your wit to the ceiling. Stays on top for the full battle.", 
        cost: 200,
        image: "/thumbtackofglory.png"
    },
    {
        id: "consumable_double",
        type: "consumable",
        name: "Double Barrel",
        description: "One joke wasn't enough? Reload and fire a second caption today.",
        cost: 250,
        image: "/doublebarrel.png"
    },
    {
        id: "consumable_cut_mic",
        type: "consumable_stackable",
        name: "Cut the Mic",
        description: "Silence a rival. Prevents a specific comment from receiving votes for 6 hours.",
        cost: 2000,
        image: "/cutthemic.png"
    },
    {
        id: "consumable_squeezal",
        type: "consumable_stackable",
        name: "Squeezal",
        description: "Make a rival's joke so small they'll need a microscope to read it. Lasts 6 hours.",
        cost: 2000,
        image: "/squeezal.png"
    },
    {
        id: "prize_amazon_25",
        type: "prize",
        name: "The Payday",
        description: "$25 Amazon Gift Card. Jeff Bezos' money, now yours.",
        cost: 15000, 
        image: "/payday.png"
    }
];

export default function Store() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);
    const [message, setMessage] = useState(null);
    const [hasCommented, setHasCommented] = useState(false);
    const [activeMemeId, setActiveMemeId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('credits, cosmetics')
            .eq('id', session.user.id)
            .single();
        
        setProfile(profileData);

        const { data: activeMeme } = await supabase
            .from('memes')
            .select('id')
            .eq('status', 'active')
            .maybeSingle();

        if (activeMeme) {
            setActiveMemeId(activeMeme.id);
            const { data: comment } = await supabase
                .from('comments')
                .select('id')
                .eq('meme_id', activeMeme.id)
                .eq('user_id', session.user.id)
                .maybeSingle();
            
            setHasCommented(!!comment);
        }

        setLoading(false);
    };

    const handlePurchase = async (item) => {
        // Validation for Pin
        if (item.id === "effect_pin") {
            if (!hasCommented) {
                 setMessage({ type: 'error', text: "You must post a caption first to pin it!" });
                 return;
            }
            if (profile.cosmetics?.effect_fire_meme_id === activeMemeId) {
                 setMessage({ type: 'error', text: "Cannot pin: You already used Ring of Fire!" });
                 return;
            }
        }

        if (item.id === "effect_fire") {
            if (!hasCommented) {
                setMessage({ type: 'error', text: "You must post a caption first to ignite it!" });
                return;
            }
            if (profile.cosmetics?.effect_pin_meme_id === activeMemeId) {
                 setMessage({ type: 'error', text: "Cannot ignite: You already used Thumbtack!" });
                 return;
            }
        }

        if (item.id === "consumable_edit") {
            if (!hasCommented) {
                 setMessage({ type: 'error', text: "You must post a caption first to edit it!" });
                 return;
            }
            const hasFire = profile.cosmetics?.effect_fire_meme_id === activeMemeId;
            const hasPin = profile.cosmetics?.effect_pin_meme_id === activeMemeId;

            if (hasFire || hasPin) {
                 setMessage({ type: 'error', text: "Cannot edit a powered-up caption!" });
                 return;
            }
        }

        if (item.id === "consumable_double") {
            if (!hasCommented) {
                 setMessage({ type: 'error', text: "Fire your first shot before reloading!" });
                 return;
            }
            if (profile.cosmetics?.consumable_double_meme_id === activeMemeId) {
                 setMessage({ type: 'error', text: "You're already locked and loaded." });
                 return;
            }
        }

        if ((profile.credits || 0) < item.cost) {
            setMessage({ type: 'error', text: "You're broke. Go be funny to earn WitCoins." });
            return;
        }

        setPurchasing(item.id);
        setMessage(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setMessage({ type: 'error', text: "Please log in again." });
            setPurchasing(null);
            return;
        }

        try {
            const res = await fetch('/api/store/purchase', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ itemId: item.id })
            });

            const data = await res.json();

            if (data.success) {
                // Play Sound Effect mapping based on successful item purchase
                const soundMap = {
                    "effect_fire": "/sounds/fire.wav",
                    "consumable_edit": "/sounds/mulligan.wav",
                    "effect_pin": "/sounds/thumbtack.wav",
                    "consumable_double": "/sounds/shotgun.wav",
                    "consumable_cut_mic": "/sounds/cutthemic.wav",
                    "consumable_squeezal": "/sounds/squeezel.wav"
                };

                if (soundMap[item.id]) {
                    try {
                        new Audio(soundMap[item.id]).play().catch(e => console.warn('Audio play error:', e));
                    } catch(e) {}
                }

                if (item.type === 'prize') {
                    setMessage({ type: 'success', text: "Bag secured! 💰 We've alerted the admins. Watch your email for the goods." });
                } else if (item.id === "consumable_cut_mic") {
                    setMessage({ type: 'success', text: "Mic Cut purchased! ✂️ Find a comment to silence in the arena." });
                } else if (item.id === "consumable_squeezal") {
                    setMessage({ type: 'success', text: "Squeezal purchased! 🤏 Find a comment to shrink." });
                } else {
                    setMessage({ type: 'success', text: `Purchased: ${item.name}!` });
                }
                fetchProfile();
            } else {
                setMessage({ type: 'error', text: data.error || "Transaction failed." });
            }
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: "Connection failed." });
        } finally {
            setPurchasing(null);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-yellow-400" size={32} />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header and Credits Display */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-gray-700">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black font-display mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                            The WitCoin Store
                        </h1>
                        <p className="text-gray-400 font-medium">Pay to win? No. Pay to shine? Absolutely.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-inner">
                        <Wallet className="text-yellow-400" />
                        <div>
                            <div className="text-xs text-gray-300 font-bold uppercase tracking-wider">WitCoins</div>
                            <div className="text-2xl font-black text-white tracking-tight">{profile?.credits || 0}</div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl font-bold text-center animate-in zoom-in-95 duration-200 ${
                    message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 
                    'bg-green-50 text-green-700 border border-green-200'
                }`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ITEMS.map(item => (
                    <StoreCard 
                        key={item.id} 
                        item={item} 
                        userCredits={profile?.credits || 0}
                        onBuy={handlePurchase}
                        loading={purchasing === item.id}
                        inventory={profile?.cosmetics || {}}
                        activeMemeId={activeMemeId}
                    />
                ))}
            </div>
        </div>
    );
}

function StoreCard({ item, userCredits, onBuy, loading, inventory, activeMemeId }) {
    const canAfford = userCredits >= item.cost;
    
    let isActive = false;
    
    if (item.type === 'meme_bound' || item.id === 'consumable_edit' || item.id === 'consumable_double') {
         isActive = inventory[`${item.id}_meme_id`] === activeMemeId;
    } else if (item.type === 'consumable_stackable') {
         isActive = false; // Always allows repurchasing
    }
    
    const countKey = `${item.id}_count`;
    const count = inventory[countKey] || 0;

    return (
        <div className={`bg-white border-2 rounded-2xl p-6 flex flex-col transition-all relative overflow-hidden group ${isActive ? 'border-yellow-400 shadow-lg shadow-yellow-100' : 'border-gray-100 hover:border-gray-300 hover:shadow-xl'}`}>
            
            {isActive && (
                <div className="absolute top-3 right-3 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                    {item.id === 'consumable_edit' ? 'READY' : (item.id === 'consumable_double' ? 'LOADED' : 'ACTIVE')}
                </div>
            )}
            
            {count > 0 && item.type === 'consumable_stackable' && (
                <div className="absolute top-3 right-3 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
                    x{count} OWNED
                </div>
            )}

            {/* Replaced Icon + Background Wrapper with PNG rendering */}
            <img 
                src={item.image} 
                alt={item.name} 
                className="w-16 h-16 object-contain mb-5 drop-shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" 
            />
            
            <h3 className="font-bold text-xl text-gray-900 font-display leading-none mb-2">{item.name}</h3>
            <p className="text-gray-500 text-sm mb-6 flex-1 leading-relaxed">{item.description}</p>
            
            <div className="mt-auto">
                <button
                    onClick={() => canAfford && onBuy(item)}
                    disabled={loading || !canAfford || isActive}
                    className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        isActive 
                            ? 'bg-gray-100 text-gray-400 cursor-default'
                            : canAfford 
                                ? `bg-gray-900 text-white hover:bg-black hover:-translate-y-0.5 shadow-md hover:shadow-lg active:scale-[0.98]`
                                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        isActive ? (item.id === 'consumable_edit' ? "Ready to Use" : "Already Active") : (
                            <>
                                <span>{item.cost}</span>
                                <Wallet size={16} className={canAfford ? "text-yellow-400" : "text-gray-300"} />
                            </>
                        )
                    )}
                </button>
            </div>
        </div>
    );
}
