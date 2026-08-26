import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/shared/auth/cookies";
import { verifyAccessToken } from "@/shared/auth/access-token";

const protectedPaths = ["/dashboard", "/api/schools", "/api/users", "/api/v1"];
const publicApiPaths = [
  "/api/v1/auth/login",
  "/api/v1/auth/signup",
  "/api/v1/auth/refresh",
  "/api/v1/payments/webhook",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh"
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (publicApiPaths.some((prefix) => path.startsWith(prefix))) {
    return response;
  }

  if (!protectedPaths.some((prefix) => path.startsWith(prefix))) {
    return response;
  }

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return redirectToLogin(request);
  }

  try {
    const session = await verifyAccessToken(token);
    if (!session.schoolId && !path.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding/school", request.url));
    }

    response.headers.set("x-educare-school-id", session.schoolId ?? "");
    response.headers.set("x-educare-user-id", session.userId);
    response.headers.set("x-educare-role", session.role);
    return response;
  } catch {
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: { message: "Unauthenticated" } }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"]
};
