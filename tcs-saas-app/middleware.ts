import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_ROUTES = ['/cart', '/checkout', '/order', '/loyalty']
const ADMIN_ROUTES = ['/admin']
const STAFF_ROUTES = ['/pos']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cs) => {
          cs.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cs.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const needsAuth = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const needsAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  const needsStaff = STAFF_ROUTES.some((r) => pathname.startsWith(r))

  if ((needsAuth || needsAdmin || needsStaff) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (needsAdmin || needsStaff) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user!.id)
      .single()

    const role = profile?.role

    if (needsAdmin && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (needsStaff && role !== 'admin' && role !== 'staff') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
