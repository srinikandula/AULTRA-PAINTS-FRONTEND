// Brand exposed to UI. Backend stores only `{ _id, name }`; hooks adapt to the
// UI-friendly `brandName` and carry an optional `description` so existing forms
// keep compiling even though it isn't persisted today.
export type Brand = {
  _id: string;
  brandName: string;
  description?: string;
};
