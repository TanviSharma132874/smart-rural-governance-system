import { Link } from "react-router-dom";

function AuthLayout({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  return (
    <main className="app-shell-grid min-h-screen px-4 py-8 md:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[40px] border border-white/70 bg-white/65 shadow-[0_24px_80px_rgba(23,32,51,0.14)] backdrop-blur xl:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,201,106,0.45),_transparent_35%),linear-gradient(135deg,_#1f2f4f_0%,_#243a5c_50%,_#22634d_100%)] p-8 text-white md:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.04)_46%,transparent_100%)]" />
          <div className="relative page-enter">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-amber-200">Smart Rural Governance</p>
            <h1 className="mt-6 max-w-lg font-display text-4xl leading-tight md:text-5xl">
              Governance workflows for villages that need speed, trust, and accountability.
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/82 md:text-base">
              Login or create your account to raise local issues, route them through the right officers, and keep the complaint lifecycle transparent from submission to resolution.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { label: "Role-ready", value: "Citizen & Officer" },
                { label: "Workflow", value: "Pending to Resolved" },
                { label: "Evidence", value: "Image uploads enabled" },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/70">{item.label}</p>
                  <p className="mt-2 font-display text-lg">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white/75 p-6 md:p-10">
          <div className="page-enter w-full max-w-xl rounded-[34px] border border-slate-100 bg-white p-8 shadow-[0_18px_60px_rgba(23,32,51,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Access Portal</p>
            <h2 className="mt-3 font-display text-3xl text-ink-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink-800">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-sm text-ink-800">
              {footerText}{" "}
              <Link className="font-bold text-leaf-600 transition hover:text-leaf-500" to={footerLink}>
                {footerLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthLayout;
