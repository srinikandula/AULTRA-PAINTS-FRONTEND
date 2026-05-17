export type LedgerRow = {
  _id: string;
  narration: string;
  pointsCredited?: string;     // '+ NNN' / '- NNN' format (legacy convention preserved)
  pointsBalance?: number;
  cashReward?: number;
  cashBalance?: number;
  userId?: string;
  couponId?: string;
  uniqueCode?: string;
  creditNoteIssued?: boolean;
  createdAt: string;
  updatedAt: string;
};
