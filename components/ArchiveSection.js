import { Calendar } from "lucide-react";

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
          className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:scale-[1.02] transition-all cursor-pointer opacity-80 hover:opacity-100 group shadow-lg"
        >
          {/* Image Container */}
          <div className="relative h-32 sm:h-40 overflow-hidden bg-gray-900">
             <img 
               src={m.image_url} 
               alt={`Archive ${new Date(m.created_at).toLocaleDateString()}`} 
               className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent opacity-60" />
          </div>

          {/* Content */}
          <div className="p-3 relative">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
               <Calendar size={12} />
               <span>{new Date(m.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-sm font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">
              Winner: <span className="text-gray-500 group-hover:text-yellow-400/80">TBD</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
