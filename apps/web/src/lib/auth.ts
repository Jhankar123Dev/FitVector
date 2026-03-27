import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { PlanTier } from "@fitvector/shared";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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
      userType: string[];
      companyId: string | null;
    };
  }

  interface User {
    planTier?: PlanTier;
    onboardingCompleted?: boolean;
    userType?: string[];
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
    userType: string[];
    companyId: string | null;
  }
}

async function getSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const supabase = await getSupabaseAdmin();

        // Hash the password the same way as signup
        const encoder = new TextEncoder();
        const data = encoder.encode(parsed.data.password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        const { data: user, error } = await supabase
          .from("users")
          .select("id, email, full_name, password_hash, plan_tier, onboarding_completed, avatar_url")
          .eq("email", parsed.data.email)
          .eq("auth_provider", "credentials")
          .single();

        if (error || !user || user.password_hash !== passwordHash) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          image: user.avatar_url,
          planTier: user.plan_tier,
          onboardingCompleted: user.onboarding_completed,
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
      // For OAuth providers, upsert the user in our database
      if (account?.provider && account.provider !== "credentials") {
        const supabase = await getSupabaseAdmin();

        const { data: existingUser } = await supabase
          .from("users")
          .select("id, plan_tier, onboarding_completed")
          .eq("email", user.email!)
          .single();

        if (existingUser) {
          user.id = existingUser.id;
          user.planTier = existingUser.plan_tier;
          user.onboardingCompleted = existingUser.onboarding_completed;
        } else {
          // Create new user for OAuth sign-in
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
            })
            .select("id")
            .single();

          if (newUser) {
            user.id = newUser.id;
            user.planTier = "free";
            user.onboardingCompleted = false;
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
      }
      if (account) {
        token.provider = account.provider;
      }

      // If id is not a UUID (OAuth providers give numeric sub IDs), look up real Supabase UUID by email
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (token.id && !isUUID.test(token.id) && token.email) {
        const supabase = await getSupabaseAdmin();
        const { data: dbUser } = await supabase
          .from("users")
          .select("id, plan_tier, onboarding_completed, user_type")
          .eq("email", token.email as string)
          .single();
        if (dbUser) {
          token.id = dbUser.id;
          token.planTier = dbUser.plan_tier;
          token.onboardingCompleted = dbUser.onboarding_completed;
          token.userType = dbUser.user_type || ["seeker"];
        }
      }

      // On initial sign-in (user is present), fetch user_type and companyId from DB
      // This works uniformly for Credentials, Google, and LinkedIn providers
      if (user && token.id) {
        const supabase = await getSupabaseAdmin();

        // Fetch user_type from DB (OAuth user object won't have it)
        const { data: dbUser } = await supabase
          .from("users")
          .select("user_type")
          .eq("id", token.id)
          .single();
        token.userType = dbUser?.user_type || ["seeker"];

        // Fetch active company membership
        const { data: membership } = await supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", token.id)
          .eq("status", "active")
          .single();
        token.companyId = membership?.company_id || null;
      }

      // Refresh user data from DB on session update (e.g., after company creation)
      if (trigger === "update") {
        const supabase = await getSupabaseAdmin();
        const { data: freshUser } = await supabase
          .from("users")
          .select("plan_tier, onboarding_completed, user_type")
          .eq("id", token.id)
          .single();

        if (freshUser) {
          token.planTier = freshUser.plan_tier;
          token.onboardingCompleted = freshUser.onboarding_completed;
          token.userType = freshUser.user_type || ["seeker"];
        }

        // Refresh company membership
        const { data: membership } = await supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", token.id)
          .eq("status", "active")
          .single();
        token.companyId = membership?.company_id || null;
      }

      // Ensure defaults for tokens that were created before this update
      if (!token.userType) token.userType = ["seeker"];
      if (token.companyId === undefined) token.companyId = null;

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.planTier = (token.planTier as PlanTier) ?? "free";
      session.user.onboardingCompleted = (token.onboardingCompleted as boolean) ?? false;
      session.user.userType = (token.userType as string[]) ?? ["seeker"];
      session.user.companyId = (token.companyId as string | null) ?? null;
      return session;
    },
    authorized({ auth: authResult, request }) {
      const isLoggedIn = !!authResult?.user;
      const { pathname } = request.nextUrl;
      const isOnProtectedRoute =
        pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding") || pathname.startsWith("/employer");

      if (isOnProtectedRoute && !isLoggedIn) {
        return false;
      }

      // Redirect authenticated users away from auth pages
      if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
        const redirectTo = authResult.user.onboardingCompleted ? "/dashboard" : "/onboarding";
        return Response.redirect(new URL(redirectTo, request.nextUrl.origin));
      }

      return true;
    },
  },
});
