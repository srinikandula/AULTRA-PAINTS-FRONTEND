export type Deal = {
  _id: string;
  title: string;
  description?: string;
  dealImageUrl: string;
  expirationDate: string; // ISO date string from the server
  active: boolean;
  category: { _id: string; categoryName: string } | string;
  createdAt?: string;
  updatedAt?: string;
};

export type DealInput = {
  title: string;
  description?: string;
  expirationDate: string; // 'YYYY-MM-DD'
  active: boolean;
  category: string; // ObjectId string
  dealImage?: string; // base64 data URI (required on create, optional on update)
};
