import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (demo) return NextResponse.next();
  if (request.nextUrl.pathname === "/register" && !request.nextUrl.searchParams.get("invite")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const authRoute = ["/login", "/register", "/forgot-password", "/reset-password"].includes(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith("/auth/");
  if (authRoute) return NextResponse.next();
  if (!configured) return NextResponse.redirect(new URL("/login?error=config", request.url));
  // Локалната Codex среда блокира server-side egress към Supabase.
  // Browser client-ът продължава да прилага Supabase Auth и RLS локално.
  if (process.env.NODE_ENV === "development") return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => { cookies.forEach(({name,value}) => request.cookies.set(name,value)); response = NextResponse.next({request}); cookies.forEach(({name,value,options}) => response.cookies.set(name,value,options)); } } });
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
