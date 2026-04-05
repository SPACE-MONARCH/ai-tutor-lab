export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="relative">
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 border-t-2 border-[#8eff71] rounded-full animate-[spin_2s_linear_infinite] shadow-[0_0_20px_#8eff71]" />
        
        {/* Inner Counter Core */}
        <div className="w-16 h-16 border-4 border-white/5 border-b-[#81ecff] rounded-full animate-spin flex items-center justify-center bg-[#131313]/50 backdrop-blur-sm" />
        
        {/* Inner Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-[#d873ff] rounded-full animate-pulse shadow-[0_0_10px_#d873ff]" />
        </div>
      </div>
      <p className="font-mono text-[#adaaaa] text-xs uppercase tracking-widest animate-pulse">
        Initializing Module...
      </p>
    </div>
  );
}
