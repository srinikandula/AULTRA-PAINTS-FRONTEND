import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductForm } from './product-form';
import { useProduct } from './hooks';

export function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const product = useProduct(id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      {product.isError && <p className="text-sm text-destructive">Couldn't load: {product.error.message}</p>}
      {product.isLoading || !product.data ? (
        <Skeleton className="h-[480px] w-full max-w-3xl" />
      ) : (
        <ProductForm product={product.data} />
      )}
    </div>
  );
}
