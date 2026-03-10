import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-auto py-6 sm:py-8 px-4 border-t border-white/[0.06] bg-black/30 safe-area-bottom safe-area-x">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-4 sm:gap-5">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <Link href="/learn" className="text-emerald-400/80 hover:text-emerald-400 active:text-emerald-300 transition-colors touch-target-sm inline-flex items-center justify-center tap-scale" data-testid="link-footer-learn">
              Learning Center
            </Link>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <Link href="/tools" className="text-emerald-400/80 hover:text-emerald-400 active:text-emerald-300 transition-colors touch-target-sm inline-flex items-center justify-center tap-scale" data-testid="link-footer-tools">
              Free Tools
            </Link>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <Link href="/terms" className="text-emerald-400/80 hover:text-emerald-400 active:text-emerald-300 transition-colors touch-target-sm inline-flex items-center justify-center tap-scale">
              Terms of Service
            </Link>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <Link href="/privacy" className="text-emerald-400/80 hover:text-emerald-400 active:text-emerald-300 transition-colors touch-target-sm inline-flex items-center justify-center tap-scale">
              Privacy Policy
            </Link>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <Link href="/methodology" className="text-emerald-400/80 hover:text-emerald-400 active:text-emerald-300 transition-colors touch-target-sm inline-flex items-center justify-center tap-scale">
              Methodology
            </Link>
          </div>

          <span className="text-gray-600 text-xs sm:text-sm text-center">
            © 2026 Dealbreak. All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
