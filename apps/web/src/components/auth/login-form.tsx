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
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        role,
        redirect: false,
      });

      if (result?.error) {
        setError(
          role === "employer"
            ? "Invalid credentials. Make sure you're using the correct portal."
            : "Invalid email or password. Please try again."
        );
      } else {
        window.location.href = role === "employer" ? "/employer" : "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 rounded-xl border border-surface-200 bg-white p-8 shadow-card sm:w-[440px]">
      {/* Role Toggle */}
      <div className="flex flex-col space-y-3">
        <p className="text-center text-sm font-medium text-surface-600">Sign in as</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setRole("seeker"); setError(null); }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-4 transition-all",
              role === "seeker"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-surface-200 text-surface-500 hover:border-surface-300"
            )}
          >
            <Search className="h-6 w-6" />
            <span className="text-sm font-medium">Job Seeker</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole("employer"); setError(null); }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-4 transition-all",
              role === "employer"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-surface-200 text-surface-500 hover:border-surface-300"
            )}
          >
            <Building2 className="h-6 w-6" />
            <span className="text-sm font-medium">Recruiter</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-surface-800">
          {role === "employer" ? "Welcome back, Recruiter!" : "Welcome back"}
        </h1>
        <p className="text-sm text-surface-500">
          {role === "employer"
            ? "Sign in to your recruiter dashboard"
            : "Sign in to your FitVector account"}
        </p>
      </div>

      {/* Social buttons only for seekers (OAuth = seeker-only) */}
      {role === "seeker" && (
        <>
          <SocialButtons callbackUrl="/dashboard" />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-surface-400">Or continue with email</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder={role === "employer" ? "you@company.com" : "name@example.com"}
            autoComplete="email"
            disabled={isLoading}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isLoading}
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="px-8 text-center text-sm text-surface-500">
        Don&apos;t have an account?{" "}
        <Link
          href={role === "employer" ? "/signup/employer" : "/signup"}
          className="font-medium text-brand-500 hover:text-brand-600"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
