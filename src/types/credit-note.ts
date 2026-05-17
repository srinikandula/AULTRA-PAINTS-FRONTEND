export type CreditNote = {
  _id: string;
  creditNoteNumber: string;
  userId: string;
  balanceType: 'rewardPoints' | 'cash';
  amount: number;
  narration?: string;
  status: 'issued' | 'redeemed' | 'cancelled';
  ledgerId?: string;
  createdAt: string;
  updatedAt: string;
};
