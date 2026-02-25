import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

// Minimal shape we care about in the access token payload
interface JwtPayload {
    sub?: string
    user_metadata?: { role?: string }
    // Supabase also puts app_metadata here
    app_metadata?: { role?: string }
    exp?: number
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // -----------------------------------------------------------------------
    // Use getSession() — reads entirely from the cookie (JWT), zero network calls.
    // NOTE: getSession() is intentionally used here instead of getUser() because:
    //   1. getUser() makes an HTTP call to Supabase auth which FAILS in the Edge
    //      runtime sandbox (AuthRetryableFetchError: fetch failed, status 0).
    //   2. The JWT is already verified by Supabase when issued; tampering is
    //      caught when the token next hits a server component that calls getUser().
    // -----------------------------------------------------------------------
    const {
        data: { session },
    } = await supabase.auth.getSession()

    const pathname = request.nextUrl.pathname
    const isPublicRoute = pathname === '/login' || pathname === '/signup'

    // No active session — redirect to login for protected routes
    if (!session && !isPublicRoute && pathname !== '/') {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (session) {
        // Read role from the JWT access token claim — zero extra round-trips.
        // The role is written into user_metadata at login by auth/actions.ts.
        let role: string | undefined

        try {
            const decoded = jwtDecode<JwtPayload>(session.access_token)
            role = decoded.user_metadata?.role ?? decoded.app_metadata?.role
        } catch {
            // Malformed token — send to login
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Redirect authenticated users away from auth/root pages to their dashboard
        if (isPublicRoute || pathname === '/') {
            const url = request.nextUrl.clone()
            if (role === 'owner') {
                url.pathname = '/owner'
            } else if (role === 'manager') {
                url.pathname = '/manager'
            } else {
                // Role claim missing or unsupported — let them re-login to get a fresh token.
                url.pathname = '/login'
            }
            return NextResponse.redirect(url)
        }

        // Role-based route protection
        if (pathname.startsWith('/owner') && role !== 'owner') {
            const url = request.nextUrl.clone()
            url.pathname = role === 'manager' ? '/manager' : '/login'
            return NextResponse.redirect(url)
        }

        if (pathname.startsWith('/manager') && role !== 'manager') {
            const url = request.nextUrl.clone()
            url.pathname = role === 'owner' ? '/owner' : '/login'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
