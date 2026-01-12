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
            &copy; {new Date().getFullYear()} Infarill LLC & LVI Properties, LLC. All Rights Reserved.
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
        
        {/* Signature attribution with refined subtle blue neon effect */}
        <div className="mt-6 pt-5 border-t border-slate-800/30">
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-gray-500 text-[10px] uppercase tracking-[0.25em] font-medium">
              a game by
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
              <span 
                className="text-white/90 text-xl sm:text-2xl tracking-tight"
                style={{ 
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  textShadow: '0 0 8px rgba(96,165,250,0.4), 0 0 2px rgba(96,165,250,0.6)',
                  letterSpacing: '-0.02em',
                }}
              >
                Infarill LLC
              </span>
              <span className="text-blue-400/50 text-lg font-light">&</span>
              <span 
                className="text-white/90 text-xl sm:text-2xl tracking-tight"
                style={{ 
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  textShadow: '0 0 8px rgba(96,165,250,0.4), 0 0 2px rgba(96,165,250,0.6)',
                  letterSpacing: '-0.02em',
                }}
              >
                LVI Properties, LLC
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
