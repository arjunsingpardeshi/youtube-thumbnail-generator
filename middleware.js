import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in", "/sign-up", "/"]);
const isProtectedRoute = createRouteMatcher(["/dashboard"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  console.log("Middleware:", req.url, "userId:", userId);

  // 1️⃣ USER IS LOGGED IN
  if (userId) {
    if (isPublicRoute(req)) {
      console.log(" Logged-in user accessing public route → redirect to /dashboard");
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // allow access to /dashboard
    return NextResponse.next();
  }

  // USER IS NOT LOGGED IN
  if (!userId) {
    if (isProtectedRoute(req)) {
      console.log("Not logged in redirect to /sign-in");
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // allow "/sign-in", "/sign-up", "/"
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)",
    "/(api|trpc)(.*)",
  ],
};
