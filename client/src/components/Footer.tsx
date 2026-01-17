import { Link } from "wouter";
import signatureImage from "@assets/244711DD-4A02-45F4-AF84-DB41F02E853B_1768194434457.png";

export default function Footer() {
  return (
    <footer className="mt-auto py-4 px-4 border-t border-slate-800/50 bg-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-3">
          <img
            src={signatureImage}
            alt="A Game By Infarill & LVI Properties, LLC"
            className="w-full max-w-[200px] sm:max-w-[240px] h-auto opacity-80"
          />
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/terms" className="text-purple-400 hover:text-purple-300 transition-colors">
              Terms of Service
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors">
              Privacy Policy
            </Link>
          </div>
          
          <span className="text-gray-500 text-xs text-center">
            © 2026 Infarill LLC & LVI Properties, LLC. All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
