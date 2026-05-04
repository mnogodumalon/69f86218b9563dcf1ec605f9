import type { Bro } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'MMM d, yyyy'); } catch { return d; }
}

interface BroViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Bro | null;
  onEdit: (record: Bro) => void;
}

export function BroViewDialog({ open, onClose, record, onEdit }: BroViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Bro</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorname</Label>
            <p className="text-sm">{record.fields.vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachname</Label>
            <p className="text-sm">{record.fields.nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachricht</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.nachricht ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum</Label>
            <p className="text-sm">{formatDate(record.fields.datum)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}