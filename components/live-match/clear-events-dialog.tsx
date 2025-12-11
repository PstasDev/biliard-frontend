'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ClearEventsDialogProps {
  eventCount: number;
  onConfirm: () => void;
  disabled?: boolean;
}

export function ClearEventsDialog({
  eventCount,
  onConfirm,
  disabled = false
}: ClearEventsDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="w-full h-10 text-xs border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
        >
          🗑 Összes esemény törlése ({eventCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <span className="text-2xl">⚠️</span>
            Összes esemény törlése
          </DialogTitle>
          <DialogDescription className="pt-4">
            Biztosan törölni szeretnéd <strong className="text-foreground">{eventCount} eseményt</strong> ebből a frame-ből?
            <br /><br />
            <span className="text-destructive font-semibold">
              Ez a művelet nem vonható vissza!
            </span>
            <br /><br />
            Minden belőtt golyó, szabálytalanság és játékosváltás törlődni fog.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Mégse
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            className="font-bold"
          >
            Igen, törlöm mind
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
