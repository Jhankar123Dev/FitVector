"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupFormProps {
  defaultRole?: "seeker" | "employer";
}

export function SignupForm({ defaultRole = "seeker" }: SignupFormProps) {
  const [role, setRole] = useState<"seeker" | "employer">(defaultRole);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    setError(null);

    const endpoint =
      role === "employer" ? "/api/auth/signup/employer" : "/api/auth/signup";
    const redirectUrl =
      role === "employer" ? "/employer/onboarding" : "/onboarding";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        role,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created but auto-login failed. Please sign in manually.");
        return;
      }

      window.location.href = redirectUrl;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const isEmployer = role === "employer";

  return (
    <div className="flex w-full flex-col space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {isEmployer ? "Create your recruiter account" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEmployer
            ? "Start hiring with AI-powered recruitment tools"
            : "Start your AI-powered job search today"}
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
      {!isEmployer && (
        <>
          <SocialButtons callbackUrl="/onboarding" />
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder={isEmployer ? "Jane Smith" : "John Doe"}
            autoComplete="name"
            disabled={isLoading}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">{isEmployer ? "Work Email" : "Email"}</Label>
          <Input
            id="email"
            type="email"
            placeholder={isEmployer ? "you@company.com" : "name@example.com"}
            autoComplete="email"
            disabled={isLoading}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Creating account…
            </span>
          ) : isEmployer ? "Create Recruiter Account" : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground/70">
        By creating an account, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
