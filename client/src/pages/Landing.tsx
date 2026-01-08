import { Link } from 'wouter';
import { ArrowDown, ArrowUp, AlertTriangle, Play } from 'lucide-react';

export default function Landing() {
  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-[#2a1f2d] via-[#1e1520] to-[#15101a]"
      data-testid="landing-page"
    >
      {/* Subtle texture overlay */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 flex justify-end">
          <Link href="/game">
            <button className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium text-sm border border-white/20 transition-all" data-testid="button-play-free-header">
              Play Free
            </button>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
          {/* Main Frame */}
          <div className="relative max-w-lg w-full">
            {/* Metal Frame */}
            <div 
              className="relative rounded-3xl p-1"
              style={{
                background: 'linear-gradient(145deg, #5a5a5a 0%, #3a3a3a 50%, #4a4a4a 100%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)',
              }}
            >
              {/* Corner Screws */}
              <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 shadow-inner" />
              <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 shadow-inner" />
              <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 shadow-inner" />
              <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 shadow-inner" />

              {/* Inner Frame Content */}
              <div 
                className="rounded-[20px] p-6 md:p-8"
                style={{
                  background: 'linear-gradient(180deg, #3d2f35 0%, #2a1f2d 100%)',
                }}
              >
                {/* Houses Row */}
                <div className="flex items-end justify-between gap-4 mb-6">
                  {/* Bad House Side */}
                  <div className="flex-1 text-center">
                    {/* Mortgage Document */}
                    <div className="bg-[#d4c8a8] rounded p-2 mb-3 mx-auto w-24 shadow-lg transform -rotate-3">
                      <div className="text-[8px] font-bold text-gray-700 tracking-wide mb-1">MORTGAGE</div>
                      <div className="space-y-0.5">
                        <div className="h-0.5 bg-gray-500/40 rounded w-full" />
                        <div className="h-0.5 bg-gray-500/40 rounded w-3/4" />
                        <div className="h-0.5 bg-gray-500/40 rounded w-5/6" />
                      </div>
                    </div>
                    
                    {/* Bad House Icon */}
                    <div className="relative">
                      <div className="w-20 h-16 mx-auto bg-gradient-to-b from-amber-800 to-amber-900 rounded-sm relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-gray-600 to-gray-700" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-amber-950 rounded-t" />
                        <div className="absolute top-6 left-2 w-3 h-3 bg-gray-800/50" />
                        <div className="absolute top-6 right-2 w-3 h-3 bg-gray-800/50" />
                        {/* Crack marks */}
                        <div className="absolute top-4 right-1 w-px h-4 bg-black/30 rotate-12" />
                      </div>
                      {/* Warning Sign */}
                      <div className="absolute -bottom-2 -left-2">
                        <div className="w-8 h-8 bg-yellow-400 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
                          <span className="text-black font-bold text-sm mt-1">!</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Negative Cash Flow */}
                    <div className="mt-3 flex items-center justify-center gap-1">
                      <ArrowDown className="w-5 h-5 text-red-500" />
                      <span className="text-red-500 font-bold text-xl font-mono">-$420</span>
                      <span className="text-red-400 text-sm">/mo</span>
                    </div>
                  </div>

                  {/* Pro Forma Clipboard Center */}
                  <div className="flex-shrink-0 relative z-10 -mb-4">
                    <div 
                      className="w-28 bg-[#d4c8a8] rounded-lg shadow-2xl overflow-hidden"
                      style={{
                        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                      }}
                    >
                      {/* Clipboard Clip */}
                      <div className="h-4 bg-gradient-to-b from-gray-400 to-gray-500 flex justify-center items-end pb-1">
                        <div className="w-6 h-2 bg-gray-600 rounded-b" />
                      </div>
                      {/* Pro Forma Title */}
                      <div className="bg-[#2a4a35] py-1 px-2">
                        <div className="text-white text-[10px] font-bold tracking-wide text-center">PRO FORMA</div>
                      </div>
                      {/* Form Content */}
                      <div className="p-2 space-y-1.5">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-sm bg-green-600/60" />
                          <div className="h-1 bg-gray-400/50 rounded flex-1" />
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-sm bg-red-500/60" />
                          <div className="h-1 bg-gray-400/50 rounded flex-1" />
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-sm bg-green-600/60" />
                          <div className="h-1 bg-gray-400/50 rounded flex-1" />
                        </div>
                        <div className="h-4" />
                        <div className="h-1 bg-gray-400/50 rounded w-full" />
                        <div className="h-1 bg-gray-400/50 rounded w-3/4" />
                        <div className="h-1 bg-gray-400/50 rounded w-5/6" />
                      </div>
                    </div>
                  </div>

                  {/* Good House Side */}
                  <div className="flex-1 text-center">
                    {/* Good House Icon */}
                    <div className="w-20 h-16 mx-auto bg-gradient-to-b from-amber-100 to-amber-200 rounded-sm relative overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-gray-500 to-gray-600" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-amber-700 rounded-t" />
                      <div className="absolute top-6 left-2 w-3 h-3 bg-sky-300/80 border border-white/30" />
                      <div className="absolute top-6 right-2 w-3 h-3 bg-sky-300/80 border border-white/30" />
                      {/* Porch */}
                      <div className="absolute bottom-0 inset-x-0 h-2 bg-amber-300/50" />
                    </div>
                    
                    {/* Positive Cash Flow */}
                    <div className="mt-3 flex items-center justify-center gap-1">
                      <ArrowUp className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-bold text-xl font-mono">+$800</span>
                      <span className="text-green-400 text-sm">/mo</span>
                    </div>
                  </div>
                </div>

                {/* Gold Coins Row */}
                <div className="flex justify-center items-end gap-1 mb-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col-reverse">
                      {[...Array(i + 2)].map((_, j) => (
                        <div 
                          key={j}
                          className="w-5 h-2 rounded-full -mt-1 first:mt-0"
                          style={{
                            background: 'linear-gradient(180deg, #ffd700 0%, #b8860b 50%, #daa520 100%)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          }}
                        />
                      ))}
                    </div>
                  ))}
                  <div className="mx-2" />
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col-reverse">
                      {[...Array(5 - i)].map((_, j) => (
                        <div 
                          key={j}
                          className="w-5 h-2 rounded-full -mt-1 first:mt-0"
                          style={{
                            background: 'linear-gradient(180deg, #ffd700 0%, #b8860b 50%, #daa520 100%)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Title */}
                <div className="text-center">
                  <h1 
                    className="font-display text-4xl md:text-5xl font-bold tracking-wider"
                    style={{
                      background: 'linear-gradient(180deg, #d4af37 0%, #b8860b 50%, #cd853f 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    DEALBREAK
                  </h1>
                  <p 
                    className="text-sm md:text-base tracking-[0.25em] font-medium mt-1"
                    style={{
                      color: '#8b7355',
                    }}
                  >
                    REAL ESTATE SIMULATOR
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section Below Frame */}
          <div className="mt-10 text-center">
            <p className="text-gray-300 text-lg md:text-xl max-w-md mx-auto mb-6">
              Learn to spot the difference between deals that make money—and deals that break you.
            </p>
            
            <Link href="/game">
              <button 
                className="px-10 py-4 rounded-lg font-bold text-lg text-white transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
                  boxShadow: '0 4px 0 #15803d, 0 8px 20px rgba(0,0,0,0.3)',
                }}
                data-testid="button-play-simulator"
              >
                Play the Simulator
              </button>
            </Link>

            <button className="flex items-center gap-2 mx-auto mt-4 text-gray-400 hover:text-white transition-colors text-sm" data-testid="button-watch-video">
              <Play className="w-4 h-4" />
              Watch how it works (60 sec)
            </button>
          </div>
        </main>

        <footer className="safe-area-bottom pb-6" />
      </div>
    </div>
  );
}