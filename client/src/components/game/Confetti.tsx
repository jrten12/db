import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
  shape: 'square' | 'circle' | 'triangle';
}

const COLORS = [
  '#10b981', // emerald
  '#fbbf24', // amber
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
}

export function Confetti({ isActive, duration = 3000, particleCount = 50 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 1,
        shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as 'square' | 'circle' | 'triangle',
      }));
      setPieces(newPieces);

      const timeout = setTimeout(() => setPieces([]), duration);
      return () => clearTimeout(timeout);
    }
  }, [isActive, duration, particleCount]);

  if (pieces.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
          }}
        >
          {piece.shape === 'square' && (
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: piece.color }}
            />
          )}
          {piece.shape === 'circle' && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: piece.color }}
            />
          )}
          {piece.shape === 'triangle' && (
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: `10px solid ${piece.color}`,
              }}
            />
          )}
        </div>
      ))}
    </div>,
    document.body
  );
}
