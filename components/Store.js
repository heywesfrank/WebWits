// [!code_block: components/Store.js]
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Wallet, Flame, Pin, Edit3, MessageSquarePlus, Gift, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Define Store Items Configuration
// Ordered from lowest cost to highest
const ITEMS = [
    {
        id: "effect_fire",
        type: "duration",
        name: "Ring of Fire",
        description: "Your comment is hot. Make it look like it. Burns for 1 hour.",
        cost: 100,
        icon: <Flame size={24} className="text-orange-500 fill-orange-500" />,
        color: "orange"
    },
    // ... (other items remain the same)
    {
        id: "consumable_edit",
        type: "consumable",
        name: "The Mulligan",
        description: "We all make mistakes. Fix yours. Grants one caption edit.",
        cost: 150,
        icon: <Edit3 size={24} className="text-blue-500" />,
        color: "blue"
    },
    {
        id: "effect_pin",
        type: "duration",
        name: "Thumbtack of Glory",
        description: "Glue your wit to the ceiling. Stay on top of the feed for 60 minutes.",
        cost: 200,
        icon: <Pin size={24} className="text-red-500 fill-red-500" />,
        color: "red"
    },
    {
        id: "consumable_double",
        type: "consumable",
        name: "Double Barrel",
        description: "One joke wasn't enough? Reload and fire a second caption today.",
        cost: 250,
        icon: <MessageSquarePlus size={24} className="text-purple-500" />,
        color: "purple"
    },
    {
        id: "prize_amazon_25",
        type: "prize",
        name: "The Payday",
        description: "$25 Amazon Gift Card. Jeff Bezos' money, now yours.",
        cost: 2000,
        icon: <Gift size={24} className="text-green-600" />,
        color: "green"
    }
];

export default function Store() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);
    const [message, setMessage] = useState(null);
    const [hasCommented, setHasCommented] = useState(false); // [!code ++]
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

        // 1. Fetch Profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('credits, cosmetics')
            .eq('id', session.user.id)
            .single();
        
        setProfile(profileData);

        // 2. Check if user has commented on the active meme [!code ++]
        const { data: activeMeme } = await supabase
            .from('memes')
            .select('id')
            .eq('status', 'active')
            .maybeSingle();

        if (activeMeme) {
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
        // [!code ++] Special Check for Ring of Fire
        if (item.id === "effect_fire" && !hasCommented) {
            setMessage({ type: 'error', text: "You must post a caption first to ignite it!" });
            return;
        }

        if ((profile.credits || 0) < item.cost) {
            setMessage({ type: 'error', text: "You're broke. Go be funny to earn credits." });
            return;
        }

        setPurchasing(item.id);
        setMessage(null);

        try {
            const res = await fetch('/api/store/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: item.id })
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: `Purchased: ${item.name}!` });
                fetchProfile(); // Refresh balance
            } else {
                setMessage({ type: 'error', text: data.error || "Transaction failed." });
            }
        } catch (e) {
            setMessage({ type: 'error', text: "Connection failed. Internet machine broke?" });
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
            {/* Header / Balance */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-gray-700">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black font-display mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                            The Armory
                        </h1>
                        <p className="text-gray-400 font-medium">Pay to win? No. Pay to shine? Absolutely.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-inner">
                        <Wallet className="text-yellow-400" />
                        <div>
                            <div className="text-xs text-gray-300 font-bold uppercase tracking-wider">Credits</div>
                            <div className="text-2xl font-black text-white tracking-tight">{profile?.credits || 0}</div>
                        </div>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* Notification */}
            {message && (
                <div className={`p-4 rounded-xl font-bold text-center animate-in zoom-in-95 duration-200 ${
                    message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 
                    'bg-green-50 text-green-700 border border-green-200'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ITEMS.map(item => (
                    <StoreCard 
                        key={item.id} 
                        item={item} 
                        userCredits={profile?.credits || 0}
                        onBuy={handlePurchase}
                        loading={purchasing === item.id}
                        inventory={profile?.cosmetics || {}}
                    />
                ))}
            </div>
        </div>
    );
}

function StoreCard({ item, userCredits, onBuy, loading, inventory }) {
    const canAfford = userCredits >= item.cost;
    
    // Check active status for duration items
    const expiryKey = `${item.id}_expires`;
    const isActive = inventory[expiryKey] && new Date(inventory[expiryKey]) > new Date();
    
    // Check count for consumable items
    const countKey = `${item.id}_count`;
    const count = inventory[countKey] || 0;

    // Color mapping
    const bgColors = {
        orange: "bg-orange-50 text-orange-600",
        red: "bg-red-50 text-red-600",
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        green: "bg-green-50 text-green-600"
    };

    return (
        <div className={`bg-white border-2 rounded-2xl p-6 flex flex-col transition-all relative overflow-hidden group ${isActive ? 'border-yellow-400 shadow-lg shadow-yellow-100' : 'border-gray-100 hover:border-gray-300 hover:shadow-xl'}`}>
            
            {/* Active Badge */}
            {isActive && (
                <div className="absolute top-3 right-3 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                    ACTIVE
                </div>
            )}
             {/* Count Badge */}
             {count > 0 && item.type === 'consumable' && (
                <div className="absolute top-3 right-3 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    x{count} OWNED
                </div>
            )}

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${bgColors[item.color] || 'bg-gray-100'}`}>
                {item.icon}
            </div>
            
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
                        isActive ? "Already Active" : (
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
