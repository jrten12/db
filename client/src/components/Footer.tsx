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
        
        {/* Attribution with sleek neon blue styling */}
        <div className="mt-6 pt-4 border-t border-slate-800/30">
          <div className="flex items-center justify-center gap-2">
            <svg 
              className="w-4 h-4 text-sky-400" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              style={{ filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.5))' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <span 
              className="text-sky-300 text-xs tracking-wider font-light"
              style={{ 
                textShadow: '0 0 12px rgba(56,189,248,0.35)',
                letterSpacing: '0.08em'
              }}
            >
              a game by <span className="font-medium">Infarill LLC</span> and <span className="font-medium">Nancy Deephouse</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
