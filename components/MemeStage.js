import { Trophy } from "lucide-react";
import Skeleton from "./Skeleton";
import CountdownTimer from "./CountdownTimer";

export default function MemeStage({ meme, isActive, loading }) {
  if (loading) return <Skeleton className="w-full h-96" />;
  if (!meme) return <div className="h-64 flex items-center justify-center text-gray-500">No content found.</div>;

  return (
    <div className="relative group bg-black/5">
      {/* Status Badge */}
      {isActive ? (
        <CountdownTimer />
      ) : (
        <div className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold py-1 px-3 rounded-full shadow-lg flex items-center gap-2 z-10">
          <Trophy size={12} className="text-black" /> 
          <span>Winner Declared</span>
        </div>
      )}

      {/* Media */}
{meme.type === 'video' ? (
  <video ... />
) : (
  <div className="relative w-full h-auto max-h-[600px]">
    <Image 
      src={meme.image_url} 
      alt={`Daily Meme Challenge ${meme.publish_date}`} // Improve Alt Text
      width={600} // Set appropriate max width
      height={600} // Set appropriate max height
      className="w-full h-auto object-contain"
      priority={true} // Priority loading for the LCP element
    />
  </div>
)}
