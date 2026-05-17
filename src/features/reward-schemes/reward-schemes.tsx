import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogTrigger,
} from '@/components/ui/dialog';
import {
  useRewardSchemes, useUpdateRewardScheme, useDeleteRewardScheme,
} from './hooks';
import { SchemeFormDialog } from './scheme-form-dialog';
import type { RewardScheme } from '@/types/reward-scheme';

function StatusPill({ status }: { status: 'Active' | 'Inactive' }) {
  return status === 'Active' ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Inactive
    </span>
  );
}

export function RewardSchemes() {
  const { data, isLoading, isError, error } = useRewardSchemes();
  const update = useUpdateRewardScheme();
  const remove = useDeleteRewardScheme();
  const [editing, setEditing] = useState<RewardScheme | null>(null);
  const [creating, setCreating] = useState(false);

  const onToggleStatus = (scheme: RewardScheme, nextActive: boolean) => {
    update.mutate(
      {
        _id: scheme._id,
        rewardSchemeStatus: nextActive ? 'Active' : 'Inactive',
      },
      {
        onSuccess: () => toast.success('Status updated'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const onDelete = (scheme: RewardScheme) => {
    remove.mutate(
      { _id: scheme._id },
      {
        onSuccess: () => toast.success('Scheme deleted'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reward schemes</h1>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New scheme</Button>
          </DialogTrigger>
          {creating && <SchemeFormDialog onClose={() => setCreating(false)} />}
        </Dialog>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Couldn't load: {error.message}</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : data && data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reward schemes yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((s) => (
            <Card key={s._id} className="overflow-hidden">
              <div className="relative">
                {s.rewardSchemeImageUrl ? (
                  <img
                    src={s.rewardSchemeImageUrl}
                    alt="Reward scheme"
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="absolute left-2 top-2">
                  <StatusPill status={s.rewardSchemeStatus} />
                </div>
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-background/90 p-1 shadow-sm">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditing(s)}
                    aria-label="Edit scheme"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onDelete(s)}
                    aria-label="Delete scheme"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="flex items-center justify-between p-3">
                <span className="text-sm text-muted-foreground">
                  {s.rewardSchemeStatus === 'Active' ? 'Visible' : 'Hidden'}
                </span>
                <Switch
                  checked={s.rewardSchemeStatus === 'Active'}
                  onCheckedChange={(c) => onToggleStatus(s, c)}
                  aria-label="Toggle scheme status"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && <SchemeFormDialog scheme={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </div>
  );
}
