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
          <Link href="/terms">
            <a className="text-purple-400 hover:text-purple-300 transition-colors">
              Terms of Service
            </a>
          </Link>
          <span className="text-gray-600">•</span>
          <Link href="/privacy">
            <a className="text-purple-400 hover:text-purple-300 transition-colors">
              Privacy Policy
            </a>
          </Link>
        </div>
      </div>
    </footer>
  );
}
