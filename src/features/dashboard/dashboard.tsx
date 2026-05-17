import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBatchStatistics } from './hooks';
import { BatchStatsChart } from './batch-stats-chart';

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
            <BatchStatsChart data={stats.data} isLoading={stats.isLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
