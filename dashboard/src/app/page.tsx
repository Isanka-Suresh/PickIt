import { redirect } from 'next/navigation'

export default function Home() {
  // Middleware handles the redirect based on auth state and role
  redirect('/login')
}
