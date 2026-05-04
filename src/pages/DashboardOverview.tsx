import { useDashboardData } from '@/hooks/useDashboardData';
import type { Bro } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { BroDialog } from '@/components/dialogs/BroDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash, IconSearch, IconMessage, IconUser, IconCalendar, IconMoodSmile } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';

const APPGROUP_ID = '69f86218b9563dcf1ec605f9';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    bro,
    loading, error, fetchAll,
  } = useDashboardData();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Bro | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bro | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return bro;
    return bro.filter(r =>
      (r.fields.vorname ?? '').toLowerCase().includes(q) ||
      (r.fields.nachname ?? '').toLowerCase().includes(q) ||
      (r.fields.nachricht ?? '').toLowerCase().includes(q)
    );
  }, [bro, search]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return bro.filter(r => {
      if (!r.fields.datum) return false;
      const d = new Date(r.fields.datum);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  }, [bro]);

  const handleCreate = async (fields: Bro['fields']) => {
    await LivingAppsService.createBroEntry(fields);
    fetchAll();
  };

  const handleEdit = async (fields: Bro['fields']) => {
    if (!editRecord) return;
    await LivingAppsService.updateBroEntry(editRecord.record_id, fields);
    setEditRecord(null);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteBroEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nachrichten-Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Alle Beiträge auf einen Blick</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="shrink-0 gap-2">
          <IconPlus size={16} className="shrink-0" />
          <span>Neue Nachricht</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          title="Nachrichten gesamt"
          value={String(bro.length)}
          description="Alle Einträge"
          icon={<IconMessage size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Diesen Monat"
          value={String(thisMonth)}
          description="Neue Nachrichten"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Absender"
          value={String(new Set(bro.map(r => `${r.fields.vorname ?? ''} ${r.fields.nachname ?? ''}`.trim()).filter(Boolean)).size)}
          description="Verschiedene Personen"
          icon={<IconUser size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
        <Input
          placeholder="Suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Messages Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center">
            <IconMoodSmile size={32} className="text-muted-foreground" stroke={1.5} />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {search ? 'Keine Treffer' : 'Noch keine Nachrichten'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Versuch einen anderen Suchbegriff.' : 'Füge die erste Nachricht hinzu!'}
            </p>
          </div>
          {!search && (
            <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} variant="outline" className="gap-2">
              <IconPlus size={16} />
              Nachricht hinzufügen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(record => (
            <MessageCard
              key={record.record_id}
              record={record}
              onEdit={() => { setEditRecord(record); setDialogOpen(true); }}
              onDelete={() => setDeleteTarget(record)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <BroDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={editRecord ? handleEdit : handleCreate}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Bro']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Bro']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Nachricht löschen"
        description={`Möchtest du die Nachricht von ${deleteTarget?.fields.vorname ?? ''} ${deleteTarget?.fields.nachname ?? ''} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function MessageCard({
  record,
  onEdit,
  onDelete,
}: {
  record: Bro;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const name = [record.fields.vorname, record.fields.nachname].filter(Boolean).join(' ') || 'Unbekannt';
  const initials = name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const colors = [
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-pink-100 text-pink-700',
    'bg-amber-100 text-amber-700',
    'bg-emerald-100 text-emerald-700',
    'bg-sky-100 text-sky-700',
  ];
  const colorClass = colors[name.charCodeAt(0) % colors.length];

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow overflow-hidden">
      {/* Author + Date */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${colorClass}`}>
            {initials || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate text-sm">{name}</p>
            {record.fields.datum && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <IconCalendar size={11} className="shrink-0" />
                <span>{formatDate(record.fields.datum)}</span>
              </p>
            )}
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Bearbeiten"
          >
            <IconPencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            title="Löschen"
          >
            <IconTrash size={15} />
          </button>
        </div>
      </div>

      {/* Message */}
      {record.fields.nachricht ? (
        <p className="text-sm text-foreground leading-relaxed line-clamp-4 whitespace-pre-line">
          {record.fields.nachricht}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">Keine Nachricht</p>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Starting repair...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte lade die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Repariere...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte wende dich an den Support.</p>}
    </div>
  );
}
