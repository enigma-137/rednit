import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasSupabaseConfig } from "@/lib/env";
import type { Database } from "@/lib/types";

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";
  const isLanding = path === "/";
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.startsWith("/api/auth/callback");

  if (!user && !isLogin && !isLanding && !isPublicAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (isLogin || isLanding)) {
    const url = request.nextUrl.clone();
    url.pathname = "/discover";
    return NextResponse.redirect(url);
  }

  return response;
}
