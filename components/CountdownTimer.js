import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date(now);
      target.setUTCHours(5, 0, 0, 0); // 5:00 AM UTC
      if (now > target) target.setDate(target.getDate() + 1);
      
      const diff = target - now;
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur text-white text-xs font-mono py-1 px-3 rounded-full border border-white/10 flex items-center gap-2 z-10">
      <Clock size={12} className="text-yellow-400" /> 
      <span>Ends in: {timeLeft}</span>
    </div>
  );
}
