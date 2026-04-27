import type { ReactNode } from "react";
import Link from "next/link";
import { Briefcase, Users, Zap, Star } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* ─── Left — form area ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-[440px]">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center gap-0.5">
            <span className="text-xl font-bold text-primary">Fit</span>
            <span className="text-xl font-bold text-foreground">Vector</span>
            <span className="ml-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Pro
            </span>
          </Link>

          {children}
        </div>
      </div>

      {/* ─── Right — branded panel ──────────────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 lg:flex lg:w-[460px] lg:flex-col lg:justify-between xl:w-[520px]">
        {/* Decorative blobs */}
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute bottom-48 right-16 h-36 w-36 rounded-full bg-white/[0.04]" />

        {/* Top — wordmark */}
        <div className="relative z-10 p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">FitVector Pro</span>
          </div>
        </div>

        {/* Middle — hero copy + stats + testimonial */}
        <div className="relative z-10 space-y-8 px-12">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-snug text-white">
              AI-powered hiring<br />for everyone
            </h2>
            <p className="text-sm leading-relaxed text-white/65">
              Match the right talent to the right opportunity with precision — faster than ever before.
            </p>
          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <Users className="mb-2 h-4 w-4 text-white/60" />
              <p className="text-2xl font-bold text-white">10K+</p>
              <p className="mt-0.5 text-xs text-white/55">Job Seekers</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <Briefcase className="mb-2 h-4 w-4 text-white/60" />
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="mt-0.5 text-xs text-white/55">Companies</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <Zap className="mb-2 h-4 w-4 text-white/60" />
              <p className="text-2xl font-bold text-white">95%</p>
              <p className="mt-0.5 text-xs text-white/55">Match Rate</p>
            </div>
          </div>

          {/* Testimonial */}
          <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm">
            <div className="mb-3 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm italic leading-relaxed text-white/75">
              &ldquo;FitVector&apos;s AI matched me to my current role in days. The FitScore showed me exactly where I stood against every requirement.&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                AM
              </div>
              <div>
                <p className="text-sm font-medium text-white">Alex M.</p>
                <p className="text-xs text-white/55">Software Engineer · hired via FitVector</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <p className="relative z-10 p-12 text-xs text-white/35">
          © 2026 FitVector Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
}
