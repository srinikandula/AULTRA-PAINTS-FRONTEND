export type PayoutTransaction = {
  _id: string;
  transfer_id: string;
  cf_transfer_id?: string;
  status: string;
  status_description?: string;
  transfer_amount: number;
  transfer_mode?: string;
  transfer_utr?: string;
  beneficiary_details?: { beneName?: string; beneAccNum?: string; beneIfscCode?: string };
  added_on?: string;
  createdAt: string;
};
