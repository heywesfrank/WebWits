import { Calendar, Trophy } from "lucide-react";

export default function ArchiveSection({ archives }) {
  if (!archives || archives.length === 0) {
    return (
      <div className="col-span-2 text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50 border-dashed">
        <p className="text-gray-500 font-medium">The archives are empty.</p>
        <p className="text-gray-600 text-sm mt-1">Check back tomorrow!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
      {archives.map((m) => (
        <div 
          key={m.id} 
          className="group relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-yellow-400/50 transition-all hover:shadow-[0_0_20px_rgba(250,204,21,0.1)] cursor-pointer"
        >
          
          {/* Image with Zoom Effect */}
          <div className="relative h-48 overflow-hidden">
             <img 
               src={m.image_url} 
               alt={`Archive ${new Date(m.created_at).toLocaleDateString()}`} 
               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
             />
             {/* Gradient Overlay for text readability */}
             <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
             
             {/* Date Badge */}
             <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded-md border border-white/10 text-[10px] font-mono text-gray-300 flex items-center gap-1">
               <Calendar size={10} />
               {new Date(m.created_at).toLocaleDateString()}
             </div>
          </div>

          {/* Content Section */}
          <div className="p-4 relative -mt-6">
            <div className="bg-gray-800 border border-gray-700 p-3 rounded-xl shadow-xl">
               <div className="flex items-center gap-2 mb-2">
                 <Trophy size={14} className="text-yellow-400" />
                 <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Top Caption</span>
               </div>
               {/* Display winning caption or placeholder */}
               <p className="text-sm text-gray-300 italic line-clamp-2">
                 "{m.winning_caption || "Winner decided soon..."}"
               </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
