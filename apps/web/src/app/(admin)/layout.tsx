import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "./_components/admin-shell";

/**
 * Server-side auth guard for all /admin routes.
 * This runs on the server — zero HTML is sent to unauthenticated users.
 * Client-side useSession() guards are NOT used here because they allow the
 * server to send HTML before JS kicks in and the redirect happens.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "superadmin") {
    // Authenticated but not an admin — send to their own dashboard
    redirect("/dashboard");
  }

  return <AdminShell>{children}</AdminShell>;
}
