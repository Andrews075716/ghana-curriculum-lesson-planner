/**
 * Temporary placeholder used while routes are scaffolded but not yet implemented.
 * Replace with the real page content when the corresponding feature is built.
 */
export function RouteStub({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">
        This route is scaffolded and not yet implemented.
      </p>
    </div>
  );
}
