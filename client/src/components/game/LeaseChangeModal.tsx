import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeyRound, Truck, Home } from 'lucide-react';

export interface LeaseChangeEvent {
  id: string;
  kind: 'move_in' | 'move_out';
  propertyId?: number;
  propertyName: string;
  tenantName?: string;
  description: string;
  emoji?: string;
}

interface LeaseChangeModalProps {
  open: boolean;
  events: LeaseChangeEvent[];
  onClose: () => void;
}

export function LeaseChangeModal({ open, events, onClose }: LeaseChangeModalProps) {
  // Group events by property (unit) so each unit shows its own move-in/move-out
  const byProperty = new Map<string, { name: string; events: LeaseChangeEvent[] }>();
  for (const ev of events) {
    const name = ev.propertyName || 'Your Property';
    const key = ev.propertyId != null ? `id-${ev.propertyId}` : name;
    if (!byProperty.has(key)) byProperty.set(key, { name, events: [] });
    byProperty.get(key)!.events.push(ev);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md bg-[hsl(220,16%,9%)] border border-white/10 text-white" data-testid="lease-change-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white/90">
            <Home className="w-5 h-5 text-cyan-400" />
            Tenant Update
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {Array.from(byProperty.entries()).map(([key, group]) => (
            <div
              key={key}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
              data-testid={`lease-change-unit-${group.name.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                {group.name}
              </div>
              <div className="space-y-2.5">
                {group.events.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    {ev.kind === 'move_in' ? (
                      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-400/30">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      </span>
                    ) : (
                      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/15 border border-orange-400/30">
                        <Truck className="w-3.5 h-3.5 text-orange-400" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold ${ev.kind === 'move_in' ? 'text-emerald-300' : 'text-orange-300'}`}>
                        {ev.tenantName ? ev.tenantName.split(' ')[0] : 'Tenant'}{' '}
                        {ev.kind === 'move_in' ? 'moved in' : 'moved out'}
                      </div>
                      <div className="text-xs text-white/60 leading-relaxed mt-0.5">
                        {ev.emoji ? `${ev.emoji} ` : ''}{ev.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
          data-testid="button-lease-change-ok"
        >
          Got It
        </Button>
      </DialogContent>
    </Dialog>
  );
}
