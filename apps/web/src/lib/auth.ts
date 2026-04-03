import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { PlanTier } from "@fitvector/shared";
import { createAdminClient } from "@/lib/supabase/admin";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["seeker", "employer"]).optional().default("seeker"),
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      planTier: PlanTier;
      onboardingCompleted: boolean;
      role: "seeker" | "employer" | "superadmin";
      companyId: string | null;
    };
  }

  interface User {
    planTier?: PlanTier;
    onboardingCompleted?: boolean;
    role?: "seeker" | "employer" | "superadmin";
    companyId?: string | null;
  }
}

// next-auth v5 beta: extend the JWT token type via the "next-auth" module
// (the "next-auth/jwt" subpath doesn't exist in this beta build).
declare module "next-auth" {
  interface JWT {
    id: string;
    provider?: string;
    planTier: PlanTier;
    onboardingCompleted: boolean;
    role: "seeker" | "employer" | "superadmin";
    companyId: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Calendar scopes are handled separately via /api/calendar/google/connect
      // to keep login and calendar authorization fully decoupled
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const supabase = createAdminClient();

        // Single table query — users holds both seekers and employers
        const { data: user, error } = await supabase
          .from("users")
          .select("id, email, full_name, password_hash, plan_tier, onboarding_completed, avatar_url, role")
          .eq("email", parsed.data.email)
          .eq("auth_provider", "credentials")
          .single();

        if (error || !user || !user.password_hash) {
          return null;
        }

        // bcrypt comparison (replaces SHA-256)
        const isValid = await bcrypt.compare(parsed.data.password, user.password_hash);
        if (!isValid) {
          return null;
        }

        // Superadmins can log in without a role toggle match
        if (user.role !== "superadmin" && user.role !== parsed.data.role) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          image: user.avatar_url,
          planTier: user.plan_tier,
          onboardingCompleted: user.onboarding_completed,
          role: user.role as "seeker" | "employer" | "superadmin",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, upsert the user in our database (OAuth = seeker-only)
      if (account?.provider && account.provider !== "credentials") {
        const supabase = createAdminClient();

        const { data: existingUser } = await supabase
          .from("users")
          .select("id, plan_tier, onboarding_completed, role")
          .eq("email", user.email!)
          .single();

        if (existingUser) {
          // If the existing user is an employer, block OAuth login
          // (employers must use credentials via the Recruiter portal)
          if (existingUser.role === "employer") {
            return false;
          }
          user.id = existingUser.id;
          user.planTier = existingUser.plan_tier;
          user.onboardingCompleted = existingUser.onboarding_completed;
          user.role = existingUser.role as "seeker" | "employer";
        } else {
          // Create new user for OAuth sign-in (always seeker)
          const { data: newUser } = await supabase
            .from("users")
            .insert({
              email: user.email!,
              full_name: user.name || "",
              avatar_url: user.image || null,
              auth_provider: account.provider as "google" | "linkedin",
              plan_tier: "free",
              status: "active",
              onboarding_completed: false,
              role: "seeker",
            })
            .select("id")
            .single();

          if (newUser) {
            user.id = newUser.id;
            user.planTier = "free";
            user.onboardingCompleted = false;
            user.role = "seeker";
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id!;
        token.planTier = user.planTier || "free";
        token.onboardingCompleted = user.onboardingCompleted || false;
        token.role = user.role || "seeker";
      }
      if (account) {
        token.provider = account.provider;
      }

      // Single shared client for all DB lookups in this callback
      const supabase = createAdminClient();

      // If id is not a UUID (OAuth providers give numeric sub IDs), look up real Supabase UUID by email
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (token.id && !isUUID.test(String(token.id)) && token.email) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("id, plan_tier, onboarding_completed, role")
          .eq("email", token.email as string)
          .single();
        if (dbUser) {
          token.id = dbUser.id;
          token.planTier = dbUser.plan_tier;
          token.onboardingCompleted = dbUser.onboarding_completed;
          token.role = dbUser.role as "seeker" | "employer" | "superadmin";
        }
      }

      // On initial sign-in, fetch companyId for employers
      if (user && token.id) {
        if (token.role === "employer") {
          const { data: membership } = await supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", token.id)
            .eq("status", "active")
            .single();
          token.companyId = membership?.company_id || null;
        } else {
          token.companyId = null;
        }
      }

      // Refresh user data from DB on session update (e.g., after company creation)
      if (trigger === "update") {
        const { data: freshUser } = await supabase
          .from("users")
          .select("plan_tier, onboarding_completed, role")
          .eq("id", token.id)
          .single();

        if (freshUser) {
          token.planTier = freshUser.plan_tier;
          token.onboardingCompleted = freshUser.onboarding_completed;
          token.role = freshUser.role as "seeker" | "employer" | "superadmin";
        }

        // Refresh company membership for employers
        if (token.role === "employer") {
          const { data: membership } = await supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", token.id)
            .eq("status", "active")
            .single();
          token.companyId = membership?.company_id || null;
        } else {
          token.companyId = null;
        }
      }

      // Ensure defaults for tokens created before this update
      if (!token.role) token.role = "seeker";
      if (token.companyId === undefined) token.companyId = null;

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.planTier = (token.planTier as PlanTier) ?? "free";
      session.user.onboardingCompleted = (token.onboardingCompleted as boolean) ?? false;
      session.user.role = (token.role as "seeker" | "employer" | "superadmin") ?? "seeker";
      session.user.companyId = (token.companyId as string | null) ?? null;
      return session;
    },
    authorized({ auth: authResult, request }) {
      const isLoggedIn = !!authResult?.user;
      const { pathname } = request.nextUrl;
      const isOnProtectedRoute =
        pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding") || pathname.startsWith("/employer") || pathname.startsWith("/admin");

      if (isOnProtectedRoute && !isLoggedIn) {
        return false;
      }

      const role = authResult?.user?.role as "seeker" | "employer" | "superadmin" | undefined;

      // Redirect authenticated users away from auth pages
      if (isLoggedIn && (pathname === "/login" || pathname === "/signup" || pathname.startsWith("/signup/"))) {
        let redirectTo: string;
        if (role === "superadmin") {
          redirectTo = "/admin";
        } else if (role === "employer") {
          redirectTo = authResult!.user.onboardingCompleted ? "/employer" : "/employer/onboarding";
        } else {
          redirectTo = authResult!.user.onboardingCompleted ? "/dashboard" : "/onboarding";
        }
        return Response.redirect(new URL(redirectTo, request.nextUrl.origin));
      }

      // Role-based route enforcement
      if (isLoggedIn) {
        // Non-superadmin trying to access /admin
        if (role !== "superadmin" && pathname.startsWith("/admin")) {
          return Response.redirect(new URL("/dashboard", request.nextUrl.origin));
        }

        // Superadmins bypass all other role checks
        if (role === "superadmin") {
          return true;
        }

        // Seeker trying to access employer routes
        if (role === "seeker" && pathname.startsWith("/employer")) {
          return Response.redirect(new URL("/dashboard", request.nextUrl.origin));
        }

        // Employer trying to access seeker routes
        if (role === "employer" && (pathname.startsWith("/dashboard") || pathname === "/onboarding")) {
          const dest = authResult!.user.onboardingCompleted ? "/employer" : "/employer/onboarding";
          return Response.redirect(new URL(dest, request.nextUrl.origin));
        }
      }

      return true;
    },
  },
});
