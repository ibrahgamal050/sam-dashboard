export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white">
      <div className="max-w-md text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">404</p>
        <h1 className="mt-4 text-3xl font-semibold">We couldn't find that page</h1>
        <p className="mt-3 text-sm text-slate-300">
          The link you followed may be broken, or the page might have been removed. Double-check the address or head
          back to the dashboard.
        </p>
        <a
          href="/dashboard"
          className="mt-8 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-900 shadow hover:bg-slate-200"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  )
}
