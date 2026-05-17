import { useLocation } from 'react-router-dom';

// Rendered by every route that has not yet been ported from the Angular app.
// Each Phase 4-6 task replaces one of these references with the real component.
export function FeatureStub({ name }: { name: string }) {
  const { pathname } = useLocation();
  return (
    <div className="rounded-md border border-dashed bg-muted/30 p-6">
      <h2 className="text-lg font-semibold">TODO: port "{name}"</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Route <code className="rounded bg-muted px-1">{pathname}</code> renders this placeholder until the Phase 4-6 task lands.
      </p>
    </div>
  );
}
