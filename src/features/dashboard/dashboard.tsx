import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBatchStatistics } from './hooks';

const BatchStatsChart = lazy(() =>
  import('./batch-stats-chart').then((m) => ({ default: m.BatchStatsChart })),
);

export function Dashboard() {
  const stats = useBatchStatistics();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Batch statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.isError ? (
            <p className="text-sm text-destructive">
              Couldn't load chart: {stats.error.message}
            </p>
          ) : (
            <Suspense fallback={<Skeleton className="h-[360px] w-full" />}>
              <BatchStatsChart data={stats.data} isLoading={stats.isLoading} />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
