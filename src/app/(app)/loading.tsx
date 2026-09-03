/**
 * Shown while a section's server component resolves. Mirrors the page header
 * plus a card grid, so the layout does not jump when the content arrives.
 */
export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2.5">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-inset" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-surface-inset" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>

      <div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />
    </div>
  );
}
