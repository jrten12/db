import { Link } from 'wouter';
import { Play } from 'lucide-react';
import heroImage from '@assets/dealbreak_sim_1767845973603.png';

export default function Landing() {
  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-[#2a1f2d] via-[#1e1520] to-[#15101a]"
      data-testid="landing-page"
    >
      {/* Subtle texture overlay */}
      <div 
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 flex justify-end safe-area-top">
          <Link href="/game">
            <button className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium text-sm border border-white/20 transition-all" data-testid="button-play-free-header">
              Play Free
            </button>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          {/* Hero Image */}
          <div className="max-w-md w-full mb-8">
            <img 
              src={heroImage} 
              alt="Dealbreak: Real Estate Simulator - Learn to spot profitable deals vs money pits"
              className="w-full h-auto rounded-2xl shadow-2xl"
              style={{
                boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
              }}
              data-testid="hero-image"
            />
          </div>

          {/* CTA Section */}
          <div className="text-center max-w-lg">
            <p className="text-gray-300 text-lg md:text-xl mb-8">
              Learn to spot the difference between deals that make money—and deals that break you.
            </p>
            
            <Link href="/game">
              <button 
                className="px-10 py-4 rounded-lg font-bold text-lg text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
                  boxShadow: '0 4px 0 #15803d, 0 8px 20px rgba(0,0,0,0.3)',
                }}
                data-testid="button-play-simulator"
              >
                Play the Simulator
              </button>
            </Link>

            <button className="flex items-center gap-2 mx-auto mt-5 text-gray-400 hover:text-white transition-colors text-sm" data-testid="button-watch-video">
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