import { Save, Cloud } from 'lucide-react';
import { hasSavedGame, clearSave } from '@/lib/saveGame';
import { useState, useEffect } from 'react';

interface SaveIndicatorProps {
  onClearSave?: () => void;
}

export function SaveIndicator({ onClearSave }: SaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    const checkSave = () => {
      setHasSave(hasSavedGame());
    };
    checkSave();
    
    const interval = setInterval(checkSave, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasSave) {
      setShowSaved(true);
      const timeout = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [hasSave]);

  if (!hasSave) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-lg border border-emerald-500/30 text-emerald-400 text-sm transition-all duration-300"
      style={{ opacity: showSaved ? 1 : 0.6 }}
      data-testid="save-indicator"
    >
      <Cloud className="w-4 h-4" />
      <span>Saved locally</span>
    </div>
  );
}
