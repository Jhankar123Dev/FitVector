"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SocialButtons } from "@/components/auth/social-buttons";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [role, setRole] = useState<"seeker" | "employer">("seeker");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Fetch CSRF token — required by the NextAuth credentials callback.
      // Using the direct API approach (mirrors signInAs helper + setup scripts)
      // to avoid next-auth/react v5 beta timing issues with the signIn() wrapper.
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

      // Step 2: POST credentials directly to the NextAuth callback endpoint.
      await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          csrfToken,
          email: data.email,
          password: data.password,
          role,
          callbackUrl: `${window.location.origin}/dashboard`,
          json: "true",
        }).toString(),
      });

      // Step 3: Check if the session was created. If NextAuth rejected the
      // credentials (wrong password, role mismatch) no session cookie is issued
      // and session.user will be absent.
      const sessionRes = await fetch("/api/auth/session");
      const session = (await sessionRes.json()) as {
        user?: { role?: string; onboardingCompleted?: boolean };
      };
      const actualRole = session?.user?.role;
      const onboarded = session?.user?.onboardingCompleted;

      if (!actualRole) {
        setError(
          role === "employer"
            ? "No recruiter account found with these credentials. If you signed up as a Job Seeker, switch to the Job Seeker tab."
            : "Invalid email or password. If you signed up as a Recruiter, switch to the Recruiter tab.",
        );
        return;
      }

      // Auth succeeded — navigate based on actual role from session.
      if (actualRole === "superadmin") {
        window.location.href = "/admin";
      } else if (actualRole === "employer") {
        window.location.href = onboarded ? "/employer" : "/employer/onboarding";
      } else {
        window.location.href = onboarded ? "/dashboard" : "/onboarding";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {role === "employer" ? "Welcome back, Recruiter" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {role === "employer"
            ? "Sign in to your recruiter dashboard"
            : "Sign in to continue your job search"}
        </p>
      </div>

      {/* Role Toggle */}
      <div className="rounded-xl border border-border bg-muted/40 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => { setRole("seeker"); setError(null); }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
              role === "seeker"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Search className="h-4 w-4" />
            Job Seeker
          </button>
          <button
            type="button"
            onClick={() => { setRole("employer"); setError(null); }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
              role === "employer"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="h-4 w-4" />
            Recruiter
          </button>
        </div>
      </div>

      {/* Social buttons — seekers only */}
      {role === "seeker" && (
        <>
          <SocialButtons callbackUrl="/dashboard" />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground/70">
                Or continue with email
              </span>
            </div>
          </div>
        </>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder={role === "employer" ? "you@company.com" : "name@example.com"}
            autoComplete="email"
            disabled={isLoading}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Signing in…
            </span>
          ) : "Sign In"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={role === "employer" ? "/signup/employer" : "/signup"}
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
