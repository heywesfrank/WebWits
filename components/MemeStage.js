import { Trophy } from "lucide-react";
import Image from "next/image";
import Skeleton from "./Skeleton";

export default function MemeStage({ meme, isActive, loading }) {
  if (loading) return <Skeleton className="w-full h-96" />;
  if (!meme) return <div className="h-64 flex items-center justify-center text-gray-500">No content found.</div>;

  return (
    <div className="relative group flex justify-center bg-gray-100">
      {/* Media */}
      {meme.type === 'video' ? (
        <video 
          src={meme.content_url || meme.image_url} 
          autoPlay muted loop playsInline
          className="w-full h-auto max-h-[600px] object-contain bg-black pointer-events-none" 
        />
      ) : (
        <div className="relative w-full h-auto max-h-[600px] flex justify-center">
          <Image 
            src={meme.image_url} 
            alt={`Daily Meme Challenge ${meme.publish_date || ''}`}
            width={800} 
            height={800}
            className="w-auto h-auto max-h-[600px] object-contain"
            priority={true} 
          />
        </div>
      )}
    </div>
  );
}
