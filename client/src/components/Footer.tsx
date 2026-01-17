import { Link } from "wouter";
import infarillLogo from "../assets/infarill-logo.png";

export default function Footer() {
  return (
    <footer className="mt-auto py-6 px-4 border-t border-slate-800/50 bg-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center mb-4">
          <img
            src={infarillLogo}
            alt="Infarill"
            className="h-8 w-auto"
          />
          <span className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Infarill LLC. All Rights Reserved.
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link href="/terms" className="text-purple-400 hover:text-purple-300 transition-colors">
            Terms of Service
          </Link>
          <span className="text-gray-600">•</span>
          <Link href="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors">
            Privacy Policy
          </Link>
        </div>
        
        {/* Signature attribution with cursive neon blue pen effect */}
        <div className="mt-6 pt-5 border-t border-slate-800/30">
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">
              a game by
            </span>
            <div 
              className="text-sky-300 text-2xl sm:text-3xl"
              style={{ 
                fontFamily: '"Great Vibes", cursive',
                textShadow: '0 0 4px rgba(56,189,248,0.9), 0 0 12px rgba(56,189,248,0.5), 0 0 24px rgba(56,189,248,0.25)',
                transform: 'rotate(-1deg)',
              }}
            >
              Infarill LLC <span className="text-sky-400/60 mx-1">&</span> Nancy Deephouse
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
