import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="app-shell-grid flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel max-w-xl rounded-[36px] border border-white/70 bg-white/85 p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">404</p>
        <h1 className="mt-3 font-display text-4xl text-ink-950">Route not found</h1>
        <p className="mt-4 text-sm leading-7 text-ink-800">
          This page does not exist in the current frontend foundation. Move back into the protected dashboard flow to continue.
        </p>
        <Link to="/dashboard" className="mt-6 inline-flex rounded-full bg-ink-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-leaf-600">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}

export default NotFoundPage;
