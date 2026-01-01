import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

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
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Public routes - no protection needed
    const isPublicRoute = pathname === '/login' || pathname === '/signup'

    // If no user and trying to access protected routes
    if (!user && !isPublicRoute && pathname !== '/') {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user is authenticated
    if (user) {
        // Fetch user role from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role

        // Redirect from auth pages to appropriate dashboard
        if (isPublicRoute || pathname === '/') {
            const url = request.nextUrl.clone()
            if (role === 'owner') {
                url.pathname = '/owner'
            } else if (role === 'manager') {
                url.pathname = '/manager'
            } else {
                // Customer or unknown role - redirect to login for now
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
