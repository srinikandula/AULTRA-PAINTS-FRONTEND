import { ProductForm } from './product-form';

export function CreateProduct() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New product</h1>
      <ProductForm />
    </div>
  );
}
