import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2 } from 'lucide-react';

interface DealShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    propertyName: string;
    salePrice: number;
    purchasePrice: number;
    rehabCost: number;
    saleProfit: number;
    strategy: 'flip' | 'rental';
    roi: number;
  };
}

function formatK(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1000) return (n / 1000).toFixed(abs >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString();
}

function fmt(n: number): string {
  return '$' + Math.abs(n).toLocaleString();
}

function drawCard(canvas: HTMLCanvasElement, data: DealShareCardProps['data']) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1080;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;

  const isProfitable = data.saleProfit >= 0;
  const accentColor = isProfitable ? '#34d399' : '#f87171';
  const accentDim = isProfitable ? '#065f46' : '#7f1d1d';

  ctx.fillStyle = '#0c0c10';
  ctx.fillRect(0, 0, W, H);

  const grd = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, W * 0.7);
  grd.addColorStop(0, isProfitable ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)');
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '600 15px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '6px';
  ctx.fillText('D E A L B R E A K   S I M U L A T O R', W / 2, 65);
  ctx.letterSpacing = '0px';

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 95);
  ctx.lineTo(W - 100, 95);
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = '800 20px Inter, system-ui, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText(data.strategy === 'flip' ? 'F L I P' : 'R E N T A L   E X I T', W / 2, 135);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '700 36px Inter, system-ui, sans-serif';
  ctx.fillText(data.propertyName, W / 2, 195);

  const cardY = 240;
  const cardH = 320;
  const cardW = W - 160;
  const cardX = 80;
  const cardR = 24;

  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
  ctx.fill();
  ctx.stroke();

  const rows = [
    { label: 'Purchase Price', value: fmt(data.purchasePrice) },
  ];
  if (data.rehabCost > 0) {
    rows.push({ label: 'Renovation', value: fmt(data.rehabCost) });
  }
  rows.push(
    { label: 'Sale Price', value: fmt(data.salePrice) },
  );

  const rowStartY = cardY + 50;
  const rowH = data.rehabCost > 0 ? 70 : 85;

  rows.forEach((row, i) => {
    const ry = rowStartY + i * rowH;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(row.label, cardX + 40, ry);

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '700 26px "SF Mono", "Fira Code", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(row.value, cardX + cardW - 40, ry);
  });

  const divY = rowStartY + rows.length * rowH - 10;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 30, divY);
  ctx.lineTo(cardX + cardW - 30, divY);
  ctx.stroke();

  const resultY = divY + 55;
  const resultLabel = isProfitable ? 'PROFIT' : 'LOSS';
  ctx.fillStyle = accentDim;
  ctx.beginPath();
  ctx.roundRect(cardX + 30, resultY - 35, cardW - 60, 70, 12);
  ctx.fill();

  ctx.fillStyle = accentColor;
  ctx.font = '800 22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(resultLabel, cardX + 55, resultY + 5);

  ctx.fillStyle = accentColor;
  ctx.font = '900 36px "SF Mono", "Fira Code", monospace';
  ctx.textAlign = 'right';
  const sign = isProfitable ? '+' : '-';
  ctx.fillText(`${sign}${fmt(data.saleProfit)}`, cardX + cardW - 55, resultY + 8);

  const roiY = resultY + 45;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '600 18px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${data.roi >= 0 ? '+' : ''}${data.roi.toFixed(1)}% ROI`, W / 2, roiY);

  const heroY = 640;
  const profitStr = formatK(Math.abs(data.saleProfit));
  const verb = data.strategy === 'flip' ? 'flipping' : 'selling';

  let heroLine1: string;
  let heroLine2: string;
  if (isProfitable) {
    heroLine1 = `I just made $${profitStr}`;
    heroLine2 = `${verb} a house in a simulator`;
  } else {
    heroLine1 = `I just lost $${profitStr}`;
    heroLine2 = `${verb} a house in a simulator`;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 52px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(heroLine1, W / 2, heroY);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '600 36px Inter, system-ui, sans-serif';
  ctx.fillText(heroLine2, W / 2, heroY + 55);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, 770);
  ctx.lineTo(W - 200, 770);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '500 20px Inter, system-ui, sans-serif';
  ctx.fillText('Think you can do better?', W / 2, 820);

  ctx.fillStyle = accentColor;
  ctx.font = '700 28px Inter, system-ui, sans-serif';
  ctx.fillText('dealbreaksimulator.com', W / 2, 860);

  const badgeY = 930;
  const badgeW = 320;
  const badgeH = 52;
  const badgeX = (W - badgeW) / 2;
  ctx.fillStyle = isProfitable ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
  ctx.strokeStyle = isProfitable ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = '700 18px Inter, system-ui, sans-serif';
  ctx.fillText(isProfitable ? 'Real Estate Winner' : 'Learning Experience', W / 2, badgeY + 33);

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.font = '400 13px Inter, system-ui, sans-serif';
  ctx.fillText('Practice real estate investing — free simulator', W / 2, H - 30);
}

export function DealShareCard({ isOpen, onClose, data }: DealShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawCard(canvasRef.current, data);
      const url = canvasRef.current.toDataURL('image/png');
      setImageUrl(url);
    }
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [isOpen, data]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `dealbreak-${data.strategy}-${data.propertyName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, [data]);

  const handleShare = useCallback(async () => {
    if (!canvasRef.current) return;

    const profitStr = formatK(Math.abs(data.saleProfit));
    const verb = data.strategy === 'flip' ? 'flipping' : 'selling';
    const action = data.saleProfit >= 0 ? 'made' : 'lost';
    const text = `I just ${action} $${profitStr} ${verb} a house in this real estate simulator. Think you can do better?\n\ndealbreaksimulator.com`;

    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvasRef.current!.toBlob((b) => resolve(b!), 'image/png')
      );
      const file = new File([blob], 'dealbreak-result.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ text, files: [file] });
        return;
      }
    } catch {}

    await navigator.clipboard.writeText(
      `I just ${action} $${profitStr} ${verb} a house in this real estate simulator. Think you can do better? dealbreaksimulator.com`
    );
    alert('Link copied to clipboard!');
  }, [data]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

          <motion.div
            className="relative z-10 w-full max-w-md"
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 z-20 w-8 h-8 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
              data-testid="button-close-share-card"
              data-sound="close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <canvas
                ref={canvasRef}
                className="w-full h-auto block"
                style={{ imageRendering: 'auto' }}
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
                style={{
                  background: data.saleProfit >= 0
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.4))'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(185,28,28,0.4))',
                  border: `1.5px solid ${data.saleProfit >= 0 ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`,
                  color: data.saleProfit >= 0 ? '#6ee7b7' : '#fca5a5',
                }}
                data-testid="button-download-share-card"
              >
                <Download className="w-4 h-4" />
                Save Image
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.4))',
                  border: '1.5px solid rgba(59,130,246,0.5)',
                  color: '#93c5fd',
                }}
                data-testid="button-share-deal"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
