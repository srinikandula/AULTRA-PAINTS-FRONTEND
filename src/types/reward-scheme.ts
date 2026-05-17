export type RewardScheme = {
  _id: string;
  name: string;
  description?: string;
  rewardSchemeImageUrl?: string;
  pointsThreshold?: number;
  validFrom?: string;
  validUntil?: string;
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};
