"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Wallet, Sparkles, Gift, Crown, Zap, Loader2, Check, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

// Define Store Items Configuration
const ITEMS = [
    {
        id: "badge_verified",
        type: "cosmetic",
        name: "Verified Badge",
        description: "Get a blue checkmark next to your name. Totally official.",
        cost: 500,
        icon: <Check size={24} className="text-blue-500" />,
        color: "blue"
    },
    {
        id: "border_gold",
        type: "cosmetic",
        name: "Golden Aura",
        description: "A shimmering golden border for your avatar.",
        cost: 1000,
        icon: <Crown size={24} className="text-yellow-500" />,
        color: "yellow"
    },
    {
        id: "prize_amazon_5",
        type: "prize",
        name: "$5 Amazon Card",
        description: "Real money. Sent to your registered email.",
        cost: 2500,
        icon: <Gift size={24} className="text-green-500" />,
        color: "green"
    },
    {
        id: "prize_amazon_10",
        type: "prize",
        name: "$10 Amazon Card",
        description: "Double the fun. Sent to your registered email.",
        cost: 5000,
        icon: <Gift size={24} className="text-green-600" />,
        color: "green"
    }
];

export default function Store() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null); // stores item ID being purchased
    const [message, setMessage] = useState(null);
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

        const { data } = await supabase
            .from('profiles')
            .select('credits, cosmetics')
            .eq('id', session.user.id)
            .single();
        
        setProfile(data);
        setLoading(false);
    };

    const handlePurchase = async (item) => {
        if (profile.credits < item.cost) {
            setMessage({ type: 'error', text: "Not enough credits! Go be funny to earn more." });
            return;
        }

        if (profile.cosmetics?.[item.id]) {
            setMessage({ type: 'info', text: "You already own this item!" });
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
                setMessage({ type: 'success', text: `Successfully purchased ${item.name}!` });
                // Refresh profile to show new balance/inventory
                fetchProfile();
            } else {
                setMessage({ type: 'error', text: data.error || "Purchase failed." });
            }
        } catch (e) {
            setMessage({ type: 'error', text: "Connection error." });
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
        <div className="space-y-8">
            {/* Header / Balance */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black font-display mb-2">WebWits Store</h1>
                        <p className="text-gray-400">Spend your winnings. Flex on your enemies.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                        <Wallet className="text-yellow-400" />
                        <div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Balance</div>
                            <div className="text-2xl font-black text-yellow-400">{profile?.credits || 0}</div>
                        </div>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl"></div>
            </div>

            {/* Notification */}
            {message && (
                <div className={`p-4 rounded-xl font-bold text-center animate-in fade-in slide-in-from-top-2 ${
                    message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 
                    message.type === 'info' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                    'bg-green-50 text-green-600 border border-green-200'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Section: Cosmetics */}
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                    <Sparkles className="text-yellow-500" /> Powerups & Cosmetics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ITEMS.filter(i => i.type === 'cosmetic').map(item => (
                        <StoreCard 
                            key={item.id} 
                            item={item} 
                            userCredits={profile?.credits || 0}
                            isOwned={profile?.cosmetics?.[item.id]}
                            onBuy={handlePurchase}
                            loading={purchasing === item.id}
                        />
                    ))}
                </div>
            </div>

            {/* Section: Prizes */}
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                    <Gift className="text-green-500" /> Real Prizes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ITEMS.filter(i => i.type === 'prize').map(item => (
                        <StoreCard 
                            key={item.id} 
                            item={item} 
                            userCredits={profile?.credits || 0}
                            isOwned={false} // Prizes can be bought multiple times usually, or limit 1. Assuming multiple for now.
                            onBuy={handlePurchase}
                            loading={purchasing === item.id}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function StoreCard({ item, userCredits, isOwned, onBuy, loading }) {
    const canAfford = userCredits >= item.cost;
    
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col hover:shadow-lg transition-shadow relative overflow-hidden group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                item.color === 'yellow' ? 'bg-yellow-50' : 
                item.color === 'blue' ? 'bg-blue-50' : 'bg-green-50'
            }`}>
                {item.icon}
            </div>
            
            <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
            <p className="text-gray-500 text-sm mb-6 flex-1">{item.description}</p>
            
            <div className="mt-auto">
                <button
                    onClick={() => !isOwned && canAfford && onBuy(item)}
                    disabled={loading || (!canAfford && !isOwned) || isOwned}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        isOwned 
                            ? 'bg-gray-100 text-gray-400 cursor-default'
                            : canAfford 
                                ? `bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98]`
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        isOwned ? "Owned" : (
                            <>
                                <span>{item.cost}</span>
                                <Wallet size={16} className={canAfford ? "text-yellow-400" : "text-gray-400"} />
                            </>
                        )
                    )}
                </button>
            </div>
        </div>
    );
}
