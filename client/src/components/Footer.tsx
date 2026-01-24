import { Link } from "wouter";
import signatureImage from "@assets/244711DD-4A02-45F4-AF84-DB41F02E853B_1768194434457.png";

export default function Footer() {
  return (
    <footer className="mt-auto py-6 sm:py-8 px-4 border-t border-white/[0.06] bg-black/30 safe-area-bottom safe-area-x">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-4 sm:gap-5">
          <img
            src={signatureImage}
            alt="A Game By Infarill & LVI Properties, LLC"
            className="w-full max-w-[180px] sm:max-w-[220px] lg:max-w-[240px] h-auto opacity-70 hover:opacity-90 transition-opacity"
          />

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <Link href="/terms" className="text-emerald-400/80 hover:text-emerald-400 active:text-emerald-300 transition-colors touch-target-sm inline-flex items-center justify-center tap-scale">
              Terms of Service
            </Link>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <Link href="/privacy" className="text-emerald-400/80 hover:text-emerald-400 active:text-emerald-300 transition-colors touch-target-sm inline-flex items-center justify-center tap-scale">
              Privacy Policy
            </Link>
          </div>

          <span className="text-gray-600 text-xs sm:text-sm text-center">
            © 2026 Infarill LLC & LVI Properties, LLC. All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
