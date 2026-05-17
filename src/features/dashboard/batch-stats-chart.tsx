import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { BatchStatsResponse } from '@/types/batch-stats';

type Props = {
  data?: BatchStatsResponse;
  isLoading: boolean;
};

// Predefined palette matches the Highcharts defaults we used before so the
// dashboard's overall hue stays close.
const COLORS = ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354'];

export function BatchStatsChart({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return <Skeleton className="h-[360px] w-full" />;
  }

  // Pivot the Angular response shape (products + metrics) into the row shape
  // Recharts expects: one row per product, one key per metric.
  const rows = data.products.map((p, i) => {
    const row: Record<string, string | number> = { name: p.name };
    data.metrics.forEach((m) => { row[m.name] = m.data[i] ?? 0; });
    return row;
  });

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {data.metrics.map((m, i) => (
            <Bar key={m.name} dataKey={m.name} fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
