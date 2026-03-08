import { Link } from "wouter";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5"
      style={{ background: '#0c0c0e' }}
      data-testid="page-not-found"
    >
      <div className="text-center max-w-md">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.2)',
          }}
        >
          <Search className="w-7 h-7" style={{ color: '#d4af37' }} />
        </div>

        <h1
          className="text-5xl font-bold mb-2"
          style={{ color: '#f0e6d0' }}
        >
          404
        </h1>
        <h2
          className="text-xl font-semibold mb-3"
          style={{ color: 'rgba(220,215,200,0.8)' }}
        >
          Page Not Found
        </h2>
        <p
          className="text-sm leading-relaxed mb-8"
          style={{ color: 'rgba(220,215,200,0.5)' }}
        >
          This page doesn't exist or may have been moved. Head back to the homepage to start analyzing deals.
        </p>

        <Link href="/">
          <button
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'rgba(16,185,129,0.12)',
              color: '#4ade80',
              border: '2px solid rgba(16,185,129,0.5)',
            }}
            data-testid="button-go-home"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Dealbreak
          </button>
        </Link>
      </div>
    </div>
  );
}
