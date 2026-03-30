export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/employer/:path*",
    "/login",
    "/signup",
    "/signup/employer",
    "/api/((?!auth|health).*)",
  ],
};
