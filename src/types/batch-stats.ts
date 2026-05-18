export type BatchStatsProduct = {
  id: string;
  name: string;
  createdAt: number;
};

export type BatchStatsMetric = {
  name: string;
  data: number[];
};

export type BatchStatsResponse = {
  products: BatchStatsProduct[];
  metrics: BatchStatsMetric[];
};
