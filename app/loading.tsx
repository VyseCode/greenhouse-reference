export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" role="status" aria-label="Loading">
      <div className="h-3 w-32 animate-pulse rounded bg-line" />
      <div className="mt-4 h-8 w-64 animate-pulse rounded bg-line" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
      <div className="mt-6 h-80 animate-pulse rounded-xl border border-line bg-surface" />
    </div>
  );
}
