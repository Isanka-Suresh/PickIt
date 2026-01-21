import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Use anon key - standard Supabase pattern
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
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role

        // If profile doesn't exist or fetch failed, sign out the user
        if (profileError || !profile) {
            await supabase.auth.signOut()
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Redirect from auth pages to appropriate dashboard
        if (isPublicRoute || pathname === '/') {
            const url = request.nextUrl.clone()
            if (role === 'owner') {
                url.pathname = '/owner'
            } else if (role === 'manager') {
                url.pathname = '/manager'
            } else if (role === 'customer') {
                // Customer role - sign out and show error
                // Customers don't have a dashboard in this system
                await supabase.auth.signOut()
                url.pathname = '/login'
                // Note: We can't pass error message through redirect
                // Consider using URL params or creating a customer portal
            } else {
                // Unknown role - sign out for security
                await supabase.auth.signOut()
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
