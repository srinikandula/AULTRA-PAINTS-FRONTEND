// Backend ProductCategory is `{ _id, name }` plus timestamps. UI keeps the
// friendlier `categoryName` label; hooks adapt at the boundary.
export type ProductCategory = {
  _id: string;
  categoryName: string;
  description?: string;
};
