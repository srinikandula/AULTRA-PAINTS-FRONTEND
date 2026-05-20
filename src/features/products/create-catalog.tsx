import { CatalogForm } from './catalog-form';

export function CreateCatalog() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add product to catalog</h1>
      <CatalogForm />
    </div>
  );
}
